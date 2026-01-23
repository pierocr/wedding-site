// src/app/api/flow/webhook/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchFlowStatus, randomRaffleNumber } from "@/lib/flow";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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
  const raffle_number = existingMeta.raffle_number || null;

  const nextMeta: Record<string, any> = {
    ...existingMeta,
    flow_token: existingMeta.flow_token || token,
    flow_order: statusData.flowOrder || existingMeta.flow_order || null,
    flow_status_response: statusData.raw,
    email_sent_at: existingMeta.email_sent_at || null,
  };

  let finalRaffle = raffle_number;
  if (statusData.status === "paid" && !raffle_number) {
    finalRaffle = randomRaffleNumber();
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

  let updatedPayment = payment;

  try {
    if (payment?.id) {
      const res = await supabase.from("payments").update(update).eq("id", payment.id).select().single();
      if (res.data) updatedPayment = res.data as any;
    } else {
      const res = await supabase.from("payments").insert(update).select().single();
      if (res.data) updatedPayment = res.data as any;
    }
  } catch (err) {
    console.error("[flow/webhook] update error", err);
  }

  // Marcar email como pendiente si el pago fue exitoso y no se ha enviado
  const shouldMarkPending =
    statusData.status === "paid" &&
    !nextMeta.email_sent_at &&
    !nextMeta.email_pending &&
    (updatedPayment?.donor_email || update.donor_email) &&
    finalRaffle;

  if (shouldMarkPending) {
    nextMeta.email_pending = true;
    nextMeta.email_pending_since = new Date().toISOString();
    try {
      if (updatedPayment?.id) {
        await supabase.from("payments").update({ meta: nextMeta }).eq("id", updatedPayment.id);
      }
    } catch (err) {
      console.error("[flow/webhook] no se pudo marcar email_pending", err);
    }
  }

  return NextResponse.json({ ok: true, status: statusData.status });
}
