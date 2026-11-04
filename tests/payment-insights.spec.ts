import { expect, test } from "@playwright/test";
import { directTransferInsights, paymentInsights } from "../src/lib/paymentInsights";
import { isTestPayment } from "../src/lib/testPayments";

test("uses Flow payment and settlement details without estimating the rate", () => {
  expect(paymentInsights({ paymentData: { media: "Webpay", installments: 1, fee: 4127, balance: 115873 } }, {
    rate: 2.89, commission: 3468, taxes: 659, balance: 115873,
  })).toEqual({ media: "Webpay", installments: 1, fee: 3468, taxes: 659, balance: 115873, rate: 2.89, settled: true });
});

test("identifies Piero's tests by name, payer email, or exported order without matching other names", () => {
  expect(isTestPayment({ donor_name: "Piero Céspedes" })).toBe(true);
  expect(isTestPayment({ donor_email: " PIEROCR@GMAIL.COM " })).toBe(true);
  expect(isTestPayment({ meta: { flow_order: 157744164 } })).toBe(true);
  expect(isTestPayment({ external_reference: "GIFT_20260824_9730A8DD" })).toBe(true);
  expect(isTestPayment({ donor_name: "Pierola", donor_email: "guest@example.com" })).toBe(false);
});

test("keeps missing values unknown and preserves a zero fee", () => {
  expect(paymentInsights({ paymentData: { fee: 0, installments: null, balance: null } })).toEqual({
    media: null, installments: null, fee: 0, taxes: null, balance: null, rate: null, settled: false,
  });
});

test("counts the confirmed direct transfer in full without a Flow rate", () => {
  const transfer = { id: "1db3051c-79ca-4241-a6a4-8a3bfe029684", amount: 200000, currency: "CLP" };
  expect(directTransferInsights(transfer)).toMatchObject({ media: "Transferencia directa", fee: 0, taxes: 0, balance: 200000, rate: null });
  expect(directTransferInsights({ ...transfer, id: "another-payment" })).toBeNull();
  expect(directTransferInsights({ ...transfer, amount: 40000 })).toBeNull();
});
