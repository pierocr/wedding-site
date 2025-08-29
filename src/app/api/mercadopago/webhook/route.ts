import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams);
    const json = await req.json().catch(() => ({}));
    console.log("MP WEBHOOK >>>", { query, json });

    // TODO: consultar el pago/merchant_order por ID recibido y guardar en tu DB
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("MP WEBHOOK error:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
