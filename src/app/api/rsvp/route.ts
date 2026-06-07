import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rsvpSchema } from "@/lib/rsvpSchema";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const submissions = new Map<string, { count: number; resetAt: number }>();

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const candidate = forwarded || realIp || null;

  if (!candidate) return null;
  if (!/^[a-f\d:.]+$/i.test(candidate)) return null;
  return candidate;
}

function rateLimitKey(req: NextRequest) {
  return clientIp(req) || req.headers.get("user-agent") || "unknown";
}

function isRateLimited(req: NextRequest) {
  const key = rateLimitKey(req);
  const now = Date.now();
  const current = submissions.get(key);

  if (!current || current.resetAt <= now) {
    submissions.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function publicValidationErrors(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export async function POST(req: NextRequest) {
  if (isRateLimited(req)) {
    return json(429, {
      ok: false,
      message: "Recibimos varios intentos seguidos. Espera un minuto y vuelve a intentar.",
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return json(400, {
      ok: false,
      message: "No pudimos leer la confirmación. Revisa el formulario e intenta nuevamente.",
    });
  }

  const parsed = rsvpSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json(422, {
      ok: false,
      message: "Revisa los datos marcados e intenta nuevamente.",
      errors: publicValidationErrors(parsed.error),
    });
  }

  const input = parsed.data;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;
  const referer = req.headers.get("referer")?.slice(0, 500) || null;
  const attending = input.attending_status === "yes";

  const record = {
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    attending,
    attending_status: input.attending_status,
    guests: 0,
    vegetarian: input.vegetarian,
    diet: input.diet || null,
    message: input.message || null,
    source: input.source,
    user_agent: userAgent,
    last_submitted_at: now,
    ip_address: ip,
    metadata: {
      referer,
      locale: req.headers.get("accept-language")?.slice(0, 120) || null,
      timezone: "America/Santiago",
      event_country: "CL",
      event_year: 2026,
    },
  };

  try {
    const existing = await supabase
      .from("rsvp")
      .select("id, submission_count")
      .eq("email", input.email)
      .maybeSingle();

    if (existing.error) {
      console.error("RSVP lookup error:", existing.error);
      return json(500, {
        ok: false,
        message: "No pudimos revisar tu confirmación. Intenta nuevamente en unos minutos.",
      });
    }

    if (existing.data) {
      const { error } = await supabase
        .from("rsvp")
        .update({
          ...record,
          submission_count: Math.min((existing.data.submission_count || 1) + 1, 100),
        })
        .eq("id", existing.data.id);

      if (error) {
        console.error("RSVP update error:", error);
        return json(500, {
          ok: false,
          message: "No pudimos actualizar tu confirmación. Intenta nuevamente en unos minutos.",
        });
      }

      return json(200, {
        ok: true,
        mode: "updated",
        message: "Actualizamos tu confirmación. Gracias por avisarnos.",
      });
    }

    const { error } = await supabase.from("rsvp").insert(record);

    if (error) {
      if (error.code === "23505") {
        const retry = await supabase
          .from("rsvp")
          .update({
            ...record,
            submission_count: 2,
          })
          .eq("email", input.email);

        if (!retry.error) {
          return json(200, {
            ok: true,
            mode: "updated",
            message: "Actualizamos tu confirmación. Gracias por avisarnos.",
          });
        }
      }

      console.error("RSVP insert error:", error);
      return json(500, {
        ok: false,
        message: "No pudimos guardar tu confirmación. Intenta nuevamente en unos minutos.",
      });
    }

    return json(201, {
      ok: true,
      mode: "created",
      message: "Recibimos tu confirmación. Gracias.",
    });
  } catch (error) {
    console.error("RSVP unexpected error:", error);
    return json(500, {
      ok: false,
      message: "No pudimos guardar tu confirmación. Intenta nuevamente en unos minutos.",
    });
  }
}
