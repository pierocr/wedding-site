import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DASHBOARD_TARGETS } from "@/config/dashboard";
import {
  DASHBOARD_COOKIE_MAX_AGE,
  DASHBOARD_COOKIE_NAME,
  getDashboardAccessCode,
  hashDashboardCode,
  hasDashboardAccess,
  safeEqual,
} from "@/lib/dashboardAccess";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchFlowSettlements, fetchFlowStatus, getFlowConfig } from "@/lib/flow";
import { directTransferInsights, paymentInsights, type PaymentInsights } from "@/lib/paymentInsights";
import { isTestPayment } from "@/lib/testPayments";
import { reconcileGuestPayments, type PaymentGuest } from "@/lib/guestPayments";
import { activeManualConfirmations, countAdditionalManualConfirmations, getPendingGuests, type DirectoryGuest, type ManualEvent } from "@/lib/pendingGuests";
import { syncGuestDirectoryAction } from "./actions";
import { GuestSyncForm } from "./GuestSyncForm";
import { GuestPaymentsTable } from "./GuestPaymentsTable";
import { PaymentsTable } from "./PaymentsTable";
import { PendingGuestsTable } from "./PendingGuestsTable";
import { RsvpTable, type DashboardRsvpRecord } from "./RsvpTable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Dashboard privado",
  robots: {
    index: false,
    follow: false,
  },
};

type PaymentRecord = {
  id: string;
  created_at: string | null;
  status: string | null;
  donor_name: string | null;
  donor_email: string | null;
  amount: number | null;
  currency: string | null;
  external_reference: string | null;
  raffle_number: number | null;
  meta: Record<string, any> | null;
};

type RsvpRecord = DashboardRsvpRecord;

type GuestDirectoryRecord = DirectoryGuest & PaymentGuest;

type GuestSyncRunRecord = {
  guest_count: number;
  completed_at: string | null;
};

type LegacyRsvpRecord = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  last_submitted_at: string | null;
  name: string;
  email: string;
  phone: string | null;
  attending: boolean | null;
  attending_status: string | null;
  vegetarian: boolean | null;
  pescatarian: boolean | null;
  vegan: boolean | null;
  diet: string | null;
  message: string | null;
  submission_count: number | null;
};

const RSVP_SELECT =
  "id, created_at, updated_at, last_submitted_at, name, email, phone, attending, attending_status, guests, vegetarian, pescatarian, vegan, diet, message, source, user_agent, ip_address, metadata, submission_count, companion_status, is_companion, companion_of_rsvp_id";

const RSVP_LEGACY_SELECT =
  "id, created_at, updated_at, last_submitted_at, name, email, phone, attending, attending_status, vegetarian, diet, message, source, user_agent, ip_address, metadata, submission_count";

type SupabaseQueryError = {
  code?: string;
  message?: string;
};

async function loginDashboard(formData: FormData) {
  "use server";

  const configuredCode = getDashboardAccessCode();
  const submittedCode = String(formData.get("code") || "").trim();

  if (
    !configuredCode ||
    !submittedCode ||
    !safeEqual(submittedCode, configuredCode)
  ) {
    redirect("/dashboard?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    DASHBOARD_COOKIE_NAME,
    await hashDashboardCode(configuredCode),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: DASHBOARD_COOKIE_MAX_AGE,
      path: "/dashboard",
    },
  );

  redirect("/dashboard");
}

async function logoutDashboard() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(DASHBOARD_COOKIE_NAME);
  redirect("/dashboard");
}

function formatCLP(amount: number | null | undefined) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

function statusLabel(status: string | null | undefined) {
  if (status === "paid") return "Pagado";
  if (status === "pending") return "Pendiente";
  if (status === "rejected") return "Rechazado";
  if (status === "cancelled") return "Cancelado";
  return status || "Sin estado";
}

function statusClass(status: string | null | undefined) {
  if (status === "paid")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "pending")
    return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "rejected" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-border bg-muted text-muted-foreground";
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

