export const runtime = "edge";
export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  email?: string;
  title: string;
  amount: number; // CLP entero
  currency?: string; // default CLP
  siteUrl?: string; // opcional
  external_reference?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: "Falta MP_ACCESS_TOKEN" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Usa tu var NEXT_PUBLIC_SITE_URL; si no existe, toma el origin de la request.
    const baseUrl =
      body.siteUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin;

    const externalRef =
      body.external_reference || `ref_${Date.now().toString(36)}`;

    const payload = {
      items: [
        {
          id: externalRef,
          title: body.title,
          quantity: 1,
          unit_price: Math.round(body.amount),
          currency_id: body.currency || "CLP",
        },
      ],
      payer: body.email
        ? { name: body.name || undefined, email: body.email }
        : undefined,
      metadata: { origin: "wedding-site", external_reference: externalRef },
      back_urls: {
        success: `${baseUrl}/pago/resultado`,
        failure: `${baseUrl}/pago/resultado`,
        pending: `${baseUrl}/pago/resultado`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      statement_descriptor: "REGALO BODA",
      external_reference: externalRef,
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: json }), {
        status: res.status,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        id: json.id,
        init_point: json.init_point,
        sandbox_init_point: json.sandbox_init_point,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Error inesperado" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
