import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  CircleDollarSign,
  LogOut,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Dashboard privado",
  robots: {
    index: false,
    follow: false,
  },
};

const COOKIE_NAME = "wedding_dashboard_access";
const COOKIE_MAX_AGE = 60 * 60 * 12;

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

type RsvpRecord = {
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

function getAccessCode() {
  return process.env.DASHBOARD_ACCESS_CODE || process.env.ADMIN_ACCESS_CODE || "";
}

function getSessionSecret() {
  return (
    process.env.DASHBOARD_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    "dashboard-session"
  );
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashCode(code: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(code));
  return toHex(signature);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

async function hasDashboardAccess() {
  const code = getAccessCode();
  if (!code) return false;
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value || "";
  return safeEqual(session, await hashCode(code));
}

export async function loginDashboard(formData: FormData) {
  "use server";

  const configuredCode = getAccessCode();
  const submittedCode = String(formData.get("code") || "").trim();

  if (!configuredCode || !submittedCode || !safeEqual(submittedCode, configuredCode)) {
    redirect("/dashboard?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, await hashCode(configuredCode), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/dashboard",
  });

  redirect("/dashboard");
}

export async function logoutDashboard() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
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
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "rejected" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-border bg-muted text-muted-foreground";
}

async function getDashboardData() {
  const supabase = getSupabaseAdmin();

  const [paymentsResult, rsvpResult] = await Promise.all([
    supabase
      .from("payments")
      .select("id, created_at, status, donor_name, donor_email, amount, currency, external_reference, raffle_number")
      .order("created_at", { ascending: false }),
    supabase
      .from("rsvp")
      .select(
        "id, created_at, updated_at, last_submitted_at, name, email, phone, attending, attending_status, vegetarian, pescatarian, vegan, diet, message, submission_count"
      )
      .order("last_submitted_at", { ascending: false }),
  ]);

  if (paymentsResult.error) throw paymentsResult.error;
  if (rsvpResult.error) throw rsvpResult.error;

  return {
    payments: (paymentsResult.data || []) as PaymentRecord[],
    rsvps: (rsvpResult.data || []) as RsvpRecord[],
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

function LoginView({ hasError }: { hasError: boolean }) {
  const hasCode = Boolean(getAccessCode());

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal">Dashboard privado</h1>
              <p className="text-sm text-muted-foreground">Ingresa el codigo de acceso.</p>
            </div>
          </div>

          {!hasCode ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Falta configurar <code>DASHBOARD_ACCESS_CODE</code> en las variables de entorno.
            </div>
          ) : (
            <form action={loginDashboard} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="code">
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

  const { payments, rsvps } = await getDashboardData();

  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const attending = rsvps.filter((rsvp) => rsvp.attending === true);
  const notAttending = rsvps.filter((rsvp) => rsvp.attending === false);

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
          <form action={logoutDashboard}>
            <Button variant="outline" type="submit">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </form>
        </header>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={CircleDollarSign}
            label="Total pagado"
            value={formatCLP(totalPaid)}
            detail={`${paidPayments.length} pagos aprobados`}
          />
          <Stat
            icon={Users}
            label="Confirmados"
            value={String(attending.length)}
            detail={`${rsvps.length} respuestas recibidas`}
          />
          <Stat
            icon={CalendarCheck}
            label="No asisten"
            value={String(notAttending.length)}
            detail="Personas que avisaron que no podran asistir"
          />
          <Stat
            icon={Mail}
            label="Pagos pendientes"
            value={String(payments.filter((payment) => payment.status === "pending").length)}
            detail="Iniciados, aun sin confirmacion de Flow"
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
                  payments.map((payment) => (
                    <tr key={payment.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">{payment.donor_name || "-"}</td>
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
                            statusClass(payment.status)
                          )}
                        >
                          {statusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payment.external_reference || payment.raffle_number || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
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
              <h2 className="text-xl font-semibold tracking-normal">Confirmaciones RSVP</h2>
              <p className="text-sm text-muted-foreground">
                Conteo y detalle de invitados que confirmaron asistencia.
              </p>
            </div>
            <Badge variant="outline">{attending.length} confirmados</Badge>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Ultima respuesta</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Telefono</th>
                  <th className="px-4 py-3 font-medium">Asistencia</th>
                  <th className="px-4 py-3 font-medium">Preferencias</th>
                  <th className="px-4 py-3 font-medium">Restricciones</th>
                  <th className="px-4 py-3 font-medium">Intentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rsvps.length ? (
                  rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(rsvp.last_submitted_at || rsvp.updated_at || rsvp.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">{rsvp.name}</td>
                      <td className="px-4 py-3">{rsvp.email}</td>
                      <td className="px-4 py-3">{rsvp.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                            rsvp.attending
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          )}
                        >
                          {rsvp.attending ? "Asiste" : "No asiste"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {[
                          rsvp.vegetarian ? "Vegetariano" : null,
                          rsvp.pescatarian ? "Pescetariano" : null,
                          rsvp.vegan ? "Vegano" : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-muted-foreground">
                        {rsvp.diet || "-"}
                      </td>
                      <td className="px-4 py-3">{rsvp.submission_count || 1}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                      Aun no hay confirmaciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
