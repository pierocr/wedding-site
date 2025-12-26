// src/data/site.ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pieroydebby.cl";
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Piero & Debby";
export const SITE_TITLE = `${SITE_NAME} — ¡Nos casamos!`;
export const SITE_DESCRIPTION =
  "Acompáñanos en nuestro gran día. Revisa fecha, ubicación, dress code y confirma tu asistencia (RSVP).";

export const BRIDE = "Debby";
export const GROOM = "Piero";

export const WEDDING_DATE_ISO = process.env.NEXT_PUBLIC_EVENT_DATE ?? "2026-11-21";
export const EVENT_TIMEZONE = "America/Santiago";
export const EVENT_TIME_OFFSET = "-03:00";

export const CEREMONY = {
  datePretty: "Sábado 21 de noviembre de 2026",
  timePretty: "16:30 hrs",
  timeIso: "16:30:00",
  venue: "Iglesia Santa Ursula de Vitacura",
  venueAddress: "Vitacura, Chile",
  locality: "Vitacura",
  region: "Region Metropolitana de Santiago",
  country: "CL",
  mapsUrl: "https://maps.app.goo.gl/Hsxztok7HaTwegmm7",
};

export const RECEPTION = {
  startTime: "18:30 hrs",
  startTimeIso: "18:30:00",
  venue: "Casona Santa Luz de Chicureo",
  venueAddress: "Chicureo, Santiago",
  locality: "Chicureo",
  region: "Region Metropolitana de Santiago",
  country: "CL",
  mapsUrl: "https://maps.app.goo.gl/7u4oLZkD91fxuqdc7",
};

export const BANK_TRANSFER = {
  titular: "PIERO ALONSO CÉSPEDES",
  rut: "16.292.075-8",
  banco: "BCI",
  tipo: "Cuenta Corriente",
  numero: "32730098",
  email: "piero@gmail.com",
};

// Feature Flags - importadas desde archivo de configuración
import { FEATURE_FLAGS as FLAGS } from "@/config/featureFlags";
export { FEATURE_FLAGS } from "@/config/featureFlags";

// Christmas Promotion Configuration
export const CHRISTMAS_PROMO = {
  enabled: FLAGS.christmasPromoEnabled,
  endDate: "2025-12-31T23:59:59-03:00",
  discounts: {
    plata: 20,
    oro: 40,
    diamante: 40,
  },
  eligiblePlans: ["plata", "oro", "diamante"], // IDs de planes con descuento
} as const;

// Helper function to check if promo is active
export const isChristmasPromoActive = () => {
  if (!CHRISTMAS_PROMO.enabled) return false;
  const now = new Date();
  const endDate = new Date(CHRISTMAS_PROMO.endDate);
  return now <= endDate;
};
