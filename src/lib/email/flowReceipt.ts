import "server-only";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type ReceiptPayload = {
  donor_name: string;
  donor_email: string;
  amount: number;
  raffle_number: number;
  external_reference?: string | null;
  flow_order?: string | null;
  flow_token?: string | null;
  cart?: Array<Record<string, unknown>> | null;
  message?: string | null;
  email_log?: {
    source?: string;
    payment_id?: string | number | null;
  };
};

type EnvOpts = { optional?: boolean; fallback?: string };
const env = (k: string, opts?: EnvOpts) => {
  const v = process.env[k] ?? opts?.fallback;
  if (!opts?.optional && (v === undefined || v === null || v === "")) {
    throw new Error(`Missing env ${k}`);
  }
  return v as string | undefined;
};

const formatCLP = (n: number | null | undefined) =>
  typeof n === "number" && !Number.isNaN(n)
    ? new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(n)
    : "";

const parseAmount = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseQty = (value: unknown) => {
  const parsed = parseAmount(value);
  return parsed > 0 ? Math.max(1, Math.round(parsed)) : 1;
};

const textValue = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const normalizeCart = (cart: ReceiptPayload["cart"]) =>
  (Array.isArray(cart) ? cart : [])
    .map((line) => {
      const qty = parseQty(line.qty ?? line.quantity ?? line.cantidad);
      const unitPrice = parseAmount(
        line.unitPrice ?? line.unit_price ?? line.price ?? line.precio ?? line.amount ?? line.monto
      );
      return {
        title: textValue(line.title, line.name, line.nombre, line.description, line.descripcion) || "Regalo",
        qty,
        unitPrice,
        total: unitPrice * qty,
      };
    })
    .filter((line) => line.qty > 0 && (line.title || line.unitPrice > 0));

// Stub: PDF deshabilitado en Cloudflare Edge para reducir tamaño de worker.
export async function buildReceiptPdf(_payload: ReceiptPayload) {
  return null;
}

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type EmailLogDraft = {
  source: string;
  payment_id?: string | number | null;
  external_reference?: string | null;
  flow_order?: string | null;
  flow_token?: string | null;
  raffle_number: number;
  donor_name: string;
  donor_email: string;
  amount: number;
  subject: string;
  from_email: string;
  to_email: string;
  bcc: string[];
  payload: Record<string, unknown>;
};

async function createEmailLog(draft: EmailLogDraft) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("email_logs")
      .insert({
        source: draft.source,
        status: "sending",
        provider: "resend",
        payment_id: draft.payment_id || null,
        external_reference: draft.external_reference || null,
        flow_order: draft.flow_order || null,
        flow_token: draft.flow_token || null,
        raffle_number: draft.raffle_number,
        donor_name: draft.donor_name,
        donor_email: draft.donor_email,
        amount: draft.amount,
        subject: draft.subject,
        from_email: draft.from_email,
        to_email: draft.to_email,
        bcc: draft.bcc,
        payload: draft.payload,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[email_logs] insert error", error.message);
      return null;
    }

    return data?.id ? String(data.id) : null;
  } catch (err) {
    console.error("[email_logs] insert failed", (err as any)?.message || err);
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
  }
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

    if (error) console.error("[email_logs] update error", error.message);
  } catch (err) {
    console.error("[email_logs] update failed", (err as any)?.message || err);
  }
}

