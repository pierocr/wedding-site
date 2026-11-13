import { test, expect } from "@playwright/test";
import { applyPaymentDismissals, reconcileGuestPayments, type PaymentGuest } from "../src/lib/guestPayments";

const guest = (id: string, first_name: string, last_name: string, companion_name: string | null = null, email: string | null = null): PaymentGuest => ({ id, first_name, last_name, companion_name, email });
const payment = (donor_name: string, status: string, donor_email: string | null = null) => ({ donor_name, status, donor_email });

test("matches names and companions, and prefers a paid attempt", () => {
  const rows = reconcileGuestPayments([guest("1", "Paula", "Caro"), guest("2", "Catalina", "Gutiérrez", "Miguel Avendaño")], [payment("Paula Caro", "pending"), payment("Paula Caro", "paid"), payment("Miguel Avendano Echeverria", "paid")]);
  expect(rows.find((row) => row.id === "1")?.status).toBe("paid");
  expect(rows.find((row) => row.id === "2")?.status).toBe("paid");
});

test("does not assign ambiguous names or short companion names automatically", () => {
  const rows = reconcileGuestPayments([guest("1", "Santiago", "Gutiérrez"), guest("2", "Santiago", "Gutiérrez Cariceo"), guest("3", "Marco", "Reveco", "Pia")], [payment("Santiago Gutierrez Cariceo", "paid"), payment("Pia", "paid")]);
  expect(rows.find((row) => row.id === "1")?.status).toBe("review");
  expect(rows.find((row) => row.id === "2")?.status).toBe("review");
  expect(rows.find((row) => row.id === "3")?.status).toBe("unmatched");
});

test("uses email, separates pending attempts, and leaves unknown payments unmatched", () => {
  const rows = reconcileGuestPayments([guest("1", "Ana", "Pérez", null, "ANA@example.com"), guest("2", "Mario", "López"), guest("3", "Luz", "Rojas")], [payment("Otro nombre", "paid", "ana@example.com"), payment("Mario Lopez", "pending")]);
  expect(rows.find((row) => row.id === "1")?.status).toBe("paid");
  expect(rows.find((row) => row.id === "2")?.status).toBe("pending");
  expect(rows.find((row) => row.id === "3")?.status).toBe("unmatched");
});

test("dismissals remain tied to the same guest name", () => {
  const rows = reconcileGuestPayments([guest("1", "Ana", "Pérez"), guest("2", "Luz", "Rojas")], []);
  const result = applyPaymentDismissals(rows, [{ guest_id: "1", guest_name: "Ana Pérez", reason: "paid" }, { guest_id: "2", guest_name: "Otro nombre", reason: "other" }]);
  expect(result.find((row) => row.id === "1")?.dismissal).toBe("paid");
  expect(result.find((row) => row.id === "2")?.dismissal).toBeUndefined();
});
