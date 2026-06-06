// src/app/api/email/send-pending/route.ts
export const runtime = "edge"; // Requerido por Cloudflare Pages / next-on-pages
export const maxDuration = 60; // 60 segundos máximo

import { NextResponse } from "next/server";
import { sendFlowReceiptEmail } from "@/lib/email/flowReceipt";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateUniqueRaffleNumber, readRaffleNumber } from "@/lib/raffle";

const unauthorized = () =>
  NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

export async function POST(req: Request) {
  // Verificar token de autorización
  const expectedToken = process.env.CRON_SECRET || process.env.EMAIL_TEST_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Missing CRON_SECRET (misconfiguration)" },
      { status: 500 }
    );
  }

  const headerToken =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!headerToken || headerToken !== expectedToken) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();

  // Buscar pagos pagados recientes (filtraremos por email_pending en JS)
  const { data: paidPayments, error: fetchError } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "paid")
    .limit(50)
    .order("created_at", { ascending: true });

  // Filtrar solo los que tienen email_pending = true y no tienen email_sent_at
  const pending = (paidPayments || []).filter((p) => {
    const meta = (p.meta as Record<string, any>) || {};
    return meta.email_pending === true && !meta.email_sent_at;
  }).slice(0, 10);

  if (fetchError) {
    console.error("[send-pending] Error buscando pagos:", fetchError);
    return NextResponse.json(
      { ok: false, error: fetchError.message },
      { status: 500 }
    );
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "No hay emails pendientes" });
  }

  const results: Array<{ id: number | string; success: boolean; error?: string }> = [];

  for (const payment of pending) {
    const meta = (payment.meta as Record<string, any>) || {};
    const rawCart = payment.cart ?? meta.cart_snapshot ?? null;
    const cart = Array.isArray(rawCart) ? rawCart : null;

    try {
      const raffleNumber = readRaffleNumber(payment, meta) || (await generateUniqueRaffleNumber(supabase));
      meta.raffle_number = raffleNumber;

      const raffleUpdate = await supabase
        .from("payments")
        .update({ meta, raffle_number: raffleNumber })
        .eq("id", payment.id)
        .select("id")
        .single();

      if (raffleUpdate.error) throw raffleUpdate.error;

      await sendFlowReceiptEmail({
        donor_name: String(payment.donor_name || "amig@"),
        donor_email: String(payment.donor_email),
        amount: Number(payment.amount || 0),
        raffle_number: raffleNumber,
        external_reference: payment.external_reference || null,
        flow_order: meta.flow_order || null,
        flow_token: meta.flow_token || null,
        cart,
        message: meta.message || null,
        email_log: {
          source: "email_send_pending",
          payment_id: payment.id,
        },
      });

      // Actualizar meta: marcar como enviado y remover pending
      const {
        email_pending: _emailPending,
        email_pending_since: _emailPendingSince,
        ...metaWithoutPending
      } = meta;
      const updatedMeta = {
        ...metaWithoutPending,
        raffle_number: raffleNumber,
        email_sent_at: new Date().toISOString(),
      };

      await supabase
        .from("payments")
        .update({ meta: updatedMeta, raffle_number: raffleNumber })
        .eq("id", payment.id);

      results.push({ id: payment.id, success: true });
      console.log(`[send-pending] Email enviado para pago ${payment.id}`);
    } catch (err) {
      const errorMsg = (err as any)?.message || String(err);
      console.error(`[send-pending] Error enviando email para pago ${payment.id}:`, err);

      // Guardar error en meta
      const updatedMeta = {
        ...meta,
        email_error: errorMsg,
        email_failed_at: new Date().toISOString(),
      };

      await supabase
        .from("payments")
        .update({ meta: updatedMeta })
        .eq("id", payment.id);

      results.push({ id: payment.id, success: false, error: errorMsg });
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    successful,
    failed,
    results,
  });
}

// También permitir GET para pruebas manuales
export async function GET(req: Request) {
  return POST(req);
}
