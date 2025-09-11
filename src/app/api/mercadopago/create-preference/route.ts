// src/app/api/mercadopago/create-preference/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function env(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "");
    const email = String(body.email || "");
    const title = String(body.title || "");
    const amount = Number(body.amount || 0);
    const currency = String(body.currency || "CLP");
    const external_reference = String(body.external_reference || "");
    const cartLines = body.lines ?? null; // opcional: si decides enviar el carrito

    if (!name || !email || !amount || !external_reference) {
      return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
    }

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    // URL de webhook protegida con token
    const notification_url = `${SITE_URL}/api/mercadopago/webhook?secret=${env("MP_WEBHOOK_SECRET")}`;

    // Llama a la API de Mercado Pago
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env("MP_ACCESS_TOKEN")}`,
      },
      body: JSON.stringify({
        items: [
          { title, quantity: 1, unit_price: amount, currency_id: currency }
        ],
        payer: { name, email },
        external_reference,
        back_urls: {
          success: `${SITE_URL}/gracias`,
          failure: `${SITE_URL}/pago/resultado?status=failure`,
          pending: `${SITE_URL}/pago/resultado?status=pending`,
        },
        auto_return: "approved",
        notification_url,
        statement_descriptor: "Boda P&D",
      }),
    });

    const data = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP create preference error:", data);
      return NextResponse.json({ error: data?.message || "Error Mercado Pago" }, { status: mpRes.status });
    }

    // Guarda el registro "pending/preference_created" en DB
    const supabase = getSupabaseAdmin();
    await supabase.from("payments").insert({
      donor_name: name,
      donor_email: email,
      amount,
      currency,
      status: "preference_created",
      external_reference,
      mp_preference_id: String(data.id),
      mp_init_point: String(data.init_point || data.sandbox_init_point || ""),
      cart: cartLines,
      meta: { title },
    });

    // Devuelve el init_point para redirigir
    return NextResponse.json({
      id: data.id,
      init_point: data.init_point || data.sandbox_init_point,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || "Bad Request" }, { status: 400 });
  }
}
