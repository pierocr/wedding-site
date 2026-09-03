import "server-only";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type CartLine = { title?: unknown; qty?: unknown; unitPrice?: unknown };

export type AbandonedCartEmailPayload = {
  paymentId?: string | null;
  donorName: string;
  donorEmail: string;
  amount: number;
  cart?: CartLine[] | null;
  externalReference?: string | null;
  status: "pending" | "rejected" | "cancelled";
  retryUrl: string;
};

const env = (name: string, optional = false) => {
  const value = process.env[name];
  if (!optional && !value) throw new Error(`Missing env ${name}`);
  return value;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);

const cartRows = (cart: CartLine[] | null | undefined) =>
  (Array.isArray(cart) ? cart : [])
    .map((line) => {
      const title = String(line.title || "Regalo");
      const qty = Math.max(1, Math.round(Number(line.qty) || 1));
      const unitPrice = Number(line.unitPrice) || 0;
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #eadfce;color:#2f3f38;font-size:14px;">${escapeHtml(title)} <span style="color:#7f7468;">x${qty}</span></td><td style="padding:10px 0;border-bottom:1px solid #eadfce;text-align:right;color:#2f3f38;font-weight:700;font-size:14px;">${escapeHtml(formatCLP(unitPrice * qty))}</td></tr>`;
    })
    .join("");

async function logEmail(input: {
  source: "abandoned_cart_customer" | "abandoned_cart_internal";
  to: string;
  subject: string;
  payload: AbandonedCartEmailPayload;
}) {
  const supabase = getSupabaseAdmin();
  const from =
    env("EMAIL_FROM", true) ||
    env("THANKS_FROM", true) ||
    "Piero & Debby <noreply@teilen.cl>";
  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      source: input.source,
      status: "sending",
      provider: "resend",
      payment_id: input.payload.paymentId || null,
      external_reference: input.payload.externalReference || null,
      donor_name: input.payload.donorName,
      donor_email: input.payload.donorEmail,
      amount: input.payload.amount,
      subject: input.subject,
      from_email: from,
      to_email: input.to,
      bcc: [],
      payload: {
        notification_type: "abandoned_cart",
        payment_status: input.payload.status,
        cart: input.payload.cart || [],
        retry_url: input.payload.retryUrl,
      },
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: String(data.id), from };
}

async function deliver(input: {
  source: "abandoned_cart_customer" | "abandoned_cart_internal";
  to: string;
  subject: string;
  html: string;
  payload: AbandonedCartEmailPayload;
}) {
  const apiKey = env("RESEND_API_KEY");
  const log = await logEmail(input);
  const supabase = getSupabaseAdmin();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: log.from, to: [input.to], subject: input.subject, html: input.html }),
    });
    const body = await res.text();
    const providerResponse = body ? JSON.parse(body) : null;
    if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${body || res.statusText}`);
    await supabase.from("email_logs").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider_message_id: providerResponse?.id || null,
      provider_response: providerResponse,
    }).eq("id", log.id);
    return { logId: log.id, providerMessageId: providerResponse?.id || null };
  } catch (error) {
    await supabase.from("email_logs").update({
      status: "failed",
      updated_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : String(error),
    }).eq("id", log.id);
    throw error;
  }
}

function customerHtml(payload: AbandonedCartEmailPayload) {
  const siteUrl = (env("NEXT_PUBLIC_SITE_URL", true) || env("SITE_URL", true) || "https://pieroydebby.cl").replace(/\/$/, "");
  const imageUrl = `${siteUrl}/gallery/1.jpeg`;
  const failed = payload.status === "rejected" || payload.status === "cancelled";
  const heading = failed ? "No pudimos completar tu pago" : "¿Quieres retomar tu regalo?";
  const body = failed
    ? "Tu pago no fue efectuado y no se realizó ningún cobro. Te invitamos a intentarlo nuevamente cuando quieras."
    : "Tu aporte quedó pendiente y no se realizó ningún cobro. Si quieres, puedes retomarlo y completar tu regalo.";
  const statusLabel = failed ? "No completado" : "Pendiente";
  const details = cartRows(payload.cart);
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#f7f2ea;font-family:Arial,'Helvetica Neue',sans-serif;color:#2f3f38;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:34px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fffdf8;border:1px solid #dfd1bd;border-radius:18px;overflow:hidden;"><tr><td align="center" style="background:#efe6da;padding:34px 30px 26px;"><img src="${escapeHtml(imageUrl)}" width="112" height="112" alt="Piero y Debby" style="width:112px;height:112px;border-radius:999px;border:4px solid #fffdf8;object-fit:cover;display:block;" /><div style="margin-top:22px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#b58b5d;font-weight:800;">Piero &amp; Debby</div><h1 style="margin:10px 0;font-size:30px;color:#26382f;">${escapeHtml(heading)}, ${escapeHtml(payload.donorName)}</h1><p style="margin:0;max-width:430px;font-size:15px;line-height:1.75;color:#536358;">${escapeHtml(body)}</p></td></tr><tr><td style="padding:26px 30px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ee;border:1px solid #dfd1bd;border-radius:14px;"><tr><td style="padding:22px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#5f6b5f;font-weight:800;">Tu aporte</div><div style="font-size:34px;font-weight:800;color:#3f5c4a;margin-top:7px;">${escapeHtml(formatCLP(payload.amount))}</div><span style="display:inline-block;margin-top:12px;background:#b58b5d;color:#fff;font-size:11px;font-weight:800;padding:8px 14px;border-radius:999px;text-transform:uppercase;">${escapeHtml(statusLabel)}</span></td></tr></table></td></tr>${details ? `<tr><td style="padding:14px 30px 8px;"><div style="font-size:13px;font-weight:800;color:#26382f;margin-bottom:4px;">Detalle de tu regalo</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${details}</table></td></tr>` : ""}<tr><td align="center" style="padding:28px 30px 34px;"><a href="${escapeHtml(payload.retryUrl)}" style="display:inline-block;background:#3f5c4a;color:#fff;text-decoration:none;border-radius:999px;padding:13px 22px;font-size:14px;font-weight:800;">Reintentar mi regalo</a><p style="margin:22px 0 0;font-size:13px;line-height:1.65;color:#7f7468;">Si no reconoces este intento, puedes ignorar este correo.</p><p style="margin:18px 0 0;font-size:14px;color:#5f6b5f;font-style:italic;">Con amor,<br /><strong style="color:#3f5c4a;">Piero &amp; Debby</strong></p></td></tr></table></td></tr></table></body></html>`;
}

