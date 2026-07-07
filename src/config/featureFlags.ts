// src/config/featureFlags.ts
// Configuración de Feature Flags
// Este archivo se puede modificar directamente y subir al repo sin riesgo

export const FEATURE_FLAGS = {
  // RSVP - cambiar a true cuando se entreguen invitaciones
  rsvpEnabled: true,

  // Christmas Promotion - activa hasta 31 de diciembre
  christmasPromoEnabled: false,

  // Event Details - cambiar a true para revelar fecha, lugares y horarios
  eventDetailsVisible: true,

  // Gift payments - cambiar a true para volver a activar el flujo Flow/WebPay
  flowGiftPaymentsEnabled: true,
} as const;
