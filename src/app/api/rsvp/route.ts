import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rsvpSchema } from "@/lib/rsvpSchema";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendRsvpConfirmationEmails } from "@/lib/email/rsvpConfirmation";

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

function shouldExposeEmailDebug() {
  return process.env.RSVP_DEBUG_RESPONSE === "true";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

async function sendEmailsOrWarning(opts: {
  id?: string | null;
  mode: "created" | "updated";
  input: z.infer<typeof rsvpSchema>;
  submitted_at: string;
}) {
  try {
    await sendRsvpConfirmationEmails({
      id: opts.id || null,
      mode: opts.mode,
      name: opts.input.name,
      email: opts.input.email,
      phone: opts.input.phone || null,
      attending_status: opts.input.attending_status,
      vegetarian: opts.input.vegetarian,
      pescatarian: opts.input.pescatarian,
      vegan: opts.input.vegan,
      diet: opts.input.diet || null,
      companion_status: opts.input.companion_status,
      companion: opts.input.companion || null,
      message: opts.input.message || null,
      submitted_at: opts.submitted_at,
    });

    return null;
  } catch (error) {
    console.error("RSVP email error:", error);
    const detail = shouldExposeEmailDebug()
      ? ` Detalle: ${getErrorMessage(error)}.`
      : "";
    return `Guardamos tu confirmacion, pero no pudimos enviar el correo automatico. Ya quedo registrado para revision.${detail}`;
  }
}

export async function POST(req: NextRequest) {
  if (isRateLimited(req)) {
    return json(429, {
      ok: false,
      message:
        "Recibimos varios intentos seguidos. Espera un minuto y vuelve a intentar.",
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return json(400, {
      ok: false,
      message:
        "No pudimos leer la confirmación. Revisa el formulario e intenta nuevamente.",
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
    pescatarian: input.pescatarian,
    vegan: input.vegan,
    diet: input.diet || null,
    companion_status: input.companion_status,
    is_companion: false,
    companion_of_rsvp_id: null,
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

  const saveCompanion = async (parentId: string) => {
    if (input.companion_status !== "yes" || !input.companion) {
      const { error } = await supabase
        .from("rsvp")
        .delete()
        .eq("companion_of_rsvp_id", parentId)
        .eq("is_companion", true);
      return error;
    }

    const companionRecord = {
      name: input.companion.name,
      email: input.companion.email,
      phone: input.companion.phone || null,
      attending: true,
      attending_status: "yes",
      guests: 0,
      vegetarian: input.companion.vegetarian,
      pescatarian: input.companion.pescatarian,
      vegan: input.companion.vegan,
      diet: input.companion.diet || null,
      companion_status: "no",
      is_companion: true,
      companion_of_rsvp_id: parentId,
      message: null,
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
        registered_by_rsvp_id: parentId,
        registered_by_email: input.email,
      },
    };

    const existingCompanion = await supabase
      .from("rsvp")
      .select("id, submission_count")
      .eq("companion_of_rsvp_id", parentId)
      .eq("is_companion", true)
      .maybeSingle();

    if (existingCompanion.error) return existingCompanion.error;

    if (existingCompanion.data) {
      const { error } = await supabase
        .from("rsvp")
        .update({
          ...companionRecord,
          submission_count: Math.min(
            (existingCompanion.data.submission_count || 1) + 1,
            100,
          ),
        })
        .eq("id", existingCompanion.data.id);

      return error;
    }

    const { error } = await supabase.from("rsvp").insert(companionRecord);
    return error;
  };

  try {
    const existing = await supabase
      .from("rsvp")
      .select("id, submission_count, message")
      .eq("email", input.email)
      .eq("is_companion", false)
      .maybeSingle();

    if (existing.error) {
      console.error("RSVP lookup error:", existing.error);
      return json(500, {
        ok: false,
        message:
          "No pudimos revisar tu confirmación. Intenta nuevamente en unos minutos.",
      });
    }

    if (existing.data) {
      const { error } = await supabase
        .from("rsvp")
        .update({
          ...record,
          message: input.message || existing.data.message || null,
          submission_count: Math.min(
            (existing.data.submission_count || 1) + 1,
            100,
          ),
        })
        .eq("id", existing.data.id);

      if (error) {
        console.error("RSVP update error:", error);
        return json(500, {
          ok: false,
          message:
            "No pudimos actualizar tu confirmación. Intenta nuevamente en unos minutos.",
        });
      }

      const companionError = await saveCompanion(existing.data.id);
      if (companionError) {
        console.error("RSVP companion save error:", companionError);
        return json(500, {
          ok: false,
          message:
            "Guardamos tus datos, pero no pudimos guardar la información del acompañante. Intenta nuevamente.",
        });
      }

      const emailWarning = await sendEmailsOrWarning({
        id: existing.data.id,
        mode: "updated",
        input,
        submitted_at: now,
      });

      return json(200, {
        ok: true,
        mode: "updated",
        message:
          emailWarning ||
          "Actualizamos tu confirmación. Te enviamos un correo de respaldo.",
        email_warning: emailWarning,
      });
    }

    const { data: inserted, error } = await supabase
      .from("rsvp")
      .insert(record)
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        const retry = await supabase
          .from("rsvp")
          .update({
            ...record,
            submission_count: 2,
          })
          .eq("email", input.email)
          .select("id")
          .maybeSingle();

        if (!retry.error) {
          if (retry.data?.id) {
            const companionError = await saveCompanion(retry.data.id);
            if (companionError) {
              console.error("RSVP companion retry save error:", companionError);
              return json(500, {
                ok: false,
                message:
                  "Actualizamos tus datos, pero no pudimos guardar la información del acompañante. Intenta nuevamente.",
              });
            }
          }

          const emailWarning = await sendEmailsOrWarning({
            id: retry.data?.id || null,
            mode: "updated",
            input,
            submitted_at: now,
          });

          return json(200, {
            ok: true,
            mode: "updated",
            message:
              emailWarning ||
              "Actualizamos tu confirmación. Te enviamos un correo de respaldo.",
            email_warning: emailWarning,
          });
        }
      }

      console.error("RSVP insert error:", error);
      return json(500, {
        ok: false,
        message:
          "No pudimos guardar tu confirmación. Intenta nuevamente en unos minutos.",
      });
    }

    const companionError = await saveCompanion(inserted.id);
    if (companionError) {
      console.error("RSVP companion insert save error:", companionError);
      return json(500, {
        ok: false,
        message:
          "Guardamos tus datos, pero no pudimos guardar la información del acompañante. Intenta nuevamente.",
      });
    }

    const emailWarning = await sendEmailsOrWarning({
      id: inserted?.id || null,
      mode: "created",
      input,
      submitted_at: now,
    });

    return json(201, {
      ok: true,
      mode: "created",
      message:
        emailWarning ||
        "Recibimos tu confirmación. Te enviamos un correo de respaldo.",
      email_warning: emailWarning,
    });
  } catch (error) {
    console.error("RSVP unexpected error:", error);
    return json(500, {
      ok: false,
      message:
        "No pudimos guardar tu confirmación. Intenta nuevamente en unos minutos.",
    });
  }
}
