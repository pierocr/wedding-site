// src/app/api/flow/create-payment/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createFlowPayment, getFlowConfig } from "@/lib/flow";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type CartLine = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const cleanCart = (cart: any): CartLine[] => {
  if (!Array.isArray(cart)) return [];
  return cart
    .map((l) => ({
      id: String(l?.id || ""),
      title: String(l?.title || "").trim(),
      unitPrice: Number(l?.unitPrice ?? 0),
      qty: Number(l?.qty ?? 0),
    }))
    .filter((l) => l.id && l.title && l.qty > 0 && l.unitPrice > 0);
};

const cartTotal = (cart: CartLine[]) =>
  cart.reduce((acc, l) => acc + l.unitPrice * l.qty, 0);

const buildReference = () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `GIFT_${today}_${suffix}`;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      donor_name?: string;
      donor_email?: string;
      message?: string;
      cart?: CartLine[];
      amount?: number;
      currency?: string;
    };

    const donor_name = String(body?.donor_name || "").trim();
    const donor_email = String(body?.donor_email || "").trim().toLowerCase();
    const message = String(body?.message || "").trim();
    const currency = (body?.currency || "CLP").toUpperCase();
    const cart = cleanCart(body?.cart);
    const total = cartTotal(cart);

    if (!donor_name) {
      return NextResponse.json({ error: "Falta el nombre del regalante" }, { status: 400 });
    }
    if (!EMAIL_RE.test(donor_email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!cart.length || total <= 0) {
      return NextResponse.json({ error: "Carrito vacío o inválido" }, { status: 400 });
    }
    if (body?.amount && Math.abs(Number(body.amount) - total) > 0.0001) {
      return NextResponse.json({ error: "El monto no coincide con el carrito" }, { status: 400 });
    }

    const config = getFlowConfig();
    const commerceOrder = buildReference();

    // Crear pago en Flow
    const flow = await createFlowPayment({
      commerceOrder,
      amount: total,
      email: donor_email,
      subject: config.subject,
      urlConfirmation: config.urlConfirmation,
      urlReturn: config.urlReturn,
    });

    const meta = {
      message: message || undefined,
      flow_token: flow.token,
      flow_order: flow.flowOrder,
      flow_create_response: flow.raw,
      cart_snapshot: cart,
    };

    const supabase = getSupabaseAdmin();

    const baseRecord: Record<string, any> = {
      status: "pending",
      donor_name,
      donor_email,
      amount: total,
      currency,
      external_reference: commerceOrder,
      meta,
    };

    let insertRes = await supabase
      .from("payments")
      .insert({ ...baseRecord, cart })
      .select()
      .single();

    if (insertRes.error) {
      // Fallback si la columna cart no existe
      insertRes = await supabase.from("payments").insert(baseRecord).select().single();
    }

    if (insertRes.error) {
      throw insertRes.error;
    }

    const payment = insertRes.data as { id?: string | number } | null;

    return NextResponse.json({
      redirectUrl: `${flow.url}?token=${encodeURIComponent(flow.token)}`,
      external_reference: commerceOrder,
      payment_id: payment?.id ?? null,
    });
  } catch (err: any) {
    console.error("[flow/create-payment] ", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
