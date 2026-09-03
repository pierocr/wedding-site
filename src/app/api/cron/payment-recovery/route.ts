import { NextResponse } from "next/server";

import { sendAbandonedCartEmails } from "@/lib/email/abandonedCart";
import { sendFlowReceiptEmail } from "@/lib/email/flowReceipt";
import { fetchFlowStatus } from "@/lib/flow";
import { generateUniqueRaffleNumber, readRaffleNumber } from "@/lib/raffle";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Payment = Record<string, any>;
type RecoveryStatus = "pending" | "rejected" | "cancelled";

const asIso = (value: string) => new Date(value).toISOString();
const retryUrl = () => `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://pieroydebby.cl").replace(/\/$/, "")}/#regalo`;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

async function markRecovery(paymentId: string, patch: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("payment_recoveries")
    .upsert({ payment_id: paymentId, ...patch }, { onConflict: "payment_id" });
}

async function sendRecovery(payment: Payment, status: RecoveryStatus, attemptCount: number) {
  const meta = (payment.meta as Record<string, any>) || {};
  const now = new Date().toISOString();
  await markRecovery(payment.id, {
    status: "processing",
    notification_type: status,
    last_evaluated_at: now,
    attempt_count: attemptCount,
    last_error: null,
  });
  try {
    await sendAbandonedCartEmails({
      paymentId: String(payment.id),
      donorName: String(payment.donor_name || "amig@"),
      donorEmail: String(payment.donor_email),
      amount: Number(payment.amount || 0),
      cart: payment.cart || meta.cart_snapshot || null,
      externalReference: payment.external_reference || null,
      status,
      retryUrl: retryUrl(),
    });
    await markRecovery(payment.id, {
      status: "sent",
      notification_type: status,
      customer_email_sent_at: now,
      internal_email_sent_at: now,
      last_evaluated_at: now,
      attempt_count: attemptCount,
      last_error: null,
    });
    return "sent";
  } catch (error) {
    await markRecovery(payment.id, {
      status: "failed",
      notification_type: status,
      last_evaluated_at: now,
      attempt_count: attemptCount,
      last_error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function reconcilePaidPayment(payment: Payment, flowData: Awaited<ReturnType<typeof fetchFlowStatus>>) {
  const supabase = getSupabaseAdmin();
  const meta: Record<string, any> = {
    ...((payment.meta as Record<string, any>) || {}),
    flow_status_response: flowData.raw,
  };
  let raffleNumber = readRaffleNumber(payment, meta);
  if (!raffleNumber) {
    raffleNumber = await generateUniqueRaffleNumber(supabase);
    meta.raffle_number = raffleNumber;
  }
  await supabase.from("payments").update({ status: "paid", raffle_number: raffleNumber, meta }).eq("id", payment.id);
  if (!meta.email_sent_at) {
    await sendFlowReceiptEmail({
      donor_name: String(payment.donor_name || "amig@"),
      donor_email: String(payment.donor_email),
      amount: Number(payment.amount || 0),
      raffle_number: raffleNumber,
      external_reference: payment.external_reference || null,
      flow_order: meta.flow_order || null,
      flow_token: meta.flow_token || null,
      cart: payment.cart || meta.cart_snapshot || null,
      message: meta.message || null,
      email_log: { source: "payment_recovery_paid", payment_id: payment.id },
    });
    meta.email_sent_at = new Date().toISOString();
    await supabase.from("payments").update({ meta }).eq("id", payment.id);
  }
  await markRecovery(payment.id, { status: "skipped_paid", last_evaluated_at: new Date().toISOString() });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // Evita que el primer despliegue contacte o escriba sobre carritos antiguos.
  const startAt = process.env.ABANDONED_CART_RECOVERY_START_AT;
  if (!startAt || Number.isNaN(Date.parse(startAt))) {
    return NextResponse.json({ ok: false, error: "Missing ABANDONED_CART_RECOVERY_START_AT" }, { status: 500 });
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseAdmin();
  const { data: payments, error } = await supabase
    .from("payments")
    .select("*")
    .in("status", ["pending", "rejected", "cancelled"])
    .gte("created_at", asIso(startAt))
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(25);
  if (error) throw error;

  const paymentIds = (payments || []).map((payment: Payment) => payment.id);
  const { data: recoveries, error: recoveryError } = paymentIds.length
    ? await supabase.from("payment_recoveries").select("*").in("payment_id", paymentIds)
    : { data: [], error: null };
  if (recoveryError) throw recoveryError;
  const recoveryByPaymentId = new Map((recoveries || []).map((recovery: any) => [recovery.payment_id, recovery]));

  const results: Array<{ paymentId: string; result: string }> = [];
  for (const payment of payments || []) {
    const recovery = recoveryByPaymentId.get(payment.id) as any;
    if (recovery?.customer_email_sent_at || recovery?.status === "skipped_paid_later" || recovery?.status === "skipped_paid") {
      results.push({ paymentId: payment.id, result: "already_handled" });
      continue;
    }
    if (recovery?.status === "failed" && Number(recovery.attempt_count || 0) >= 3) {
      results.push({ paymentId: payment.id, result: "retry_limit_reached" });
      continue;
    }

    const { data: laterPaid, error: paidError } = await supabase
      .from("payments")
      .select("id")
      .eq("donor_email", payment.donor_email)
      .eq("status", "paid")
      .gt("created_at", payment.created_at)
      .limit(1);
    if (paidError) throw paidError;
    if (laterPaid?.length) {
      await markRecovery(payment.id, { status: "skipped_paid_later", last_evaluated_at: new Date().toISOString() });
      results.push({ paymentId: payment.id, result: "skipped_paid_later" });
      continue;
    }

    const token = (payment.meta as Record<string, any> | null)?.flow_token;
    if (!token) {
      await markRecovery(payment.id, { status: "unknown", last_evaluated_at: new Date().toISOString(), last_error: "Missing Flow token" });
      results.push({ paymentId: payment.id, result: "missing_flow_token" });
      continue;
    }

    const flowData = await fetchFlowStatus(String(token));
    if (flowData.status === "paid") {
      await reconcilePaidPayment(payment, flowData);
      results.push({ paymentId: payment.id, result: "paid" });
      continue;
    }
    if (flowData.status === "rejected" || flowData.status === "cancelled" || flowData.status === "pending") {
      await supabase.from("payments").update({ status: flowData.status, meta: { ...payment.meta, flow_status_response: flowData.raw } }).eq("id", payment.id);
      await sendRecovery(payment, flowData.status, Number(recovery?.attempt_count || 0) + 1);
      results.push({ paymentId: payment.id, result: `email_${flowData.status}` });
      continue;
    }
    await markRecovery(payment.id, { status: "unknown", last_evaluated_at: new Date().toISOString(), last_error: "Flow returned unknown status" });
    results.push({ paymentId: payment.id, result: "unknown" });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
