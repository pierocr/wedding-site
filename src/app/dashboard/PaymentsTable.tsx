"use client";

import * as React from "react";
import { Mail, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PaymentStatusInfo = {
  label: string;
  className: string;
};

export type DashboardPaymentRecord = {
  id: string;
  created_at: string | null;
  donor_name: string | null;
  donor_email: string | null;
  amount: number | null;
  external_reference: string | null;
  raffle_number: number | null;
  statusInfo: PaymentStatusInfo;
};

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

function normalizeSearchValue(value: string | number | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL");
}

export function PaymentsTable({
  payments,
}: {
  payments: DashboardPaymentRecord[];
}) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredPayments = React.useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery.trim());

    if (!normalizedQuery) return payments;

    return payments.filter((payment) =>
      [
        payment.donor_name,
        payment.donor_email,
        payment.external_reference,
        payment.raffle_number,
      ].some((value) => normalizeSearchValue(value).includes(normalizedQuery)),
    );
  }, [payments, searchQuery]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-3 sm:p-4">
        <label className="sr-only" htmlFor="payment-search">
          Buscar pagos
        </label>
        <div className="relative max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="payment-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nombre, correo o referencia"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {filteredPayments.length ? (
              filteredPayments.map((payment) => (
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
                        payment.statusInfo.className,
                      )}
                    >
                      {payment.statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {payment.external_reference || payment.raffle_number || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={6}
                >
                  {searchQuery.trim()
                    ? "No se encontraron pagos para esta búsqueda."
                    : "Aún no hay pagos registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
