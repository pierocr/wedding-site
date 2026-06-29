import type { AttendingStatus, CompanionStatus } from "@/lib/rsvpSchema";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type RsvpEmailCompanion = {
  name: string;
  email: string;
  phone?: string | null;
  vegetarian: boolean;
  pescatarian: boolean;
  vegan: boolean;
  diet?: string | null;
};

type RsvpEmailPayload = {
  id?: string | null;
  mode: "created" | "updated";
  name: string;
  email: string;
  phone?: string | null;
  attending_status: AttendingStatus;
  vegetarian: boolean;
  pescatarian: boolean;
  vegan: boolean;
  diet?: string | null;
  companion_status: CompanionStatus;
  companion?: RsvpEmailCompanion | null;
  message?: string | null;
  submitted_at: string;
};

type EmailTarget = "guest" | "internal";

type EmailResult = {
  target: EmailTarget;
  id?: string;
};

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const env = (key: string, fallback?: string) =>
  process.env[key] || fallback || "";

const attendingLabel = (status: AttendingStatus) => {
  if (status === "yes") return "Sí, confirma asistencia";
  if (status === "no") return "No podrá asistir";
  return "Confirmará más adelante";
};

const formatSubmittedAt = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(iso));

const dietaryPreferenceLabel = (
  payload: Pick<RsvpEmailPayload, "vegetarian" | "pescatarian" | "vegan">,
) => {
  if (payload.vegetarian) return "Vegetariana";
  if (payload.pescatarian) return "Pescetariana";
  if (payload.vegan) return "Vegana";
  return "-";
};

const companionLabel = (
  payload: Pick<RsvpEmailPayload, "companion_status" | "companion">,
) => {
  if (payload.companion_status === "later") return "Pendiente por completar";
  if (payload.companion_status === "yes" && payload.companion) {
    return `${payload.companion.name} (${payload.companion.email})`;
  }
  return "Sin acompañante";
};

async function createEmailLog(opts: {
  source: string;
  target: EmailTarget;
  payload: RsvpEmailPayload;
  subject: string;
  from: string;
  to: string;
}) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("email_logs")
      .insert({
        source: opts.source,
        status: "sending",
        provider: "resend",
        donor_name: opts.payload.name,
        donor_email: opts.payload.email,
        subject: opts.subject,
        from_email: opts.from,
        to_email: opts.to,
        bcc: [],
        payload: {
          notification_type: `rsvp_${opts.target}`,
          rsvp_id: opts.payload.id || null,
          mode: opts.payload.mode,
          attending_status: opts.payload.attending_status,
          vegetarian: opts.payload.vegetarian,
          pescatarian: opts.payload.pescatarian,
          vegan: opts.payload.vegan,
          diet: opts.payload.diet || null,
          companion_status: opts.payload.companion_status,
          companion: opts.payload.companion || null,
          message: opts.payload.message || null,
          phone: opts.payload.phone || null,
          submitted_at: opts.payload.submitted_at,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[rsvp/email_logs] insert error", error.message);
      return null;
    }

    return data?.id ? String(data.id) : null;
  } catch (error) {
    console.error(
      "[rsvp/email_logs] insert failed",
      (error as Error)?.message || error,
    );
    return null;
  }
}

async function updateEmailLog(
  id: string | null,
  patch: {
    status: "sent" | "failed";
    provider_message_id?: string | null;
    provider_response?: Record<string, unknown> | null;
    error_message?: string | null;
    error_details?: string | null;
  },
) {
  if (!id) return;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("email_logs")
      .update({
        ...patch,
        sent_at: patch.status === "sent" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) console.error("[rsvp/email_logs] update error", error.message);
  } catch (error) {
    console.error(
      "[rsvp/email_logs] update failed",
      (error as Error)?.message || error,
    );
  }
}

