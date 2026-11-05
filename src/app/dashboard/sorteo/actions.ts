"use server";

import { randomInt } from "node:crypto";
import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isTestPayment } from "@/lib/testPayments";

export async function drawWinner() {
  if (!(await hasDashboardAccess())) return { error: "Tu sesión expiró. Vuelve a ingresar al dashboard." };

  try {
    const supabase = getSupabaseAdmin();
    const payments = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from("payments")
        .select("donor_name, donor_email, external_reference, raffle_number, meta")
        .eq("status", "paid").not("raffle_number", "is", null)
        .order("id").range(offset, offset + pageSize - 1);
      if (error) throw error;
      payments.push(...data);
      if (data.length < pageSize) break;
    }
    const eligible = payments.filter((payment) => !isTestPayment(payment) && payment.donor_name?.trim() && Number.isInteger(payment.raffle_number));
    if (!eligible.length) return { error: "Aún no hay pagos participantes con número de sorteo." };
    const winner = eligible[randomInt(eligible.length)];
    return { winner: { name: winner.donor_name!.trim(), number: String(winner.raffle_number) }, count: eligible.length };
  } catch (error) {
    console.error("Raffle draw failed", error);
    return { error: "No pudimos cargar los participantes. Inténtalo nuevamente." };
  }
}
