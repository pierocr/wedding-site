"use client";

import { useActionState, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ManualEvent, PendingGuest } from "@/lib/pendingGuests";
import { manualConfirmationAction, type GuestSyncState } from "./actions";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL");
}

function ManualButton({ id, name, scope, confirmed }: { id: string; name: string; scope: "guest" | "companion"; confirmed: boolean }) {
  const initialState: GuestSyncState = { status: "idle", message: "" };
  const [state, action, pending] = useActionState(manualConfirmationAction, initialState);
  return <form action={action} className="space-y-1">
    <input type="hidden" name="guestId" value={id} />
    <input type="hidden" name="name" value={name} />
    <input type="hidden" name="scope" value={scope} />
    <input type="hidden" name="confirmed" value={String(confirmed)} />
    <Button type="submit" size="sm" variant="outline" disabled={pending} aria-label={`${confirmed ? "Confirmar" : "Deshacer confirmación de"} ${scope === "companion" ? `acompañante de ${name}` : name}`}>
      {pending ? "Guardando…" : confirmed ? (scope === "companion" ? "Confirmar acompañante" : "Confirmar invitado") : "Deshacer"}
    </Button>
    {state.status === "error" && <p role="alert" className="text-xs text-red-700">{state.message}</p>}
  </form>;
}

export function PendingGuestsTable({ guests, hasDirectory, manualAvailable, manualConfirmations }: { guests: PendingGuest[]; hasDirectory: boolean; manualAvailable: boolean; manualConfirmations: ManualEvent[] }) {
  const [search, setSearch] = useState("");
  const query = normalize(search.trim());
  const filtered = guests.filter((guest) =>
    [guest.name, guest.companion || ""].some((value) => normalize(value).includes(query)),
  );

  return (<div className="space-y-4">
    {!manualAvailable && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Las confirmaciones manuales estarán disponibles después de actualizar la base de datos.</p>}
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-3 sm:p-4">
        <label className="sr-only" htmlFor="pending-guest-search">Buscar personas por confirmar</label>
        <div className="relative max-w-md">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="pending-guest-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por invitado o acompañante" className="pl-9" />
        </div>
      </div>
      {!hasDirectory ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sincroniza la lista de invitados para ver los pendientes.</p>
      ) : filtered.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr><th scope="col" className="px-4 py-3 font-medium">Invitado</th><th scope="col" className="px-4 py-3 font-medium">Acompañante en planilla</th><th scope="col" className="px-4 py-3 font-medium">Estado</th><th scope="col" className="px-4 py-3 font-medium">Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((guest) => <tr key={guest.id}><td className="px-4 py-3 font-medium">{guest.name}</td><td className="px-4 py-3">{guest.companion || "—"}</td><td className="px-4 py-3 text-muted-foreground">{guest.reason}</td><td className="px-4 py-3">{manualAvailable && <ManualButton id={guest.id} name={guest.name} scope={guest.reason === "Acompañante por confirmar" ? "companion" : "guest"} confirmed />}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">{query ? "No se encontraron invitados para esta búsqueda." : "No hay registros pendientes de revisión."}</p>}
    </div>
    {manualConfirmations.length > 0 && <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">Confirmaciones manuales</h3>
      <p className="mt-1 text-sm text-muted-foreground">Registradas en el dashboard; no modifican el RSVP ni el Excel.</p>
      <ul className="mt-3 divide-y divide-border">
        {manualConfirmations.map((event) => <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{event.guest_name}{event.scope === "companion" ? " — acompañante" : " — invitado"}</p><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date(event.created_at))}</p></div><ManualButton id={event.guest_id} name={event.guest_name} scope={event.scope} confirmed={false} /></li>)}
      </ul>
    </div>}
    </div>
  );
}
