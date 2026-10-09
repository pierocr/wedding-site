import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createRsvpEditToken, hashRsvpEditSecret } from "@/lib/rsvpEditAccess";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const verificationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});

function dietaryPreference(row: {
  vegetarian: boolean;
  pescatarian: boolean;
  vegan: boolean;
}) {
  if (row.vegetarian) return "vegetarian" as const;
  if (row.pescatarian) return "pescatarian" as const;
  if (row.vegan) return "vegan" as const;
  return "" as const;
}

export async function POST(req: NextRequest) {
  const parsed = verificationSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Ingresa el código de 6 dígitos." },
      { status: 422 },
    );
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: verification, error } = await supabase
    .from("rsvp_edit_verifications")
    .select("id, rsvp_id, code_hash, attempt_count")
    .eq("email", parsed.data.email)
    .is("used_at", null)
    .gt("code_expires_at", now)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("RSVP edit verification lookup error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos validar el código. Intenta nuevamente.",
      },
      { status: 500 },
    );
  }

  if (!verification || verification.attempt_count >= 5) {
    return NextResponse.json(
      { ok: false, message: "El código no es válido o ya venció." },
      { status: 400 },
    );
  }

  const isValid =
    verification.code_hash === (await hashRsvpEditSecret(parsed.data.code));
  if (!isValid) {
    await supabase
      .from("rsvp_edit_verifications")
      .update({ attempt_count: verification.attempt_count + 1 })
      .eq("id", verification.id);
    return NextResponse.json(
      { ok: false, message: "El código no es válido o ya venció." },
      { status: 400 },
    );
  }

  const editToken = createRsvpEditToken();
  const { error: tokenError } = await supabase
    .from("rsvp_edit_verifications")
    .update({
      verified_at: now,
      attempt_count: verification.attempt_count + 1,
      access_token_hash: await hashRsvpEditSecret(editToken),
      access_expires_at: new Date(Date.now() + 20 * 60_000).toISOString(),
    })
    .eq("id", verification.id);

  if (tokenError) {
    console.error("RSVP edit token update error:", tokenError);
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos preparar tu confirmación. Intenta nuevamente.",
      },
      { status: 500 },
    );
  }

  const { data: rsvp, error: rsvpError } = await supabase
    .from("rsvp")
    .select(
      "name, email, phone, attending_status, vegetarian, pescatarian, vegan, diet, companion_status, message",
    )
    .eq("id", verification.rsvp_id)
    .eq("is_companion", false)
    .single();
  const { data: companion, error: companionError } = await supabase
    .from("rsvp")
    .select("name, email, phone, vegetarian, pescatarian, vegan, diet")
    .eq("companion_of_rsvp_id", verification.rsvp_id)
    .eq("is_companion", true)
    .maybeSingle();

  if (rsvpError || companionError || !rsvp) {
    console.error("RSVP edit data lookup error:", rsvpError || companionError);
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos cargar tu confirmación. Intenta nuevamente.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    edit_token: editToken,
    form: {
      name: rsvp.name,
      email: rsvp.email,
      phone: rsvp.phone || "",
      attending_status: rsvp.attending_status,
      dietary_preference: dietaryPreference(rsvp),
      diet: rsvp.diet || "",
      companion_status: rsvp.companion_status,
      companion_name: companion?.name || "",
      companion_email: companion?.email || "",
      companion_phone: companion?.phone || "",
      companion_dietary_preference: companion
        ? dietaryPreference(companion)
        : "",
      companion_diet: companion?.diet || "",
      message: rsvp.message || "",
    },
  });
}