const detailRows = (payload: RsvpEmailPayload) =>
  [
    ["Nombre", payload.name],
    ["Email", payload.email],
    ["Telefono", payload.phone || "-"],
    ["Asistencia", attendingLabel(payload.attending_status)],
    ["Preferencia alimentaria", dietaryPreferenceLabel(payload)],
    ["Restricciones alimentarias", payload.diet || "-"],
    ["Acompañante", companionLabel(payload)],
    ["Fecha de confirmacion", formatSubmittedAt(payload.submitted_at)],
  ]
    .map(
      ([label, value]) => `<tr>
        <td style="padding:9px 0;color:#7b6d5e;font-size:13px;border-bottom:1px solid #eadfce;">${escapeHtml(label)}</td>
        <td style="padding:9px 0;color:#26382f;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #eadfce;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("");

function guestHtml(payload: RsvpEmailPayload, siteUrl: string) {
  const isAttending = payload.attending_status === "yes";
  const title = isAttending
    ? "Gracias por confirmar tu asistencia"
    : "Gracias por avisarnos";
  const copy = isAttending
    ? "Recibimos tu confirmacion y estamos muy felices de contar contigo en nuestro matrimonio."
    : "Recibimos tu respuesta. Gracias por avisarnos con tiempo para poder organizar todo con cariño.";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f7f2ea;font-family:Arial,'Helvetica Neue','Segoe UI',sans-serif;color:#26382f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;">
    <tr><td align="center" style="padding:32px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fffdf8;border:1px solid #dfd1bd;border-radius:18px;overflow:hidden;">
        <tr><td style="padding:30px 28px;background:#efe6da;border-bottom:1px solid #dfd1bd;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#b58b5d;font-weight:800;">Piero &amp; Debby</div>
          <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.25;color:#26382f;">${escapeHtml(title)}</h1>
          <div style="width:54px;height:2px;background:#c89f73;margin:16px auto;"></div>
          <p style="margin:0 auto;font-size:15px;color:#536358;line-height:1.75;max-width:440px;">Hola ${escapeHtml(payload.name)}, ${escapeHtml(copy)}</p>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(payload)}</table>
        </td></tr>
        ${
          payload.message
            ? `<tr><td style="padding:0 28px 26px 28px;">
          <div style="font-size:13px;font-weight:800;color:#26382f;margin-bottom:8px;">Tu mensaje para nosotros</div>
          <div style="padding:14px 16px;background:#f6f1e9;border-left:3px solid #c89f73;border-radius:0 10px 10px 0;font-size:14px;color:#374151;line-height:1.7;font-style:italic;">"${escapeHtml(payload.message)}"</div>
        </td></tr>`
            : ""
        }
        <tr><td style="padding:24px 28px 30px 28px;background:#f9f5ee;border-top:1px solid #dfd1bd;text-align:center;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#536358;line-height:1.65;">Si necesitas corregir tu respuesta, puedes volver a enviar el formulario usando el mismo correo que ingresaste.</p>
          <a href="${escapeHtml(siteUrl)}#rsvp" style="display:inline-block;background:#3f5c4a;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 20px;font-size:13px;font-weight:800;">Ver sitio del matrimonio</a>
          <div style="font-size:14px;color:#5f6b5f;font-style:italic;margin-top:18px;">Con amor,</div>
          <div style="font-weight:800;font-size:18px;color:#3f5c4a;margin-top:4px;">Piero &amp; Debby</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function internalHtml(payload: RsvpEmailPayload) {
  const modeLabel =
    payload.mode === "created"
      ? "Nueva confirmacion"
      : "Confirmacion actualizada";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(modeLabel)}</title></head>
<body style="margin:0;padding:0;background:#f7f2ea;font-family:Arial,'Helvetica Neue','Segoe UI',sans-serif;color:#26382f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fffdf8;border:1px solid #dfd1bd;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:24px 26px;background:#efe6da;border-bottom:1px solid #dfd1bd;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#b58b5d;font-weight:800;">RSVP matrimonio 2026</div>
          <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#26382f;">${escapeHtml(modeLabel)}</h1>
          <p style="margin:8px 0 0 0;color:#536358;font-size:14px;line-height:1.6;">${escapeHtml(payload.name)} respondio: ${escapeHtml(attendingLabel(payload.attending_status))}.</p>
        </td></tr>
        <tr><td style="padding:22px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(payload)}</table>
        </td></tr>
        ${
          payload.message
            ? `<tr><td style="padding:0 26px 24px 26px;">
          <div style="font-size:13px;font-weight:800;color:#26382f;margin-bottom:8px;">Mensaje del invitado</div>
          <div style="padding:14px 16px;background:#f6f1e9;border-left:3px solid #c89f73;border-radius:0 10px 10px 0;font-size:13px;color:#374151;line-height:1.7;font-style:italic;">"${escapeHtml(payload.message)}"</div>
        </td></tr>`
            : ""
        }
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail(opts: {
  apiKey: string;
  source: string;
  target: EmailTarget;
  from: string;
  to: string;
  subject: string;
  html: string;
  payload: RsvpEmailPayload;
}) {
  const emailLogId = await createEmailLog(opts);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    await updateEmailLog(emailLogId, {
      status: "failed",
      error_message: `Resend HTTP ${res.status}`,
      error_details: text || res.statusText,
      provider_response: { status: res.status, body: text || res.statusText },
    });

    const error = new Error(`Resend error: ${text || res.statusText}`);
    (error as Error & { status?: number; details?: string }).status =
      res.status;
    (error as Error & { status?: number; details?: string }).details =
      text || res.statusText;
    throw error;
  }

  let data: { id?: string } | null = null;
  try {
    data = (await res.json()) as { id?: string };
  } catch {
    data = null;
  }

  await updateEmailLog(emailLogId, {
    status: "sent",
    provider_message_id: data?.id || null,
    provider_response: data || null,
  });

  return (
    data?.id ? { target: opts.target, id: data.id } : { target: opts.target }
  ) satisfies EmailResult;
}

export async function sendRsvpConfirmationEmails(payload: RsvpEmailPayload) {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const from =
    env("RSVP_EMAIL_FROM") ||
    env("EMAIL_FROM") ||
    env("THANKS_FROM") ||
    "Piero & Debby <noreply@teilen.cl>";
  const internalTo =
    env("RSVP_NOTIFICATION_EMAIL") ||
    env("INTERNAL_RSVP_EMAIL") ||
    "contacto@teilen.cl";
  const siteUrl =
    env("NEXT_PUBLIC_SITE_URL") ||
    env("SITE_URL") ||
    env("BASE_URL") ||
    "https://www.pieroydebby.cl";

  const guestSubject =
    payload.attending_status === "yes"
      ? "Gracias por confirmar tu asistencia"
      : "Gracias por responder nuestra invitacion";
  const internalSubject = `[RSVP] ${attendingLabel(payload.attending_status)} - ${payload.name}`;

  const [guestResult, internalResult] = await Promise.allSettled([
    sendEmail({
      apiKey,
      source: "rsvp_guest_confirmation",
      target: "guest",
      from,
      to: payload.email,
      subject: guestSubject,
      html: guestHtml(payload, siteUrl),
      payload,
    }),
    sendEmail({
      apiKey,
      source: "rsvp_internal_notification",
      target: "internal",
      from,
      to: internalTo,
      subject: internalSubject,
      html: internalHtml(payload),
      payload,
    }),
  ]);

  const failures = [
    guestResult.status === "rejected"
      ? `guest: ${(guestResult.reason as Error)?.message || String(guestResult.reason)}`
      : null,
    internalResult.status === "rejected"
      ? `internal: ${(internalResult.reason as Error)?.message || String(internalResult.reason)}`
      : null,
  ].filter(Boolean);

  if (failures.length > 0) {
    throw new Error(`RSVP email delivery failed (${failures.join("; ")})`);
  }

  return {
    guest: guestResult.status === "fulfilled" ? guestResult.value : null,
    internal:
      internalResult.status === "fulfilled" ? internalResult.value : null,
  };
}
