import "server-only";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

export async function sendRsvpEditCodeEmail({
  email,
  name,
  code,
}: {
  email: string;
  name: string;
  code: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const from =
    process.env.RSVP_EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    "Piero & Debby <noreply@teilen.cl>";
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f7f2ea;font-family:Arial,'Helvetica Neue','Segoe UI',sans-serif;color:#26382f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;"><tr><td align="center" style="padding:32px 14px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf8;border:1px solid #dfd1bd;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:30px 28px;text-align:center;background:#efe6da;border-bottom:1px solid #dfd1bd;">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#b58b5d;font-weight:800;">Piero &amp; Debby</div>
        <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;color:#26382f;">Modifica tu confirmación</h1>
      </td></tr>
      <tr><td style="padding:28px;text-align:center;">
        <p style="margin:0;color:#536358;font-size:15px;line-height:1.65;">Hola ${escapeHtml(name)}, usa este código para editar tu confirmación de asistencia:</p>
        <div style="margin:22px 0;padding:14px;border-radius:12px;background:#f6f1e9;color:#26382f;font-size:30px;letter-spacing:.2em;font-weight:800;">${code}</div>
        <p style="margin:0;color:#7b6d5e;font-size:13px;line-height:1.6;">El código vence en 10 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Código para modificar tu confirmación",
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend error: ${await response.text()}`);
  }
}
