// Flow export supplied on 4 November 2026 identifies these transactions as tests.
const TEST_ORDERS = new Set([
  "157731872", "157734694", "157744164", "157745428",
  "157757146", "157807454", "171640572", "179212717",
]);
const TEST_REFERENCES = new Set([
  "GIFT_20260122_729F8A37", "GIFT_20260122_2F821B70",
  "GIFT_20260122_E66496C5", "GIFT_20260122_0959FCEB",
  "GIFT_20260123_8BE6B507", "GIFT_20260123_A09632FE",
  "GIFT_20260607_58FEF476", "GIFT_20260824_9730A8DD",
]);
const TEST_EMAILS = new Set(["pierocr@gmail.com", "pierocespedesromanini@gmail.com"]);

export function isTestPayment(payment: {
  donor_name?: string | null;
  donor_email?: string | null;
  external_reference?: string | null;
  meta?: Record<string, any> | null;
}) {
  const name = (payment.donor_name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const email = (payment.donor_email || "").trim().toLowerCase();
  const payer = String(payment.meta?.flow_status_response?.payer || "").trim().toLowerCase();
  const order = String(payment.meta?.flow_order ?? payment.meta?.flow_status_response?.flowOrder ?? "");
  const reference = (payment.external_reference || "").trim().toUpperCase();
  return /\bpiero\b/i.test(name) || TEST_EMAILS.has(email) || TEST_EMAILS.has(payer) || TEST_ORDERS.has(order) || TEST_REFERENCES.has(reference);
}
