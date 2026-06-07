// src/config/payment.ts
// Cambia este valor para alternar Flow entre sandbox y produccion.
// Las credenciales siguen viviendo en variables de entorno.

export type FlowPaymentEnvironment = "production" | "sandbox";

export const PAYMENT_CONFIG = {
  flowEnvironment: "sandbox" as FlowPaymentEnvironment,
} as const;
