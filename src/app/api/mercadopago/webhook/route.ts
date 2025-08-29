// app/api/mercadopago/webhook/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const id =
      body?.data?.id ||
      (typeof body?.resource === "string"
        ? body.resource.split("/").pop()
        : undefined);

    if (!id) return Response.json({ ok: true });

    const payment = await fetchPayment(String(id));
    // TODO: persiste / envía email si corresponde
    // console.log("MP webhook payment", payment?.id, payment?.status); // opcional

    return Response.json({ ok: true });
  } catch {
    // Responder 200 evita reintentos infinitos de MP
    return Response.json({ ok: true });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || searchParams.get("topic");
    const id =
      searchParams.get("data.id") ||
      searchParams.get("id") ||
      (searchParams.get("resource") || "")
        .split("/")
        .pop();

    if (!id) return Response.json({ ok: true });

    if (type === "merchant_order") {
      await fetchMerchantOrder(String(id));
    } else {
      await fetchPayment(String(id));
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}

async function fetchPayment(id: string) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN");
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Evita caching en el edge
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchMerchantOrder(id: string) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN");
  const res = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
