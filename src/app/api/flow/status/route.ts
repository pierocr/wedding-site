// src/app/api/flow/status/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchFlowStatus, getFlowConfig } from "@/lib/flow";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateUniqueRaffleNumber, readRaffleNumber } from "@/lib/raffle";

const isFinal = (s: string | null | undefined) =>
  s === "paid" || s === "rejected" || s === "cancelled";

async function findPayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  opts: { external_reference?: string | null; token?: string | null }
) {
  if (opts.external_reference) {
    const byRef = await supabase
      .from("payments")
      .select("*")
      .eq("external_reference", opts.external_reference)
      .maybeSingle();
    if (byRef.data) return byRef.data as any;
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const external_reference = url.searchParams.get("external_reference");

  if (!token && !external_reference) {
    return NextResponse.json({ error: "Falta token o external_reference" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const flowConfig = getFlowConfig();

  let payment = await findPayment(supabase, { external_reference, token });
  let meta = (payment?.meta as Record<string, any> | null) || {};
  let status = payment?.status || "pending";

  let flowData:
    | (Awaited<ReturnType<typeof fetchFlowStatus>> & { fetched?: boolean })
    | null = null;

  if (!payment || !isFinal(status)) {
    if (!token) {
      return NextResponse.json(
        { error: "No se encontró el pago y falta token para consultar" },
        { status: 404 }
      );
    }
    try {
      flowData = await fetchFlowStatus(token);
      flowData.fetched = true;
      status = flowData.status;
      meta = {
        ...meta,
        flow_environment: meta.flow_environment || flowConfig.environment,
        flow_api_url: meta.flow_api_url || flowConfig.apiUrl,
        flow_status_response: flowData.raw,
        flow_order: flowData.flowOrder ?? meta.flow_order ?? null,
        flow_token: meta.flow_token || token,
      };

      let raffleNumber = readRaffleNumber(payment, meta);
      if (status === "paid" && !raffleNumber) {
        raffleNumber = await generateUniqueRaffleNumber(supabase);
        meta.raffle_number = raffleNumber;
      }

      const updatePayload: Record<string, any> = {
        status,
        meta,
      };
      if (raffleNumber) updatePayload.raffle_number = raffleNumber;

      if (flowData.commerceOrder) updatePayload.external_reference = flowData.commerceOrder;
      if (flowData.amount && !payment?.amount) updatePayload.amount = flowData.amount;
      if (flowData.payerEmail && !payment?.donor_email) updatePayload.donor_email = flowData.payerEmail;
      if (flowData.payerName && !payment?.donor_name) updatePayload.donor_name = flowData.payerName;

      if (payment?.id) {
        const upd = await supabase.from("payments").update(updatePayload).eq("id", payment.id).select().single();
        if (!upd.error && upd.data) payment = upd.data as any;
      } else {
        const ins = await supabase.from("payments").insert(updatePayload).select().single();
        if (!ins.error && ins.data) payment = ins.data as any;
      }
    } catch (err) {
      console.error("[flow/status] flow fetch error", err);
    }
  }

  const cart = payment?.cart || meta.cart_snapshot || null;
  const message = meta.message || null;
  const raffle_number = readRaffleNumber(payment, meta);

  return NextResponse.json({
    status,
    raffle_number,
    amount: payment?.amount ?? flowData?.amount ?? null,
    donor_name: payment?.donor_name ?? flowData?.payerName ?? null,
    donor_email: payment?.donor_email ?? flowData?.payerEmail ?? null,
    cart,
    message,
    external_reference: payment?.external_reference ?? flowData?.commerceOrder ?? external_reference,
  });
}
