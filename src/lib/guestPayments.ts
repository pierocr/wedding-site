export type PaymentGuest = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  companion_name: string | null;
  email: string | null;
};

type Payment = { donor_name: string | null; donor_email: string | null; status: string | null };
export type GuestPaymentRow = {
  id: string;
  name: string;
  companion: string | null;
  status: "paid" | "pending" | "review" | "unmatched";
  evidence: string;
  dismissal?: "paid" | "other";
};

export type GuestPaymentDismissal = { guest_id: string; guest_name: string; reason: "paid" | "other" };

export function applyPaymentDismissals(rows: GuestPaymentRow[], dismissals: GuestPaymentDismissal[]) {
  const byGuest = new Map(dismissals.map((dismissal) => [dismissal.guest_id, dismissal]));
  return rows.map((row) => {
    const dismissal = byGuest.get(row.id);
    return dismissal?.guest_name === row.name ? { ...row, dismissal: dismissal.reason } : row;
  });
}

function normalize(value: string | null) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9@.]+/g, " ").trim();
}

function fullNameMatches(name: string | null, donor: string | null) {
  const parts = normalize(name).split(/\s+/).filter(Boolean);
  const donorParts = normalize(donor).split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((part) => donorParts.includes(part));
}

export function reconcileGuestPayments(guests: PaymentGuest[], payments: Payment[]): GuestPaymentRow[] {
  const candidates = payments.map((payment) => ({
    payment,
    guests: guests.filter((guest) => {
      const email = normalize(guest.email);
      return (email && email === normalize(payment.donor_email)) ||
        (!!guest.first_name && !!guest.last_name && fullNameMatches(`${guest.first_name} ${guest.last_name}`, payment.donor_name)) ||
        fullNameMatches(guest.companion_name, payment.donor_name);
    }),
  }));

  return guests.map((guest): GuestPaymentRow => {
    const matches = candidates.filter((candidate) => candidate.guests.some((g) => g.id === guest.id));
    const uniquePaid = matches.filter(({ payment, guests: matched }) => payment.status === "paid" && matched.length === 1);
    const ambiguous = matches.filter(({ guests: matched }) => matched.length > 1);
    const pending = matches.filter(({ payment, guests: matched }) => payment.status === "pending" && matched.length === 1);
    const selected = uniquePaid.length ? uniquePaid : ambiguous.length ? ambiguous : pending;
    const status = uniquePaid.length ? "paid" : ambiguous.length ? "review" : pending.length ? "pending" : "unmatched";
    const names = [...new Set(selected.map(({ payment }) => payment.donor_name || payment.donor_email || "Sin nombre"))];
    return {
      id: guest.id,
      name: [guest.first_name, guest.last_name].filter(Boolean).join(" "),
      companion: guest.companion_name,
      status,
      evidence: names.length ? names.join(", ") : "Sin coincidencia automática",
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "es"));
}
