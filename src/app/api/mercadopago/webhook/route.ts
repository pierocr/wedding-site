// src/app/api/mercadopago/webhook/route.ts
export const runtime = "edge";            // Cloudflare-friendly
export const dynamic = "force-dynamic";   // no cache

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function env(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
}

// 🔐 Valida el secret en querystring
function isAuthorized(url: URL) {
  const secret = url.searchParams.get("secret");
  return !!secret && secret === env("MP_WEBHOOK_SECRET");
}

// GET: usado por el panel / simulador como ping (200 si el secret es correcto)
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!isAuthorized(url)) return new NextResponse("unauthorized", { status: 401 });
  return NextResponse.json({ ok: true, method: "GET" });
}

// POST: notificaciones reales de MP
export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!isAuthorized(url)) return new NextResponse("unauthorized", { status: 401 });

  const supabase = getSupabaseAdmin();

  // Lee payload (viene en varias formas según MP)
  let payload: any = {};
  try { payload = await req.json(); } catch {}

  const topic = payload?.type || payload?.topic || "unknown";
  const id =
    payload?.data?.id ||
    (typeof payload?.resource === "string" ? payload.resource.split("/").pop() : undefined);

  // Guarda log crudo (best-effort)
  try {
    await supabase.from("webhook_logs").insert({
      source: "mercadopago",
      topic,
      data: payload,
    });
  } catch {}

  // Solo nos interesa "payment"
  if (topic !== "payment" || !id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Consulta detalle del pago a MP
  const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${env("MP_ACCESS_TOKEN")}` },
  });
  const pay = await payRes.json();
  if (!payRes.ok) {
    console.error("MP payment detail error:", pay);
    return NextResponse.json({ ok: true, payment_detail_error: true }); // respondemos 200 igual
  }

  // Campos útiles
  const external_reference =
    pay.external_reference || pay.metadata?.external_reference || null;

  const update = {
    donor_email: pay.payer?.email ?? null,
    donor_name: [pay.payer?.first_name, pay.payer?.last_name].filter(Boolean).join(" ") || null,
    amount: Math.round(pay.transaction_amount ?? 0),
    currency: pay.currency_id ?? "CLP",
    status: pay.status ?? "unknown",                 // approved | rejected | pending…
    mp_payment_id: String(pay.id),
    mp_payment_status: pay.status ?? null,
    mp_payment_status_detail: pay.status_detail ?? null,
    mp_merchant_order_id: pay.order?.id ? String(pay.order.id) : null,
    external_reference,
    meta: { payment: pay },
  };

  // Intentamos actualizar por external_reference (si ya la guardamos en create-preference)
  if (external_reference) {
    await supabase.from("payments").update(update).eq("external_reference", external_reference);
  }
  // Aseguramos registro por payment_id (idempotente)
  await supabase.from("payments").upsert(update, { onConflict: "mp_payment_id" });

  return NextResponse.json({ ok: true });
}
