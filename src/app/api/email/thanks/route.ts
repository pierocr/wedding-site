// app/api/email/thanks/route.ts
export const runtime = "edge";

import { NextResponse } from "next/server";
import { randomRaffleNumber } from "@/lib/flow";
import { sendFlowReceiptEmail } from "@/lib/email/flowReceipt";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  external_reference?: string;
  token?: string;
  payment_id?: string | number;
};

async function findPayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  body: Body
) {
  if (body.payment_id) {
    const byId = await supabase
      .from("payments")
      .select("*")
      .eq("id", body.payment_id)
      .maybeSingle();
    if (byId.data) return byId.data as any;
  }

  if (body.external_reference) {
    const byRef = await supabase
      .from("payments")
      .select("*")
      .eq("external_reference", body.external_reference)
      .maybeSingle();
    if (byRef.data) return byRef.data as any;
  }

  if (body.token) {
    const byToken = await supabase
      .from("payments")
      .select("*")
      .contains("meta", { flow_token: body.token })
      .maybeSingle();
    if (byToken.data) return byToken.data as any;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.external_reference && !body.token && !body.payment_id) {
      return NextResponse.json(
        { error: "Debe enviar payment_id, external_reference o token" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const payment = await findPayment(supabase, body);

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    if (payment.status !== "paid") {
      return NextResponse.json(
        { error: "Solo se envían comprobantes para pagos aprobados" },
        { status: 400 }
      );
    }

    const meta = (payment.meta as Record<string, any> | null) || {};
    const raffle_number = meta.raffle_number || randomRaffleNumber();

    if (!payment.donor_email) {
      return NextResponse.json({ error: "Falta email del pagador" }, { status: 400 });
    }

    await sendFlowReceiptEmail({
      donor_name: payment.donor_name || "amig@",
      donor_email: payment.donor_email,
      amount: Number(payment.amount || 0),
      raffle_number,
      external_reference: payment.external_reference || body.external_reference || null,
      flow_order: meta.flow_order || null,
      flow_token: meta.flow_token || body.token || null,
      cart: payment.cart || meta.cart_snapshot || null,
      message: meta.message || null,
    });

    meta.raffle_number = raffle_number;
    meta.email_sent_at = new Date().toISOString();
    await supabase.from("payments").update({ meta }).eq("id", payment.id);

    return NextResponse.json({ ok: true, raffle_number });
  } catch (err: any) {
    console.error("[email/thanks]", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
