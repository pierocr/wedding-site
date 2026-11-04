export type PaymentInsights = {
  media: string | null;
  installments: number | null;
  fee: number | null;
  taxes: number | null;
  balance: number | null;
  rate: number | null;
  settled: boolean;
};

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function paymentInsights(raw: Record<string, any> | null | undefined, settlement?: Record<string, any>): PaymentInsights {
  const data = raw?.paymentData || {};
  return {
    media: typeof data.media === "string" ? data.media : null,
    installments: numeric(data.installments),
    fee: numeric(settlement?.commission) ?? numeric(data.fee),
    taxes: numeric(settlement?.taxes) ?? numeric(data.taxes),
    balance: numeric(settlement?.balance) ?? numeric(data.balance),
    rate: numeric(settlement?.rate),
    settled: Boolean(settlement),
  };
}

// This specific gift was confirmed by the couple as a direct bank transfer.
export function directTransferInsights(payment: { id: string; amount: number | null; currency: string | null }): PaymentInsights | null {
  if (payment.id !== "1db3051c-79ca-4241-a6a4-8a3bfe029684" || Number(payment.amount) !== 200000 || payment.currency !== "CLP") return null;
  return { media: "Transferencia directa", installments: null, fee: 0, taxes: 0, balance: 200000, rate: null, settled: false };
}
