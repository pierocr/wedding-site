import "server-only";

export type ReceiptPayload = {
  donor_name: string;
  donor_email: string;
  amount: number;
  raffle_number: number;
  external_reference?: string | null;
  flow_order?: string | null;
  flow_token?: string | null;
  cart?: Array<{ title?: string; unitPrice?: number; qty?: number }> | null;
  message?: string | null;
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

  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const amountFmt = formatCLP(payload.amount);
  const cartHtml = (payload.cart || [])
    .map((l) => {
      const qty = l.qty ?? 1;
      const total = (l.unitPrice || 0) * qty;
      return `<li>${qty}× ${escapeHtml(l.title || "Regalo")} — ${escapeHtml(formatCLP(total))}</li>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Comprobante de regalo</title></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:'Helvetica Neue',Arial,'Segoe UI',sans-serif;color:#2f3f38;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e6dccf;box-shadow:0 4px 24px rgba(47,63,56,0.08);overflow:hidden;">

        <!-- Header con imagen -->
        <tr><td style="padding:0;">
          <div style="background:linear-gradient(180deg,#f3eadf 0%,#fdfbf7 100%);padding:32px 32px 24px 32px;text-align:center;border-bottom:1px solid #e6dccf;">
            <img src="${escapeHtml(imageUrl)}" width="100" height="100" alt="Piero y Debby" style="border-radius:50%;border:3px solid #ffffff;box-shadow:0 4px 20px rgba(184,149,110,0.25);object-fit:cover;display:block;margin:0 auto;" />
            <div style="margin-top:20px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8956e;font-weight:600;">Piero &amp; Debby</div>
            <div style="font-size:28px;line-height:1.3;font-weight:700;color:#2f3f38;margin-top:8px;">Gracias, ${escapeHtml(payload.donor_name)}</div>
            <div style="width:60px;height:2px;background:#b8956e;margin:16px auto;opacity:0.6;"></div>
            <p style="margin:0;font-size:15px;color:#5f6b5f;line-height:1.7;max-width:420px;margin:0 auto;">
              Tu generosidad nos llena de alegria. Cada regalo representa un abrazo y un deseo de felicidad para esta nueva etapa que comenzamos juntos.
            </p>
          </div>
        </td></tr>

        <!-- Resumen del regalo -->
        <tr><td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdfbf7;border-radius:12px;border:1px solid #e6dccf;">
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#5f6b5f;font-weight:600;">Tu aporte</div>
                      <div style="font-size:32px;font-weight:700;color:#3f5c4a;margin-top:4px;">${escapeHtml(amountFmt)}</div>
                    </td>
                    <td style="vertical-align:middle;text-align:right;">
                      <div style="display:inline-block;background:#3f5c4a;color:#ffffff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;">Confirmado</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 20px 24px;">
                <div style="height:1px;background:#e6dccf;margin-bottom:16px;"></div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#5f6b5f;">
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#8c7a67;">N° de concurso:</span></td>
                    <td style="padding:4px 0;text-align:right;color:#2f3f38;font-weight:600;">${escapeHtml(String(payload.raffle_number))}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#8c7a67;">Referencia:</span></td>
                    <td style="padding:4px 0;text-align:right;color:#2f3f38;font-size:12px;">${escapeHtml(payload.external_reference || "-")}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        ${
          cartHtml
            ? `<!-- Detalle de regalos -->
        <tr><td style="padding:0 32px 20px 32px;">
          <div style="font-size:13px;font-weight:700;color:#2f3f38;margin-bottom:10px;">Detalle de tu regalo</div>
          <ul style="margin:0;padding-left:20px;color:#5f6b5f;font-size:14px;line-height:1.8;">${cartHtml}</ul>
        </td></tr>`
            : ""
        }

        ${
          payload.message
            ? `<!-- Mensaje personal -->
        <tr><td style="padding:0 32px 24px 32px;">
          <div style="font-size:13px;font-weight:700;color:#2f3f38;margin-bottom:10px;">Tu mensaje para nosotros</div>
          <div style="padding:16px 20px;background:#f9f6f0;border-left:3px solid #b8956e;border-radius:0 8px 8px 0;font-size:14px;color:#374151;line-height:1.7;font-style:italic;">"${escapeHtml(payload.message)}"</div>
        </td></tr>`
            : ""
        }

        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px 32px;background:#fdfbf7;border-top:1px solid #e6dccf;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 12px 0;font-size:14px;color:#5f6b5f;line-height:1.6;">
                Este correo es tu comprobante de regalo. ¡Gracias por estar con nosotros!
              </p>
              <div style="font-size:13px;color:#b8956e;font-weight:600;letter-spacing:0.02em;">Estamos contando los días para celebrarlo contigo</div>
              <div style="width:40px;height:1px;background:#e6dccf;margin:16px auto;"></div>
              <div style="font-size:14px;color:#5f6b5f;font-style:italic;">Con amor,</div>
              <div style="font-weight:700;font-size:18px;color:#3f5c4a;margin-top:4px;">Piero &amp; Debby</div>
            </td></tr>
          </table>
        </td></tr>

      </table>

      <div style="font-size:11px;color:#8c7a67;margin-top:20px;line-height:1.6;text-align:center;">
        Si no reconoces este correo, puedes ignorarlo.
      </div>
    </td></tr>
  </table>
</body></html>`;

  const subject = `Comprobante de regalo – #${payload.raffle_number}`;

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

  console.log("[resend] Envío exitoso", result);
  return result;
}
