import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  LogOut,
  Mail,
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
import { cn } from "@/lib/utils";
import { syncGuestDirectoryAction } from "./actions";
import { GuestSyncForm } from "./GuestSyncForm";
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
};

type RsvpRecord = DashboardRsvpRecord;

type GuestDirectoryRecord = {
  party_size: number | null;
};

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

export async function loginDashboard(formData: FormData) {
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
  cookieStore.set(DASHBOARD_COOKIE_NAME, await hashDashboardCode(configuredCode), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: DASHBOARD_COOKIE_MAX_AGE,
    path: "/dashboard",
  });

  redirect("/dashboard");
}

export async function logoutDashboard() {
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

  const [paymentsResult, rsvpResult, guestsResult, lastSyncResult] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, created_at, status, donor_name, donor_email, amount, currency, external_reference, raffle_number",
      )
      .order("created_at", { ascending: false }),
    getRsvpsWithDietPreferences(),
    supabase
      .from("guest_directory")
      .select("party_size")
      .eq("is_active", true),
    supabase
      .from("guest_sync_runs")
      .select("guest_count, completed_at")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1),
  ]);

  if (paymentsResult.error) throw paymentsResult.error;
  if (rsvpResult.error) throw rsvpResult.error;

  if (guestsResult.error && guestsResult.error.code !== "42P01") {
    throw guestsResult.error;
  }
  if (lastSyncResult.error && lastSyncResult.error.code !== "42P01") {
    throw lastSyncResult.error;
  }

  return {
    payments: (paymentsResult.data || []) as PaymentRecord[],
    rsvps: (rsvpResult.data || []) as RsvpRecord[],
    guests: (guestsResult.data || []) as GuestDirectoryRecord[],
    lastSync: (lastSyncResult.data || [])[0] as GuestSyncRunRecord | undefined,
  };
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

  const { payments, rsvps, guests, lastSync } = await getDashboardData();

  const paidPayments = payments.filter((payment) => payment.status === "paid");
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

  for (const payment of payments) {
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
  const notAttending = rsvps.filter((rsvp) => rsvpStatus(rsvp) === "no");
  const decidingLater = rsvps.filter((rsvp) => rsvpStatus(rsvp) === "later");
  const attendanceProgress =
    expectedGuestCount > 0
      ? (attending.length / expectedGuestCount) * 100
      : 0;
  const estimatedPendingAttendance = Math.max(
    expectedGuestCount -
      attending.length -
      notAttending.length,
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
          <div className="flex flex-col gap-3 md:items-end">
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
            value={`${attending.length} de ${expectedGuestCount}`}
            detail={`${estimatedPendingAttendance} personas aún sin decisión final`}
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

        <section className="space-y-3">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">Pagos</h2>
              <p className="text-sm text-muted-foreground">
                Detalle de personas que iniciaron o completaron un regalo.
              </p>
            </div>
            <Badge variant="outline">{payments.length} registros</Badge>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Quien pago</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.length ? (
                  displayPayments.map(({ payment, statusInfo }) => (
                    <tr key={payment.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {payment.donor_name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {payment.donor_email || "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">
                        {formatCLP(payment.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                            statusInfo.className,
                          )}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payment.external_reference ||
                          payment.raffle_number ||
                          "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      Aun no hay pagos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
      </div>
    </main>
  );
}
