// src/app/api/flow/webhook/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchFlowStatus } from "@/lib/flow";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendFlowReceiptEmail } from "@/lib/email/flowReceipt";
import { generateUniqueRaffleNumber, readRaffleNumber } from "@/lib/raffle";

async function parseForm(req: Request) {
  try {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  } catch {
    return {};
  }
}

async function findPayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  opts: { commerceOrder?: string | null; token?: string | null }
) {
  if (opts.commerceOrder) {
    const byOrder = await supabase
      .from("payments")
      .select("*")
      .eq("external_reference", opts.commerceOrder)
      .maybeSingle();
    if (byOrder.data) return byOrder.data as any;
  }

  if (opts.token) {
    const byToken = await supabase
      .from("payments")
      .select("*")
      .contains("meta", { flow_token: opts.token })
      .maybeSingle();
    if (byToken.data) return byToken.data as any;
  }

  return null;
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  let token: string | null = null;
  let raw: any = null;

  try {
    raw = await parseForm(req);
    token = raw?.token ? String(raw.token) : null;
  } catch {
    raw = null;
  }

  // Guarda log crudo (best-effort)
  try {
    await supabase.from("webhook_logs").insert({
      source: "flow",
      topic: "confirm",
      data: { raw, token },
    });
  } catch (err) {
    console.error("[flow/webhook] no se pudo guardar log:", err);
  }

  if (!token) {
    return NextResponse.json({ ok: true, error: "missing token" });
  }

  let statusData: Awaited<ReturnType<typeof fetchFlowStatus>> | null = null;
  try {
    statusData = await fetchFlowStatus(token);
  } catch (err) {
    console.error("[flow/webhook] estado Flow", err);
    return NextResponse.json({ ok: true, error: "flow status error" });
  }

  const payment = await findPayment(supabase, {
    commerceOrder: statusData.commerceOrder,
    token,
  });

  const existingMeta = (payment?.meta as Record<string, any> | null) || {};
  const raffle_number = readRaffleNumber(payment, existingMeta);

  const nextMeta: Record<string, any> = {
    ...existingMeta,
    flow_token: existingMeta.flow_token || token,
    flow_order: statusData.flowOrder || existingMeta.flow_order || null,
    flow_status_response: statusData.raw,
    email_sent_at: existingMeta.email_sent_at || null,
  };

  let finalRaffle = raffle_number;
  if (statusData.status === "paid" && !raffle_number) {
    finalRaffle = await generateUniqueRaffleNumber(supabase);
    nextMeta.raffle_number = finalRaffle;
  }

  const update: Record<string, any> = {
    status: statusData.status,
    amount: payment?.amount ?? statusData.amount ?? null,
    donor_email: payment?.donor_email ?? statusData.payerEmail ?? null,
    donor_name: payment?.donor_name ?? statusData.payerName ?? null,
    external_reference: payment?.external_reference ?? statusData.commerceOrder ?? token,
    meta: nextMeta,
  };
  if (finalRaffle) update.raffle_number = finalRaffle;

  let updatedPayment = payment;
  let paymentPersisted = false;

  try {
    if (payment?.id) {
      const res = await supabase.from("payments").update(update).eq("id", payment.id).select().single();
      if (res.error) throw res.error;
      if (res.data) {
        updatedPayment = res.data as any;
        paymentPersisted = true;
      }
    } else {
      const res = await supabase.from("payments").insert(update).select().single();
      if (res.error) throw res.error;
      if (res.data) {
        updatedPayment = res.data as any;
        paymentPersisted = true;
      }
    }
  } catch (err) {
    console.error("[flow/webhook] update error", err);
    return NextResponse.json({ ok: true, error: "payment persistence error" });
  }

  // Marcar email como pendiente si el pago fue exitoso y no se ha enviado
  const shouldMarkPending =
    statusData.status === "paid" &&
    paymentPersisted &&
    !nextMeta.email_sent_at &&
    !nextMeta.email_pending &&
    (updatedPayment?.donor_email || update.donor_email) &&
    finalRaffle;

  if (shouldMarkPending) {
    try {
      console.log("[flow/webhook] Enviando comprobante Resend", {
        paymentId: updatedPayment?.id,
        email: updatedPayment?.donor_email || update.donor_email,
        external_reference: updatedPayment?.external_reference || update.external_reference,
        raffle: finalRaffle,
      });
      await sendFlowReceiptEmail({
        donor_name: updatedPayment?.donor_name || update.donor_name || "amig@",
        donor_email: updatedPayment?.donor_email || update.donor_email || "",
        amount: Number(updatedPayment?.amount || update.amount || 0),
        raffle_number: finalRaffle as number,
        external_reference: updatedPayment?.external_reference || update.external_reference || null,
        flow_order: nextMeta.flow_order || null,
        flow_token: nextMeta.flow_token || token || null,
        cart: (updatedPayment as any)?.cart || nextMeta.cart_snapshot || null,
        message: nextMeta.message || null,
        email_log: {
          source: "flow_webhook",
          payment_id: updatedPayment?.id || null,
        },
      });
      nextMeta.email_sent_at = new Date().toISOString();
      nextMeta.email_pending = false;
      delete nextMeta.email_pending_since;
      delete nextMeta.email_error;
    } catch (err) {
      console.error("[flow/webhook] error enviando correo", (err as any)?.message || err);
      nextMeta.email_pending = true;
      nextMeta.email_pending_since = new Date().toISOString();
      nextMeta.email_error = (err as any)?.message || "send email failed";
    }
    try {
      if (updatedPayment?.id) {
        await supabase.from("payments").update({ meta: nextMeta }).eq("id", updatedPayment.id);
      }
    } catch (err) {
      console.error("[flow/webhook] no se pudo actualizar meta tras email", err);
    }
  }

  return NextResponse.json({ ok: true, status: statusData.status });
}
