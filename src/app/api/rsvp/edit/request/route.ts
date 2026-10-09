import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendRsvpEditCodeEmail } from "@/lib/email/rsvpEditCode";
import { createRsvpEditCode, hashRsvpEditSecret } from "@/lib/rsvpEditAccess";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});
const requests = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("user-agent") ||
    "unknown"
  );
}

function limited(req: NextRequest) {
  const key = clientKey(req);
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 3;
}

export async function POST(req: NextRequest) {
  if (limited(req)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Espera unos minutos antes de solicitar otro código.",
      },
      { status: 429 },
    );
  }

  const parsed = emailSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Ingresa un correo válido." },
      { status: 422 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: rsvp, error } = await supabase
    .from("rsvp")
    .select("id, name, email")
    .eq("email", parsed.data.email)
    .eq("is_companion", false)
    .maybeSingle();

  if (error) {
    console.error("RSVP edit request lookup error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos enviar el código. Intenta nuevamente.",
      },
      { status: 500 },
    );
  }

  if (!rsvp) {
    return NextResponse.json({
      ok: true,
      can_edit: false,
      message:
        "No encontramos una confirmación con ese correo. Completa el formulario para confirmar tu asistencia.",
    });
  }

  const code = createRsvpEditCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60_000).toISOString();
  const { error: insertError } = await supabase
    .from("rsvp_edit_verifications")
    .insert({
      rsvp_id: rsvp.id,
      email: rsvp.email,
      code_hash: await hashRsvpEditSecret(code),
      code_expires_at: expiresAt,
      requested_at: now.toISOString(),
    });

  if (insertError) {
    console.error("RSVP edit request insert error:", insertError);
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos enviar el código. Intenta nuevamente.",
      },
      { status: 500 },
    );
  }

  try {
    await sendRsvpEditCodeEmail({ email: rsvp.email, name: rsvp.name, code });
  } catch (emailError) {
    console.error("RSVP edit code email error:", emailError);
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos enviar el código. Intenta nuevamente.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    can_edit: true,
    message: "Te enviamos un código de 6 dígitos. Revisa tu correo.",
  });
}