function paymentStatus(payment: PaymentRecord, paidEmails: Set<string>) {
  if (isTestPayment(payment)) {
    return { label: `Prueba · ${statusLabel(payment.status)}`, className: "border-slate-200 bg-slate-100 text-slate-700" };
  }
  const donorEmail = normalizeEmail(payment.donor_email);

  if (
    payment.status === "pending" &&
    donorEmail &&
    paidEmails.has(donorEmail)
  ) {
    return {
      label: "Pagado en otro intento",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  return {
    label: statusLabel(payment.status),
    className: statusClass(payment.status),
  };
}

function rsvpStatus(rsvp: RsvpRecord) {
  if (
    rsvp.attending_status === "yes" ||
    rsvp.attending_status === "no" ||
    rsvp.attending_status === "later"
  ) {
    return rsvp.attending_status;
  }

  return rsvp.attending ? "yes" : "no";
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

async function getRsvpsWithDietPreferences() {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("rsvp")
    .select(RSVP_SELECT)
    .order("last_submitted_at", { ascending: false });

  if (!isMissingColumnError(result.error)) {
    return result;
  }

  const legacyResult = await supabase
    .from("rsvp")
    .select(RSVP_LEGACY_SELECT)
    .order("last_submitted_at", { ascending: false });

  return {
    ...legacyResult,
    data: (legacyResult.data as LegacyRsvpRecord[] | null | undefined)?.map(
      (rsvp) => ({
        ...rsvp,
        guests: 0,
        pescatarian: false,
        vegan: false,
        companion_status: "no",
        is_companion: false,
        companion_of_rsvp_id: null,
      }),
    ),
  };
}

function isMissingColumnError(error: SupabaseQueryError | null) {
  return error?.code === "42703";
}

async function getDashboardData() {
  const supabase = getSupabaseAdmin();

  const [paymentsResult, rsvpResult, guestsResult, lastSyncResult, manualResult] =
    await Promise.all([
      supabase
        .from("payments")
        .select(
          "id, created_at, status, donor_name, donor_email, amount, currency, external_reference, raffle_number, meta",
        )
        .order("created_at", { ascending: false }),
      getRsvpsWithDietPreferences(),
      supabase
        .from("guest_directory")
        .select("id, first_name, last_name, companion_name, email, attendance_status, party_size")
        .eq("is_active", true),
      supabase
        .from("guest_sync_runs")
        .select("guest_count, completed_at")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1),
      supabase.from("manual_guest_confirmation_events")
        .select("id, guest_id, guest_name, scope, confirmed, created_at")
        .order("id", { ascending: false }),
    ]);

  if (paymentsResult.error) throw paymentsResult.error;
  if (rsvpResult.error) throw rsvpResult.error;

  if (guestsResult.error && guestsResult.error.code !== "42P01") {
    throw guestsResult.error;
  }
  if (lastSyncResult.error && lastSyncResult.error.code !== "42P01") {
    throw lastSyncResult.error;
  }
  if (manualResult.error && !["42P01", "PGRST205"].includes(manualResult.error.code)) throw manualResult.error;

  return {
    payments: (paymentsResult.data || []) as PaymentRecord[],
    rsvps: (rsvpResult.data || []) as RsvpRecord[],
    guests: (guestsResult.data || []) as GuestDirectoryRecord[],
    lastSync: (lastSyncResult.data || [])[0] as GuestSyncRunRecord | undefined,
    manualEvents: (manualResult.data || []) as ManualEvent[],
    manualAvailable: !manualResult.error,
  };
}

async function getFlowInsights(payments: PaymentRecord[]) {
  const insights = new Map<string, PaymentInsights>();
  const paid = payments.filter((payment) => payment.status === "paid");
  const flowPayments = paid.filter((payment) => !directTransferInsights(payment));
  let unavailable = false;
  let config: ReturnType<typeof getFlowConfig> | null = null;
  try { config = getFlowConfig(); } catch { unavailable = flowPayments.length > 0; }
  const eligible = flowPayments.filter((payment) => {
    const environment = payment.meta?.flow_environment;
    return config && (environment === config.environment || (!environment && config.environment === "production"));
  });
  const settlementByOrder = new Map<string, Record<string, any>>();
  const dates = eligible.map((payment) => payment.created_at?.slice(0, 10)).filter((date): date is string => Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date))).sort();
  if (dates.length) {
    try {
      const endDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const result = await fetchFlowSettlements(dates[0], endDate);
      unavailable ||= result.incomplete;
      for (const detail of result.details) {
        if (detail.trxId != null) settlementByOrder.set(String(detail.trxId), detail);
      }
    } catch (error) {
      console.error("No se pudieron consultar las liquidaciones Flow", error);
      unavailable = true;
    }
  }
  // Refresh older responses that did not include the extended fields, without changing payment records.
  const refresh = eligible.filter((payment) => payment.meta?.flow_token && !Object.prototype.hasOwnProperty.call(payment.meta?.flow_status_response?.paymentData || {}, "installments"));
  const refreshed = new Map<string, Record<string, any>>();
  for (let index = 0; index < refresh.length; index += 5) {
    await Promise.all(refresh.slice(index, index + 5).map(async (payment) => {
      try { refreshed.set(payment.id, (await fetchFlowStatus(payment.meta!.flow_token, 5000)).raw); }
      catch { unavailable = true; }
    }));
  }
  for (const payment of paid) {
    const directTransfer = directTransferInsights(payment);
    if (directTransfer) {
      insights.set(payment.id, directTransfer);
      continue;
    }
    const raw = refreshed.get(payment.id) || payment.meta?.flow_status_response;
    const order = payment.meta?.flow_order ?? raw?.flowOrder;
    const settlement = eligible.includes(payment) && order != null ? settlementByOrder.get(String(order)) : undefined;
    insights.set(payment.id, paymentInsights(raw, settlement));
  }
  return { insights, unavailable };
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ProgressStat({
  label,
  value,
  detail,
  percentage,
  progressLabel,
}: {
  label: string;
  value: string;
  detail: string;
  percentage: number;
  progressLabel: string;
}) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal tnum">
            {value}
          </p>
        </div>
        <div
          aria-label={`${progressLabel}: ${formatPercentage(safePercentage)}`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(safePercentage)}
          className="relative grid h-14 w-14 shrink-0 place-items-center text-primary"
          role="progressbar"
        >
          <svg
            aria-hidden="true"
            className="h-14 w-14 -rotate-90"
            viewBox="0 0 64 64"
          >
            <circle
              className="text-muted"
              cx="32"
              cy="32"
              fill="none"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
            />
            <circle
              cx="32"
              cy="32"
              fill="none"
              r={radius}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              strokeWidth="5"
            />
          </svg>
          <span className="absolute text-xs font-semibold text-foreground tnum">
            {formatPercentage(safePercentage)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}

function LoginView({ hasError }: { hasError: boolean }) {
  const hasCode = Boolean(getDashboardAccessCode());

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal">
                Dashboard privado
              </h1>
              <p className="text-sm text-muted-foreground">
                Ingresa el codigo de acceso.
              </p>
            </div>
          </div>

          {!hasCode ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Falta configurar <code>DASHBOARD_ACCESS_CODE</code> en las
              variables de entorno.
            </div>
          ) : (
            <form action={loginDashboard} className="space-y-4">
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="code"
                >
                  Codigo
                </label>
                <Input
                  id="code"
                  name="code"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Ingresa tu codigo"
                />
              </div>

              {hasError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  Codigo incorrecto. Intenta nuevamente.
                </p>
              )}

              <Button className="w-full" type="submit">
                Entrar
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const allowed = await hasDashboardAccess();

  if (!allowed) {
    return <LoginView hasError={params?.error === "1"} />;
  }

  const { payments, rsvps, guests, lastSync, manualEvents, manualAvailable } = await getDashboardData();
  const manualConfirmations = activeManualConfirmations(manualEvents);
  const pendingGuests = getPendingGuests(guests, rsvps).filter((guest) => !manualConfirmations.some((event) =>
    event.guest_id === guest.id && event.guest_name === guest.name &&
    event.scope === (guest.reason === "Acompañante por confirmar" ? "companion" : "guest"),
  ));

  const realPayments = payments.filter((payment) => !isTestPayment(payment));
  const testPaymentCount = payments.length - realPayments.length;
  const paidPayments = realPayments.filter((payment) => payment.status === "paid");
  const guestPayments = reconcileGuestPayments(guests, realPayments);
  const { insights, unavailable: flowUnavailable } = await getFlowInsights(realPayments);
  const withBalance = paidPayments.filter((payment) => insights.get(payment.id)?.balance != null);
  const grossWithBalance = withBalance.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const netBalance = withBalance.reduce((sum, payment) => sum + (insights.get(payment.id)?.balance ?? 0), 0);
  const withRate = paidPayments.filter((payment) => insights.get(payment.id)?.rate != null && Number(payment.amount) > 0);
  const flowPaymentCount = paidPayments.filter((payment) => !directTransferInsights(payment)).length;
  const rateGross = withRate.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const averageRate = rateGross ? withRate.reduce((sum, payment) => sum + Number(payment.amount) * insights.get(payment.id)!.rate!, 0) / rateGross : null;
  const totalPaid = paidPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const paidDonorEmails = new Set(
    paidPayments
      .map((payment) => normalizeEmail(payment.donor_email))
      .filter((email): email is string => Boolean(email)),
  );
  const pendingPayers = new Map<string, PaymentRecord>();

  for (const payment of realPayments) {
    if (payment.status !== "pending") continue;

    const donorEmail = normalizeEmail(payment.donor_email);
    if (donorEmail && paidDonorEmails.has(donorEmail)) continue;

    pendingPayers.set(donorEmail || payment.id, payment);
  }

  const pendingPayments = [...pendingPayers.values()];
  const displayPayments = payments.map((payment) => ({
    payment,
    statusInfo: paymentStatus(payment, paidDonorEmails),
  }));
  const guestCountFromDirectory = guests.reduce(
    (sum, guest) => sum + Number(guest.party_size || 0),
    0,
  );
  const expectedGuestCount =
    guestCountFromDirectory || DASHBOARD_TARGETS.expectedGuestCount;
  const expectedPaymentCount = Math.ceil(
    expectedGuestCount / DASHBOARD_TARGETS.guestsPerPayment,
  );
  const paymentProgress =
    expectedPaymentCount > 0
      ? (paidPayments.length / expectedPaymentCount) * 100
      : 0;
  const averageTicket = paidPayments.length
    ? totalPaid / paidPayments.length
    : 0;
  const attending = rsvps.filter((rsvp) => rsvpStatus(rsvp) === "yes");
  const manualAttendance = countAdditionalManualConfirmations(guests, rsvps, manualConfirmations);
  const confirmedAttendance = attending.length + manualAttendance.count;
  const notAttending = rsvps.filter((rsvp) => rsvpStatus(rsvp) === "no");
  const decidingLater = rsvps.filter((rsvp) => rsvpStatus(rsvp) === "later");
  const attendanceProgress =
    expectedGuestCount > 0 ? (confirmedAttendance / expectedGuestCount) * 100 : 0;
  const estimatedPendingAttendance = Math.max(
    expectedGuestCount - confirmedAttendance - notAttending.length,
    0,
  );
  const principalRsvps = rsvps.filter((rsvp) => !rsvp.is_companion);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Piero & Debby
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">
              Dashboard privado
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pagos, datos de contacto y confirmaciones de asistencia.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3 md:justify-end">
            <Button asChild variant="outline"><Link href="/dashboard/sorteo">✦ El gran sorteo</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/fotos">Fotos de invitados y QR</Link></Button>
            <GuestSyncForm action={syncGuestDirectoryAction} />
            <form action={logoutDashboard}>
              <Button variant="outline" type="submit">
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </form>
          </div>
        </header>

        <section
          aria-label="Estado de la lista de invitados"
          className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
        >
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">Lista de invitados</p>
              <p className="text-muted-foreground">
                {guestCountFromDirectory
                  ? `${guestCountFromDirectory} invitados en la planilla INVITADOS.`
                  : `Aún no se ha sincronizado el Excel; se usa la estimación de ${DASHBOARD_TARGETS.expectedGuestCount} invitados.`}
              </p>
            </div>
            {lastSync?.completed_at ? (
              <p className="text-xs text-muted-foreground">
                Última actualización: {formatDate(lastSync.completed_at)}
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3" aria-label="Desglose financiero de Flow">
          <div>
            <h2 className="text-xl font-semibold">Lo recaudado y lo que recibirán</h2>
            <p className="text-sm text-muted-foreground">El neto reúne los saldos informados por Flow y las transferencias directas identificadas.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Stat icon={CircleDollarSign} label="Total pagado" value={formatCLP(totalPaid)} detail={`${paidPayments.length} pagos aprobados`} />
            <Stat icon={CircleDollarSign} label="Neto disponible" value={withBalance.length ? formatCLP(netBalance) : "No disponible"} detail={`${withBalance.length} de ${paidPayments.length} pagos con neto conocido`} />
            <Stat icon={CircleDollarSign} label="Descuento total" value={withBalance.length ? formatCLP(grossWithBalance - netBalance) : "No disponible"} detail={`Diferencia sobre ${formatCLP(grossWithBalance)} en pagos con saldo`} />
            <Stat icon={CircleDollarSign} label="Tasa promedio" value={averageRate == null ? "No disponible" : `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(averageRate)} %`} detail={`Ponderada por monto · ${withRate.length} de ${flowPaymentCount} pagos Flow con tasa`} />
          </div>
          <p className="text-xs text-muted-foreground">El neto de Flow puede incluir pagos aún por depositar. La tasa proviene de liquidaciones de Flow y excluye las transferencias directas; los pagos sin información quedan fuera de los cálculos correspondientes. Los pagos de prueba de Piero se excluyen de los indicadores.{flowUnavailable ? " No fue posible consultar todos los datos de Flow; intenta recargar más tarde." : ""}</p>
        </section>

        <section
          aria-label="Resumen de pagos"
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
        >
          <ProgressStat
            label="Avance de pagos"
            value={`${paidPayments.length} de ${expectedPaymentCount}`}
            detail={`${Math.max(expectedPaymentCount - paidPayments.length, 0)} pagos estimados por recibir`}
            percentage={paymentProgress}
            progressLabel="Avance de pagos"
          />
          <Stat
            icon={CircleDollarSign}
            label="Total pagado"
            value={formatCLP(totalPaid)}
            detail={`${paidPayments.length} pagos aprobados`}
          />
          <Stat
            icon={CircleDollarSign}
            label="Ticket promedio"
            value={formatCLP(averageTicket)}
            detail="Promedio por pago aprobado"
          />
          <Stat
            icon={Clock3}
            label="Pagos pendientes reales"
            value={String(pendingPayments.length)}
            detail="Personas sin un pago aprobado"
          />
        </section>

        <section
          aria-label="Resumen de asistencia"
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
        >
          <ProgressStat
            label="Asistencia confirmada"
            value={`${confirmedAttendance} de ${expectedGuestCount}`}
            detail={`${attending.length} por formulario + ${manualAttendance.count} manuales${manualAttendance.review ? ` · ${manualAttendance.review} por revisar` : ""}`}
            percentage={attendanceProgress}
            progressLabel="Asistencia confirmada"
          />
          <Stat
            icon={Clock3}
            label="Por confirmar"
            value={`~${estimatedPendingAttendance}`}
            detail={
              guestCountFromDirectory
                ? "Estimación basada en la planilla INVITADOS"
                : `Estimación según ${DASHBOARD_TARGETS.expectedGuestCount} invitados`
            }
          />
          <Stat
            icon={CalendarCheck}
            label="No asisten"
            value={String(notAttending.length)}
            detail="Personas que avisaron que no asistirán"
          />
          <Stat
            icon={Clock3}
            label="Confirmarán más adelante"
            value={String(decidingLater.length)}
            detail={`${rsvps.length} personas registradas en RSVP`}
          />
        </section>

        <p className="text-xs text-muted-foreground">
          El total suma las confirmaciones manuales y del formulario. Si una misma persona figura con nombres que no coinciden, podría contarse dos veces; revisa esos casos en las confirmaciones manuales.
        </p>

        <section className="space-y-3">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">Pagos</h2>
              <p className="text-sm text-muted-foreground">
                Detalle de personas que iniciaron o completaron un regalo. {testPaymentCount > 0 ? `${testPaymentCount} registros de prueba se muestran identificados y no se suman.` : ""}
              </p>
            </div>
            <Badge variant="outline">{payments.length} registros</Badge>
          </div>

          <PaymentsTable
            payments={displayPayments.map(({ payment, statusInfo }) => ({
              id: payment.id, created_at: payment.created_at, donor_name: payment.donor_name,
              donor_email: payment.donor_email, amount: payment.amount, external_reference: payment.external_reference,
              raffle_number: payment.raffle_number, statusInfo, insights: insights.get(payment.id) || null,
            }))}
          />
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                Confirmaciones RSVP
              </h2>
              <p className="text-sm text-muted-foreground">
                Conteo y detalle de invitados que confirmaron asistencia.
              </p>
            </div>
            <Badge variant="outline">
              {attending.length} personas confirmadas
            </Badge>
          </div>

          <RsvpTable rsvps={principalRsvps} allRsvps={rsvps} />
        </section>
        <section className="space-y-3">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">Personas por confirmar</h2>
              <p className="text-sm text-muted-foreground">
                Cruce orientativo de la planilla y RSVP. Revisa los nombres sin coincidencia: pueden tener diferencias de escritura o apodos.
              </p>
            </div>
            <Badge variant="outline">{pendingGuests.length} registros por revisar</Badge>
          </div>
          <PendingGuestsTable guests={pendingGuests} hasDirectory={guests.length > 0} manualAvailable={manualAvailable} manualConfirmations={manualConfirmations} />
        </section>

        <section className="space-y-3" aria-label="Cruce de invitados y pagos">
          <div>
            <h2 className="text-xl font-semibold">Invitados y pagos</h2>
            <p className="text-sm text-muted-foreground">Cruce orientativo por nombre o correo, actualizado cada 30 segundos mientras el dashboard está abierto. Un pago encontrado no indica a cuántas personas cubre.</p>
            <p className="text-sm text-muted-foreground">Sin pago encontrado no significa necesariamente una deuda: revisen pagos externos, nombres diferentes y aportes de parejas. La lista de invitados se actualiza al sincronizar la planilla.</p>
          </div>
          <GuestPaymentsTable initialRows={guestPayments} />
        </section>


      </div>
    </main>
  );
}