function internalHtml(payload: AbandonedCartEmailPayload) {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:28px;background:#f7f2ea;font-family:Arial,'Helvetica Neue',sans-serif;color:#26382f;"><div style="max-width:580px;margin:auto;background:#fffdf8;border:1px solid #dfd1bd;border-radius:14px;padding:26px;"><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#b58b5d;font-weight:800;">Piero &amp; Debby</div><h1 style="font-size:24px;margin:10px 0;">Correo de carrito abandonado enviado</h1><p style="color:#536358;line-height:1.6;">Se notificó al invitado para que pueda reintentar su regalo.</p><table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;"><tr><td style="padding:8px 0;border-bottom:1px solid #eadfce;color:#7b6d5e;">Destinatario</td><td style="padding:8px 0;border-bottom:1px solid #eadfce;text-align:right;font-weight:700;">${escapeHtml(payload.donorEmail)}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #eadfce;color:#7b6d5e;">Monto</td><td style="padding:8px 0;border-bottom:1px solid #eadfce;text-align:right;font-weight:700;">${escapeHtml(formatCLP(payload.amount))}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #eadfce;color:#7b6d5e;">Estado</td><td style="padding:8px 0;border-bottom:1px solid #eadfce;text-align:right;font-weight:700;">${escapeHtml(payload.status)}</td></tr><tr><td style="padding:8px 0;color:#7b6d5e;">Referencia</td><td style="padding:8px 0;text-align:right;font-size:12px;">${escapeHtml(payload.externalReference || "-")}</td></tr></table></div></body></html>`;
}

export async function sendAbandonedCartEmails(payload: AbandonedCartEmailPayload, opts?: { sendInternal?: boolean }) {
  const customer = await deliver({
    source: "abandoned_cart_customer",
    to: payload.donorEmail,
    subject: payload.status === "pending" ? "¿Quieres retomar tu regalo?" : "Tu pago no fue efectuado",
    html: customerHtml(payload),
    payload,
  });
  const internal = opts?.sendInternal === false ? null : await deliver({
    source: "abandoned_cart_internal",
    to: process.env.PAYMENT_NOTIFICATION_EMAIL || process.env.INTERNAL_PAYMENT_EMAIL || "contacto@teilen.cl",
    subject: `Carrito abandonado enviado a ${payload.donorEmail}`,
    html: internalHtml(payload),
    payload,
  });
  return { customer, internal };
}
