import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Body = {
  title: string;
  amount: number; // CLP entero, sin decimales
  name?: string;
  email?: string;
  external_reference?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Falta MP_ACCESS_TOKEN" },
        { status: 500 }
      );
    }
    if (!process.env.NEXT_PUBLIC_URL) {
      return NextResponse.json(
        { error: "Falta NEXT_PUBLIC_URL" },
        { status: 500 }
      );
    }

    const payload = {
      items: [
        {
          title: body.title,
          unit_price: Math.round(body.amount),
          quantity: 1,
          currency_id: "CLP",
        },
      ],
      payer: body.email
        ? {
            name: body.name || undefined,
            email: body.email,
          }
        : undefined,
      external_reference:
        body.external_reference || `ref_${Date.now().toString(36)}`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/pago/resultado`,
        failure: `${process.env.NEXT_PUBLIC_URL}/pago/resultado`,
        pending: `${process.env.NEXT_PUBLIC_URL}/pago/resultado`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/mercadopago/webhook`,
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: json }, { status: res.status });
    }

    // Devuelve la preferencia completa (incluye init_point / sandbox_init_point)
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
