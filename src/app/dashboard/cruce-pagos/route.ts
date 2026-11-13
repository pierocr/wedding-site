import { NextResponse } from "next/server";
import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { applyPaymentDismissals, reconcileGuestPayments, type GuestPaymentDismissal, type PaymentGuest } from "@/lib/guestPayments";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isTestPayment } from "@/lib/testPayments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await hasDashboardAccess())) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const supabase = getSupabaseAdmin();
  const [guests, payments, dismissals] = await Promise.all([
    supabase.from("guest_directory").select("id, first_name, last_name, companion_name, email").eq("is_active", true),
    supabase.from("payments").select("donor_name, donor_email, status, external_reference, meta"),
    supabase.from("guest_payment_dismissals").select("guest_id, guest_name, reason"),
  ]);
  const missingTable = dismissals.error && ["42P01", "PGRST205"].includes(dismissals.error.code);
  if (guests.error || payments.error || (dismissals.error && !missingTable)) return NextResponse.json({ error: "No fue posible actualizar el cruce" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  const rows = reconcileGuestPayments(guests.data as PaymentGuest[], payments.data.filter((payment) => !isTestPayment(payment)));
  return NextResponse.json({ rows: applyPaymentDismissals(rows, (dismissals.data || []) as GuestPaymentDismissal[]), manualAvailable: !dismissals.error }, { headers: { "Cache-Control": "no-store" } });
}
