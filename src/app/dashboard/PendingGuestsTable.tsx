"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PendingGuest } from "@/lib/pendingGuests";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL");
}

export function PendingGuestsTable({ guests, hasDirectory }: { guests: PendingGuest[]; hasDirectory: boolean }) {
  const [search, setSearch] = useState("");
  const query = normalize(search.trim());
  const filtered = guests.filter((guest) =>
    [guest.name, guest.companion || ""].some((value) => normalize(value).includes(query)),
  );

  return (
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
              <tr><th scope="col" className="px-4 py-3 font-medium">Invitado</th><th scope="col" className="px-4 py-3 font-medium">Acompañante en planilla</th><th scope="col" className="px-4 py-3 font-medium">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((guest) => <tr key={guest.id}><td className="px-4 py-3 font-medium">{guest.name}</td><td className="px-4 py-3">{guest.companion || "—"}</td><td className="px-4 py-3 text-muted-foreground">{guest.reason}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">{query ? "No se encontraron invitados para esta búsqueda." : "No hay registros pendientes de revisión."}</p>}
    </div>
  );
}
