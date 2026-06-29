"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DashboardRsvpRecord = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  last_submitted_at: string | null;
  name: string;
  email: string;
  phone: string | null;
  attending: boolean | null;
  attending_status: string | null;
  guests: number | null;
  vegetarian: boolean | null;
  pescatarian: boolean | null;
  vegan: boolean | null;
  diet: string | null;
  message: string | null;
  source: string | null;
  user_agent: string | null;
  ip_address: string | null;
  metadata: unknown;
  submission_count: number | null;
  companion_status: string | null;
  is_companion: boolean | null;
  companion_of_rsvp_id: string | null;
};

type RsvpGroup = {
  guest: DashboardRsvpRecord;
  companion: DashboardRsvpRecord | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

function attendingLabel(status: string | null | undefined) {
  if (status === "yes") return "Asiste";
  if (status === "no") return "No asiste";
  if (status === "later") return "Confirma más adelante";
  return status || "Sin estado";
}

function companionStatusLabel(status: string | null | undefined) {
  if (status === "yes") return "Con acompañante";
  if (status === "later") return "Acompañante pendiente";
  return "Sin acompañante";
}

function dietaryPreference(record: DashboardRsvpRecord | null | undefined) {
  if (!record) return "-";
  return (
    [
      record.vegetarian ? "Vegetariano" : null,
      record.pescatarian ? "Pescetariano" : null,
      record.vegan ? "Vegano" : null,
    ]
      .filter(Boolean)
      .join(", ") || "-"
  );
}

function attendanceClass(record: DashboardRsvpRecord) {
  if (record.attending_status === "later") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (record.attending) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function valueOrDash(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <dt className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value || "-"}
      </dd>
    </div>
  );
}

function PersonDetails({
  title,
  record,
}: {
  title: string;
  record: DashboardRsvpRecord;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold tracking-normal">{title}</h3>
        <p className="text-sm text-muted-foreground">{record.name}</p>
      </div>

      <dl className="grid gap-2 md:grid-cols-2">
        <DetailItem label="Nombre" value={record.name} />
        <DetailItem label="Email" value={record.email} />
        <DetailItem label="Teléfono" value={valueOrDash(record.phone)} />
        <DetailItem
          label="Asistencia"
          value={attendingLabel(record.attending_status)}
        />
        <DetailItem label="Preferencias" value={dietaryPreference(record)} />
        <DetailItem label="Restricciones" value={valueOrDash(record.diet)} />
        <DetailItem label="Intentos" value={record.submission_count || 1} />
        <DetailItem label="Fuente" value={valueOrDash(record.source)} />
        <DetailItem label="Creado" value={formatDate(record.created_at)} />
        <DetailItem label="Actualizado" value={formatDate(record.updated_at)} />
        <DetailItem
          label="Última respuesta"
          value={formatDate(record.last_submitted_at)}
        />
        <DetailItem label="IP" value={valueOrDash(record.ip_address)} />
      </dl>
    </section>
  );
}

function RsvpDetailsDialog({
  group,
  onOpenChange,
}: {
  group: RsvpGroup | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(group)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        {group ? (
          <>
            <DialogHeader>
              <DialogTitle>Detalle de confirmación</DialogTitle>
              <DialogDescription>
                Información completa registrada para {group.guest.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <PersonDetails title="Invitado principal" record={group.guest} />

              <section className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold tracking-normal">
                    Acompañante
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {companionStatusLabel(group.guest.companion_status)}
                  </p>
                </div>

                {group.companion ? (
                  <PersonDetails
                    title="Datos del acompañante"
                    record={group.companion}
                  />
                ) : (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    No hay datos de acompañante registrados para este invitado.
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold tracking-normal">
                  Mensaje para los novios
                </h3>
                <div className="min-h-24 whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm leading-6">
                  {group.guest.message || "Sin mensaje registrado."}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function RsvpTable({
  rsvps,
  allRsvps,
}: {
  rsvps: DashboardRsvpRecord[];
  allRsvps: DashboardRsvpRecord[];
}) {
  const [selected, setSelected] = React.useState<RsvpGroup | null>(null);

  const companionByGuestId = React.useMemo(() => {
    const map = new Map<string, DashboardRsvpRecord>();
    for (const rsvp of allRsvps) {
      if (rsvp.is_companion && rsvp.companion_of_rsvp_id) {
        map.set(rsvp.companion_of_rsvp_id, rsvp);
      }
    }
    return map;
  }, [allRsvps]);

  const groups = React.useMemo(
    () =>
      rsvps.map((guest) => ({
        guest,
        companion: companionByGuestId.get(guest.id) || null,
      })),
    [companionByGuestId, rsvps],
  );

  const openGroup = (group: RsvpGroup) => setSelected(group);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Última respuesta</th>
              <th className="px-4 py-3 font-medium">Invitado</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Asistencia</th>
              <th className="px-4 py-3 font-medium">Acompañante</th>
              <th className="px-4 py-3 font-medium">Preferencias</th>
              <th className="px-4 py-3 font-medium">Mensaje</th>
              <th className="px-4 py-3 font-medium">Intentos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.length ? (
              groups.map((group) => (
                <tr
                  key={group.guest.id}
                  className="cursor-pointer align-top transition hover:bg-muted/45 focus:bg-muted/45 focus:outline-none"
                  role="button"
                  tabIndex={0}
                  onClick={() => openGroup(group)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openGroup(group);
                    }
                  }}
                  aria-label={`Ver detalle de ${group.guest.name}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(
                      group.guest.last_submitted_at ||
                        group.guest.updated_at ||
                        group.guest.created_at,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{group.guest.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {group.guest.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{group.guest.phone || "-"}</div>
                    <div className="mt-1 text-xs">
                      {group.guest.source || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                        attendanceClass(group.guest),
                      )}
                    >
                      {attendingLabel(group.guest.attending_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {group.companion ? (
                      <div>
                        <div className="font-medium">
                          {group.companion.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {group.companion.email}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {group.companion.phone || "-"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {companionStatusLabel(group.guest.companion_status)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>Invitado: {dietaryPreference(group.guest)}</div>
                    {group.guest.diet ? (
                      <div className="mt-1 max-w-[240px] text-xs">
                        {group.guest.diet}
                      </div>
                    ) : null}
                    {group.companion ? (
                      <div className="mt-2 border-t border-border pt-2">
                        <div>
                          Acompañante: {dietaryPreference(group.companion)}
                        </div>
                        {group.companion.diet ? (
                          <div className="mt-1 max-w-[240px] text-xs">
                            {group.companion.diet}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                    {group.guest.message ? (
                      <span className="line-clamp-2">
                        {group.guest.message}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {group.guest.submission_count || 1}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={8}
                >
                  Aún no hay confirmaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RsvpDetailsDialog
        group={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
