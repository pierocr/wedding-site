export type DirectoryGuest = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  companion_name: string | null;
  attendance_status: string | null;
  party_size: number | null;
};

type Rsvp = {
  name: string;
  attending: boolean | null;
  attending_status: string | null;
  companion_status: string | null;
};

export type PendingGuest = {
  id: string;
  name: string;
  companion: string | null;
  reason: string;
};

function words(value: string | null) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

// Require both the directory's first name and surname; short or ambiguous
// matches remain visible for review instead of silently hiding a guest.
function matches(guest: DirectoryGuest, rsvp: Rsvp) {
  const first = words(guest.first_name);
  const last = words(guest.last_name);
  const name = words(rsvp.name);
  return first.length > 0 && last.length > 0 &&
    first.every((part) => name.includes(part)) && last.every((part) => name.includes(part));
}

export function getPendingGuests(guests: DirectoryGuest[], rsvps: Rsvp[]): PendingGuest[] {
  const pending: PendingGuest[] = [];
  for (const guest of guests) {
    const name = [guest.first_name, guest.last_name].filter(Boolean).join(" ");
    const candidates = rsvps.filter((rsvp) => matches(guest, rsvp));
    const companion = guest.companion_name && !/^sin acompa[ñn]ante$/i.test(guest.companion_name.trim())
      ? guest.companion_name : null;
    if (candidates.length > 1 || (candidates.length === 1 && guests.filter((entry) => matches(entry, candidates[0])).length > 1)) {
      pending.push({ id: guest.id, name, companion, reason: "Varias coincidencias en RSVP; revisar" });
      continue;
    }
    const response = candidates[0];
    if (response) {
      const status = response.attending_status || (response.attending ? "yes" : "no");
      if (status === "later") {
        pending.push({ id: guest.id, name, companion, reason: "Confirmará más adelante" });
      } else if (status === "yes" && response.companion_status === "later") {
        pending.push({ id: guest.id, name, companion, reason: "Acompañante por confirmar" });
      }
      continue;
    }
    const sheetStatus = words(guest.attendance_status).join(" ");
    if (["confirmado", "confirmada", "ok", "no asiste"].includes(sheetStatus)) continue;
    pending.push({ id: guest.id, name, companion, reason: "Sin coincidencia en RSVP; revisar" });
  }
  return pending.sort((a, b) => a.name.localeCompare(b.name, "es"));
}
