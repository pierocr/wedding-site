import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type CartLine = { title?: string; unitPrice?: number; qty?: number };

export type ReceiptPayload = {
  donor_name: string;
  donor_email: string;
  amount: number;
  raffle_number: number;
  external_reference?: string | null;
  flow_order?: string | null;
  flow_token?: string | null;
  cart?: CartLine[] | null;
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

const wrapText = (text: string, max = 86) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line += ` ${w}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
};

export async function buildReceiptPdf(payload: ReceiptPayload) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();
  let y = height - 60;
  const margin = 50;

  const drawText = (text: string, opts?: { size?: number; bold?: boolean }) => {
    page.drawText(text, {
      x: margin,
      y,
      size: opts?.size || 12,
      font: opts?.bold ? bold : font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= (opts?.size || 12) + 8;
  };

  drawText("Comprobante de Regalo – Piero & Debby", { size: 20, bold: true });
  drawText(new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" }), {
    size: 11,
  });
  y -= 8;

  const info: Array<[string, string]> = [
    ["Estado", "PAGADO"],
    ["Nombre", payload.donor_name],
    ["Email", payload.donor_email],
    ["Número de concurso", String(payload.raffle_number)],
    ["Total", formatCLP(payload.amount)],
    ["Referencia", payload.external_reference || "-"],
  ];
  if (payload.flow_order) info.push(["Flow order", String(payload.flow_order)]);
  if (payload.flow_token) info.push(["Token", String(payload.flow_token)]);

  info.forEach(([label, value]) => drawText(`${label}: ${value}`));

  if (payload.message) {
    drawText("Mensaje:", { bold: true });
    wrapText(payload.message, 96).forEach((line) => drawText(line));
  }

  if (payload.cart?.length) {
    drawText("Detalle de regalos:", { bold: true });
    payload.cart.forEach((l) => {
      const qty = l.qty ?? 1;
      const total = (l.unitPrice || 0) * qty;
      drawText(`• ${qty}× ${l.title || "Regalo"} — ${formatCLP(total)}`);
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toBase64 = (bytes: Uint8Array) => {
  const maybeBuffer = (globalThis as any).Buffer;
  if (maybeBuffer) return maybeBuffer.from(bytes).toString("base64");
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

export async function sendFlowReceiptEmail(payload: ReceiptPayload) {
  const apiKey = env("RESEND_API_KEY");
  const from =
    env("EMAIL_FROM", { optional: true }) ||
    env("THANKS_FROM", { optional: true }) ||
    "Piero & Debby <noreply@teilen.cl>";
  const bccRaw = env("EMAIL_BCC", { optional: true }) || env("THANKS_BCC", { optional: true }) || "";
  const bcc = bccRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const pdf = await buildReceiptPdf(payload);
  const pdfBase64 = toBase64(pdf);

  const amountFmt = formatCLP(payload.amount);
  const cartHtml = (payload.cart || [])
    .map((l) => {
      const qty = l.qty ?? 1;
      const total = (l.unitPrice || 0) * qty;
      return `<li>${qty}× ${escapeHtml(l.title || "Regalo")} — ${escapeHtml(
        formatCLP(total)
      )}</li>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Comprobante de regalo</title></head>
<body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
        <tr><td style="padding:24px 24px 10px 24px;text-align:left;">
          <div style="font-size:26px;line-height:1.2;font-weight:700;">¡Gracias por tu regalo, ${escapeHtml(
            payload.donor_name
          )}!</div>
          <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">
            Confirmamos tu aporte de <strong>${escapeHtml(
              amountFmt
            )}</strong>. Adjuntamos tu comprobante en PDF.
          </p>
        </td></tr>
        <tr><td style="padding:12px 24px;">
          <div style="background:#f8fafc;border:1px dashed #e2e8f0;border-radius:12px;padding:12px 14px;font-size:13px;color:#334155;">
            <div><strong>Estado:</strong> PAGADO</div>
            <div><strong>Número de concurso:</strong> ${escapeHtml(
              String(payload.raffle_number)
            )}</div>
            <div><strong>Referencia:</strong> ${escapeHtml(
              payload.external_reference || "-"
            )}</div>
            ${
              payload.flow_order
                ? `<div><strong>Flow order:</strong> ${escapeHtml(payload.flow_order)}</div>`
                : ""
            }
          </div>
        </td></tr>
        ${
          cartHtml
            ? `<tr><td style="padding:4px 24px 12px 24px;">
                 <div style="font-size:13px;font-weight:600;">Detalle de regalos</div>
                 <ul style="margin:6px 0 0 14px;color:#475569;font-size:13px;padding:0;">${cartHtml}</ul>
               </td></tr>`
            : ""
        }
        ${
          payload.message
            ? `<tr><td style="padding:4px 24px 18px 24px;">
                 <div style="font-size:13px;font-weight:600;">Tu mensaje</div>
                 <div style="margin-top:6px;font-size:14px;color:#334155;">${escapeHtml(
                   payload.message
                 )}</div>
               </td></tr>`
            : ""
        }
        <tr><td style="padding:8px 24px 26px 24px;text-align:left;">
          <p style="margin:0 0 12px 0;font-size:14px;color:#475569;">Con cariño,</p>
          <div style="font-weight:600;font-size:16px;">Piero &amp; Debby</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:6px;">Gracias por acompañarnos en esta etapa.</div>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#94a3b8;margin-top:12px;">Si no reconoces este correo, puedes ignorarlo.</div>
    </td></tr>
  </table>
</body></html>`;

  const subject = `Comprobante de regalo – #${payload.raffle_number}`;

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
      attachments: [
        {
          filename: "Comprobante-regalo.pdf",
          content: pdfBase64,
        },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
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

  return {
    id: data?.id,
    subject,
    from,
    to: [payload.donor_email],
  };
}
