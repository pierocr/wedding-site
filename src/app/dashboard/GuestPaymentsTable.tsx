"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GuestPaymentRow } from "@/lib/guestPayments";
import { setPaymentDismissal } from "./actions";

const labels = { paid: "Pago encontrado", pending: "Intento pendiente", review: "Coincidencia ambigua", unmatched: "Sin pago encontrado" };

export function GuestPaymentsTable({ initialRows }: { initialRows: GuestPaymentRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("unpaid");
  const [error, setError] = useState("");
  const [manualAvailable, setManualAvailable] = useState(false);
  const [saving, startTransition] = useTransition();
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/dashboard/cruce-pagos", { cache: "no-store", signal: signal ?? null });
      if (!response.ok) throw new Error("Error de actualización");
      const data = await response.json();
      setRows(data.rows);
      setManualAvailable(data.manualAvailable);
      setError("");
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) setError("No se pudo actualizar el listado. Se intentará nuevamente; los datos mostrados pueden estar desactualizados.");
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const update = () => { if (document.visibilityState === "visible") void refresh(controller.signal); };
    const timer = window.setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [refresh]);
  function changeDismissal(row: GuestPaymentRow, reason: "paid" | "other" | "restore") {
    startTransition(async () => {
      const result = await setPaymentDismissal(row.id, row.name, reason);
      if (result.status === "error") { setError(result.message); return; }
      await refresh();
    });
  }
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const shown = rows.filter((row) => {
    const inFilter = filter === "dismissed" ? !!row.dismissal : !row.dismissal && (filter === "all" || (filter === "unpaid" ? row.status !== "paid" : row.status === filter));
    return inFilter && normalized(`${row.name} ${row.companion || ""} ${row.evidence}`).includes(normalized(search.trim()));
  });
  return <div className="rounded-lg border border-border bg-card">
    <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
      <div className="min-w-52 flex-1"><label htmlFor="guest-payment-search" className="mb-1 block text-sm font-medium">Buscar invitado</label><Input id="guest-payment-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o acompañante" /></div>
      <div><label htmlFor="guest-payment-filter" className="mb-1 block text-sm font-medium">Estado</label><select id="guest-payment-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="unpaid">Pendientes de revisar</option><option value="all">Todos los activos</option><option value="paid">Pago encontrado</option><option value="pending">Intento pendiente</option><option value="review">Coincidencia ambigua</option><option value="unmatched">Sin pago encontrado</option><option value="dismissed">Descartados manualmente</option></select></div>
      <p className="text-sm text-muted-foreground">{shown.length} registros</p>
    </div>
    {!manualAvailable && <p className="px-4 pt-3 text-sm text-muted-foreground">El descarte manual requiere actualizar la base de datos o terminar de cargar el listado.</p>}
    {error && <p role="alert" className="px-4 pt-3 text-sm text-red-700">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Invitado</th><th className="px-4 py-3">Acompañante</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Coincidencia</th><th className="px-4 py-3">Acción</th></tr></thead><tbody className="divide-y divide-border">{shown.map((row) => <tr key={row.id}><td className="px-4 py-3 font-medium">{row.name}</td><td className="px-4 py-3">{row.companion || "—"}</td><td className="px-4 py-3">{row.dismissal ? (row.dismissal === "paid" ? "Ya pagó (manual)" : "Descartado (manual)") : labels[row.status]}</td><td className="px-4 py-3 text-muted-foreground">{row.evidence}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">{row.dismissal ? <Button size="sm" variant="outline" disabled={!manualAvailable || saving} onClick={() => changeDismissal(row, "restore")} aria-label={`Restaurar ${row.name}`}>Restaurar</Button> : <><Button size="sm" variant="outline" disabled={!manualAvailable || saving} onClick={() => changeDismissal(row, "paid")} aria-label={`Marcar que ${row.name} ya pagó`}>Ya pagó</Button><Button size="sm" variant="outline" disabled={!manualAvailable || saving} onClick={() => changeDismissal(row, "other")} aria-label={`Descartar ${row.name}`}>Descartar</Button></>}</div></td></tr>)}</tbody></table></div>
    {!shown.length && <p className="p-6 text-center text-sm text-muted-foreground">No hay registros para este filtro.</p>}
  </div>;
}
