// src/components/seo/SeoWeddingEvent.tsx
import {
  BRIDE,
  GROOM,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  WEDDING_DATE_ISO,
  EVENT_TIMEZONE,
  EVENT_TIME_OFFSET,
  CEREMONY,
  RECEPTION,
  FEATURE_FLAGS,
} from "@/data/site";

const toAbsoluteUrl = (path: string) => {
  try {
    return new URL(path, SITE_URL).toString();
  } catch {
    return path;
  }
};

const HERO_IMAGES = ["/og.jpg", "/hero/1.jpg", "/hero/iglesia.png"];
const EVENT_URL = `${SITE_URL}/`;
const ORGANIZERS = [
  { "@type": "Person", name: BRIDE, url: EVENT_URL },
  { "@type": "Person", name: GROOM, url: EVENT_URL },
];
const FREE_EVENT_OFFER = {
  "@type": "Offer",
  url: EVENT_URL,
  price: 0,
  priceCurrency: "CLP",
  availability: "https://schema.org/InStock",
  validFrom: `${WEDDING_DATE_ISO}T00:00:00${EVENT_TIME_OFFSET}`,
};

export default function SeoWeddingEvent() {
  // Si eventDetailsVisible es false, retornar schema genérico
  if (!FEATURE_FLAGS.eventDetailsVisible) {
    const jsonLdGeneric = {
      "@context": "https://schema.org",
      "@type": "Event",
      additionalType: "https://schema.org/WeddingEvent",
      "@id": `${SITE_URL}/#wedding`,
      name: `${BRIDE} & ${GROOM} — Boda`,
      description: "Celebración de boda. Detalles próximamente.",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      inLanguage: "es-CL",
      url: EVENT_URL,
      image: HERO_IMAGES.map(toAbsoluteUrl),
      organizer: ORGANIZERS,
      performer: ORGANIZERS,
      offers: FREE_EVENT_OFFER,
      about: [
        { "@type": "Person", name: BRIDE },
        { "@type": "Person", name: GROOM },
      ],
    };

    const cleaned = JSON.parse(JSON.stringify(jsonLdGeneric));
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }} />;
  }

  // Schema completo cuando eventDetailsVisible es true
  const startDate = `${WEDDING_DATE_ISO}T${CEREMONY.timeIso ?? "16:30:00"}${EVENT_TIME_OFFSET}`;
  const receptionStart = `${WEDDING_DATE_ISO}T${RECEPTION.startTimeIso ?? "18:30:00"}${EVENT_TIME_OFFSET}`;
  const endDate = `${WEDDING_DATE_ISO}T23:59:00${EVENT_TIME_OFFSET}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    additionalType: "https://schema.org/WeddingEvent",
    "@id": `${SITE_URL}/#wedding`,
    name: `${BRIDE} & ${GROOM} — Boda`,
    description: SITE_DESCRIPTION,
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "es-CL",
    isAccessibleForFree: true,
    url: EVENT_URL,
    image: HERO_IMAGES.map(toAbsoluteUrl),
    organizer: ORGANIZERS,
    offers: FREE_EVENT_OFFER,
    about: [
      { "@type": "Person", name: BRIDE },
      { "@type": "Person", name: GROOM },
    ],
    location: {
      "@type": "Place",
      name: CEREMONY.venue,
      sameAs: CEREMONY.mapsUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: CEREMONY.venueAddress,
        addressLocality: CEREMONY.locality,
        addressRegion: CEREMONY.region,
        addressCountry: "CL",
      },
    },
    subEvent: [
      {
        "@type": "Event",
        name: "Recepción",
        startDate: receptionStart,
        endDate,
        location: {
          "@type": "Place",
          name: RECEPTION.venue,
          sameAs: RECEPTION.mapsUrl,
          address: {
            "@type": "PostalAddress",
            streetAddress: RECEPTION.venueAddress,
            addressLocality: RECEPTION.locality,
            addressRegion: RECEPTION.region,
            addressCountry: "CL",
          },
        },
      },
    ],
    performer: ORGANIZERS,
    eventSchedule: {
      "@type": "Schedule",
      startDate,
      endDate,
      scheduleTimezone: EVENT_TIMEZONE,
    },
    sameAs: [SITE_URL],
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  // Remove undefined values before serialising
  const cleaned = JSON.parse(JSON.stringify(jsonLd));

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }} />;
}