async function sendInternalPaymentEmail(opts: {
  apiKey: string;
  from: string;
  to: string;
  source: string;
  payload: ReceiptPayload;
  amount: number;
  amountFmt: string;
  cart: ReturnType<typeof normalizeCart>;
  cartTotal: number;
}) {
  const subject = `Nuevo regalo recibido - ${opts.amountFmt} - #${opts.payload.raffle_number}`;
  const detailRows = [
    ["Nombre", opts.payload.donor_name],
    ["Email", opts.payload.donor_email],
    ["Monto", opts.amountFmt],
    ["N° de concurso", String(opts.payload.raffle_number)],
    ["Referencia", opts.payload.external_reference || "-"],
    ["Flow order", opts.payload.flow_order || "-"],
  ]
    .map(
      ([label, value]) => `<tr>
        <td style="padding:9px 0;color:#7b6d5e;font-size:13px;border-bottom:1px solid #eadfce;">${escapeHtml(label)}</td>
        <td style="padding:9px 0;color:#26382f;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #eadfce;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");
  const cartRows = opts.cart
    .map(
      (line) => `<tr>
        <td style="padding:8px 0;color:#26382f;font-size:13px;border-bottom:1px solid #eadfce;">${escapeHtml(line.title)} <span style="color:#7b6d5e;">x${line.qty}</span></td>
        <td style="padding:8px 0;color:#26382f;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #eadfce;">${escapeHtml(formatCLP(line.total))}</td>
      </tr>`
    )
    .join("");
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f7f2ea;font-family:Arial,'Helvetica Neue','Segoe UI',sans-serif;color:#26382f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fffdf8;border:1px solid #dfd1bd;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:24px 26px;background:#efe6da;border-bottom:1px solid #dfd1bd;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#b58b5d;font-weight:800;">Piero &amp; Debby</div>
          <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#26382f;">Nuevo regalo recibido</h1>
          <p style="margin:8px 0 0 0;color:#536358;font-size:14px;line-height:1.6;">Se confirmó un pago y ya se envió el comprobante al invitado.</p>
        </td></tr>
        <tr><td style="padding:22px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>
        </td></tr>
        ${
          cartRows
            ? `<tr><td style="padding:0 26px 22px 26px;">
          <div style="font-size:13px;font-weight:800;color:#26382f;margin-bottom:5px;">Detalle del regalo</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cartRows}</table>
        </td></tr>`
            : ""
        }
        ${
          opts.payload.message
            ? `<tr><td style="padding:0 26px 24px 26px;">
          <div style="font-size:13px;font-weight:800;color:#26382f;margin-bottom:8px;">Mensaje del invitado</div>
          <div style="padding:14px 16px;background:#f6f1e9;border-left:3px solid #c89f73;border-radius:0 10px 10px 0;font-size:13px;color:#374151;line-height:1.7;font-style:italic;">"${escapeHtml(opts.payload.message)}"</div>
        </td></tr>`
            : ""
        }
      </table>
    </td></tr>
  </table>
</body></html>`;

  const emailLogId = await createEmailLog({
    source: `${opts.source}_internal`,
    payment_id: opts.payload.email_log?.payment_id || null,
    external_reference: opts.payload.external_reference || null,
    flow_order: opts.payload.flow_order || null,
    flow_token: opts.payload.flow_token || null,
    raffle_number: opts.payload.raffle_number,
    donor_name: opts.payload.donor_name,
    donor_email: opts.payload.donor_email,
    amount: opts.amount,
    subject,
    from_email: opts.from,
    to_email: opts.to,
    bcc: [],
    payload: {
      cart: opts.cart,
      message: opts.payload.message || null,
      notification_type: "internal_payment",
      original_amount: opts.payload.amount,
      computed_cart_total: opts.cartTotal,
    },
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[resend] Error notificacion interna", res.status, txt);
    await updateEmailLog(emailLogId, {
      status: "failed",
      error_message: `Resend HTTP ${res.status}`,
      error_details: txt || res.statusText,
      provider_response: { status: res.status, body: txt || res.statusText },
    });
    return;
  }

  let data: { id?: string } | null = null;
  try {
    data = (await res.json()) as any;
  } catch {
    data = null;
  }

  await updateEmailLog(emailLogId, {
    status: "sent",
    provider_message_id: data?.id || null,
    provider_response: data || null,
  });
}

export async function sendFlowReceiptEmail(payload: ReceiptPayload) {
  const apiKey = env("RESEND_API_KEY");
  const from =
    env("EMAIL_FROM", { optional: true }) ||
    env("THANKS_FROM", { optional: true }) ||
    "Piero & Debby <noreply@teilen.cl>";
  const siteUrl =
    env("NEXT_PUBLIC_SITE_URL", { optional: true }) ||
    env("SITE_URL", { optional: true }) ||
    "https://pieroydebby.cl";
  const imageUrl = `${siteUrl.replace(/\/$/, "")}/gallery/1.jpg`;
  const bccRaw = env("EMAIL_BCC", { optional: true }) || env("THANKS_BCC", { optional: true }) || "";
  const bcc = bccRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const internalPaymentEmail =
    env("PAYMENT_NOTIFICATION_EMAIL", { optional: true }) ||
    env("INTERNAL_PAYMENT_EMAIL", { optional: true }) ||
    "contacto@teilen.cl";

  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const cart = normalizeCart(payload.cart);
  const cartTotal = cart.reduce((sum, line) => sum + line.total, 0);
  const amount = payload.amount > 0 ? payload.amount : cartTotal;
  const amountFmt = formatCLP(amount);
  const giftRows = (cart.length
    ? cart
    : amount > 0
      ? [{ title: "Regalo de matrimonio", qty: 1, unitPrice: amount, total: amount }]
      : []
  )
    .map(
      (line) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eadfce;">
          <div style="font-size:14px;line-height:1.45;color:#2f3f38;font-weight:700;">${escapeHtml(line.title)}</div>
          <div style="font-size:12px;line-height:1.5;color:#7f7468;margin-top:2px;">Cantidad: ${escapeHtml(String(line.qty))}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eadfce;text-align:right;vertical-align:top;font-size:14px;color:#2f3f38;font-weight:700;">${escapeHtml(formatCLP(line.total))}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Comprobante de regalo</title></head>
<body style="margin:0;padding:0;background:#f7f2ea;font-family:Arial,'Helvetica Neue','Segoe UI',sans-serif;color:#2f3f38;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;">
    <tr><td align="center" style="padding:34px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fffdf8;border:1px solid #dfd1bd;border-radius:18px;overflow:hidden;">

        <tr><td style="background:#efe6da;padding:0;border-bottom:1px solid #dfd1bd;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:34px 30px 26px 30px;">
              <img src="${escapeHtml(imageUrl)}" width="112" height="112" alt="Piero y Debby" style="width:112px;height:112px;border-radius:999px;border:4px solid #fffdf8;object-fit:cover;display:block;box-shadow:0 12px 28px rgba(47,63,56,0.18);" />
              <div style="margin-top:22px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#b58b5d;font-weight:800;">Piero &amp; Debby</div>
              <h1 style="margin:10px 0 0 0;font-size:30px;line-height:1.22;color:#26382f;font-weight:800;">Gracias, ${escapeHtml(payload.donor_name)}</h1>
              <div style="width:56px;height:2px;background:#c89f73;margin:16px auto 16px auto;"></div>
              <p style="margin:0 auto;font-size:15px;color:#536358;line-height:1.75;max-width:430px;">
                Recibimos tu regalo con mucho cariño. Gracias por acompañarnos y por ser parte de esta nueva historia que estamos comenzando.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:26px 30px 10px 30px;background:#fffdf8;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ee;border-radius:14px;border:1px solid #dfd1bd;">
            <tr>
              <td style="padding:22px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#5f6b5f;font-weight:800;">Tu aporte confirmado</div>
                      <div style="font-size:34px;line-height:1.1;font-weight:800;color:#3f5c4a;margin-top:7px;">${escapeHtml(amountFmt)}</div>
                    </td>
                    <td style="vertical-align:middle;text-align:right;">
                      <span style="display:inline-block;background:#3f5c4a;color:#ffffff;font-size:11px;font-weight:800;padding:8px 14px;border-radius:999px;text-transform:uppercase;letter-spacing:0.06em;">Pagado</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 22px 20px 22px;">
                <div style="height:1px;background:#dfd1bd;margin-bottom:14px;"></div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#5f6b5f;line-height:1.5;">
                  <tr>
                    <td style="padding:5px 0;color:#837565;">N° de concurso</td>
                    <td style="padding:5px 0;text-align:right;color:#26382f;font-weight:800;">${escapeHtml(String(payload.raffle_number))}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#837565;">Referencia</td>
                    <td style="padding:5px 0;text-align:right;color:#26382f;font-size:12px;">${escapeHtml(payload.external_reference || "-")}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        ${
          giftRows
            ? `<tr><td style="padding:14px 30px 8px 30px;background:#fffdf8;">
          <div style="font-size:13px;font-weight:800;color:#26382f;margin-bottom:4px;">Detalle de tu regalo</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${giftRows}</table>
        </td></tr>`
            : ""
        }

        ${
          payload.message
            ? `<tr><td style="padding:18px 30px 28px 30px;background:#fffdf8;">
          <div style="font-size:13px;font-weight:800;color:#26382f;margin-bottom:10px;">Tu mensaje para nosotros</div>
          <div style="padding:16px 18px;background:#f6f1e9;border-left:3px solid #c89f73;border-radius:0 10px 10px 0;font-size:14px;color:#374151;line-height:1.7;font-style:italic;">"${escapeHtml(payload.message)}"</div>
        </td></tr>`
            : ""
        }

        <tr><td style="padding:24px 30px 30px 30px;background:#f9f5ee;border-top:1px solid #dfd1bd;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 14px 0;font-size:14px;color:#536358;line-height:1.65;">
                Este correo es tu comprobante de regalo. Guarda el número de concurso para el sorteo del matrimonio.
              </p>
              <a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#3f5c4a;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 20px;font-size:13px;font-weight:800;">Ver sitio del matrimonio</a>
              <div style="font-size:13px;color:#b58b5d;font-weight:800;letter-spacing:0.02em;margin-top:18px;">Estamos contando los días para celebrarlo contigo</div>
              <div style="width:40px;height:1px;background:#dfd1bd;margin:16px auto;"></div>
              <div style="font-size:14px;color:#5f6b5f;font-style:italic;">Con amor,</div>
              <div style="font-weight:800;font-size:18px;color:#3f5c4a;margin-top:4px;">Piero &amp; Debby</div>
            </td></tr>
          </table>
        </td></tr>

      </table>

      <div style="font-size:11px;color:#8c7a67;margin-top:18px;line-height:1.6;text-align:center;">
        Si no reconoces este correo, puedes ignorarlo.
      </div>
    </td></tr>
  </table>
</body></html>`;

  const subject = `Comprobante de regalo – #${payload.raffle_number}`;
  const emailLogId = await createEmailLog({
    source: payload.email_log?.source || "flow_receipt",
    payment_id: payload.email_log?.payment_id || null,
    external_reference: payload.external_reference || null,
    flow_order: payload.flow_order || null,
    flow_token: payload.flow_token || null,
    raffle_number: payload.raffle_number,
    donor_name: payload.donor_name,
    donor_email: payload.donor_email,
    amount,
    subject,
    from_email: from,
    to_email: payload.donor_email,
    bcc,
    payload: {
      cart,
      message: payload.message || null,
      original_amount: payload.amount,
      computed_cart_total: cartTotal,
    },
  });

  console.log("[resend] Enviando comprobante", {
    to: payload.donor_email,
    subject,
    external_reference: payload.external_reference,
    flow_token: payload.flow_token,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.donor_email],
      ...(bcc.length ? { bcc } : {}),
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[resend] Error HTTP", res.status, txt);
    await updateEmailLog(emailLogId, {
      status: "failed",
      error_message: `Resend HTTP ${res.status}`,
      error_details: txt || res.statusText,
      provider_response: { status: res.status, body: txt || res.statusText },
    });
    const err = new Error(`Resend error: ${txt || res.statusText}`);
    (err as any).status = res.status;
    (err as any).details = txt || res.statusText;
    throw err;
  }

  let data: { id?: string } | null = null;
  try {
    data = (await res.json()) as any;
  } catch {
    data = null;
  }

  const result = {
    id: data?.id,
    subject,
    from,
    to: [payload.donor_email],
  };

  await updateEmailLog(emailLogId, {
    status: "sent",
    provider_message_id: data?.id || null,
    provider_response: data || null,
  });

  const source = payload.email_log?.source || "flow_receipt";
  if (source === "flow_webhook" || source === "email_send_pending") {
    await sendInternalPaymentEmail({
      apiKey,
      from,
      to: internalPaymentEmail,
      source,
      payload,
      amount,
      amountFmt,
      cart,
      cartTotal,
    });
  }

  console.log("[resend] Envío exitoso", result);
  return result;
}
