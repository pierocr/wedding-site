// app/api/email/thanks/route.ts
export const runtime = "edge";

type ReqBody = {
  payment_id: string;
  external_reference?: string;
  fallback?: { name?: string; email?: string };
};

export async function POST(req: Request) {
  try {
    const { payment_id, external_reference, fallback }: ReqBody = await req.json();

    if (!payment_id) {
      return new Response(JSON.stringify({ error: "Falta payment_id" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const MP_TOKEN =
      process.env.MP_ACCESS_TOKEN ??
      process.env.MERCADOPAGO_ACCESS_TOKEN ??
      process.env.MP_SANDBOX_ACCESS_TOKEN ??
      "";

    if (!MP_TOKEN) {
      return new Response(JSON.stringify({ error: "Falta MP_ACCESS_TOKEN" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // 1) Consultar pago en Mercado Pago
    const payRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(payment_id)}`,
      {
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          "content-type": "application/json",
        },
        // Evita caches de edge
        cache: "no-store",
      }
    );

    if (!payRes.ok) {
      const txt = await payRes.text();
      return new Response(
        JSON.stringify({ error: "MP payments API", detail: txt }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    const pay = await payRes.json();

    // status debe ser "approved"
    const status = String(pay?.status || "");
    if (status.toLowerCase() !== "approved") {
      return new Response(JSON.stringify({ error: "Pago no aprobado", status }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Datos útiles
    const amount: number = Number(pay?.transaction_amount ?? 0);
    const payerEmail: string =
      pay?.payer?.email || fallback?.email || "";
    const payerName: string =
      [pay?.payer?.first_name, pay?.payer?.last_name].filter(Boolean).join(" ").trim() ||
      fallback?.name ||
      "amig@";

    if (!payerEmail) {
      return new Response(JSON.stringify({ error: "No hay email del pagador" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // 2) Componer email (HTML simple, responsive)
    const CLP = new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(amount);

    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>¡Gracias por tu regalo!</title>
</head>
<body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
        <tr><td style="padding:28px 24px 8px 24px;text-align:center;">
          <div style="font-size:28px;line-height:1.2;font-weight:700;">¡Gracias por tu regalo, ${escapeHtml(
            payerName
          )}!</div>
          <p style="margin:10px 0 0 0;font-size:14px;color:#475569;">
            Tu aporte de <strong>${CLP}</strong> nos acerca un poquito más a nuevos recuerdos juntos. 💖
          </p>
        </td></tr>
        <tr><td style="padding:16px 24px;">
          <div style="background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:12px;padding:12px 14px;font-size:13px;color:#334155;">
            <div><strong>Estado:</strong> aprobado</div>
            <div><strong>Payment ID:</strong> ${escapeHtml(payment_id)}</div>
            ${
              external_reference
                ? `<div><strong>Referencia:</strong> ${escapeHtml(external_reference)}</div>`
                : ""
            }
          </div>
        </td></tr>
        <tr><td style="padding:8px 24px 28px 24px;text-align:center;">
          <p style="margin:0 0 16px 0;font-size:14px;color:#475569;">Con cariño,</p>
          <div style="font-weight:600;font-size:16px;">Piero & Debby</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:8px;">¡Gracias por ser parte de nuestra historia!</div>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#94a3b8;margin-top:12px;">Si no reconoces este correo, puedes ignorarlo.</div>
    </td></tr>
  </table>
</body></html>`;

    // 3) Enviar con Resend (REST)
    const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Falta RESEND_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const from = process.env.THANKS_FROM || "Piero & Debby <no-reply@resend.dev>";
    const bcc = process.env.THANKS_BCC || ""; // opcional

    const idemKey = external_reference || `payment:${payment_id}`;

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify({
        from,
        to: [payerEmail],
        ...(bcc ? { bcc: bcc.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
        subject: "¡Gracias por tu regalo para Piero & Debby! 💖",
        html,
      }),
    });

    if (!sendRes.ok) {
      const txt = await sendRes.text();
      return new Response(JSON.stringify({ error: "Resend error", detail: txt }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const data = await sendRes.json();
    return new Response(JSON.stringify({ ok: true, id: data?.id || null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Error interno" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

// Util para evitar XSS en plantillas simples
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
