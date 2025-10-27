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
} from "@/data/site";

const toAbsoluteUrl = (path: string) => {
  try {
    return new URL(path, SITE_URL).toString();
  } catch {
    return path;
  }
};

const HERO_IMAGES = ["/og.jpg", "/hero/1.jpg", "/hero/iglesia.png"];

export default function SeoWeddingEvent() {
  const startDate = `${WEDDING_DATE_ISO}T${CEREMONY.timeIso ?? "16:30:00"}${EVENT_TIME_OFFSET}`;
  const receptionStart = `${WEDDING_DATE_ISO}T${RECEPTION.startTimeIso ?? "18:30:00"}${EVENT_TIME_OFFSET}`;
  const endDate = `${WEDDING_DATE_ISO}T23:59:00${EVENT_TIME_OFFSET}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WeddingEvent",
    "@id": `${SITE_URL}/#wedding`,
    name: `${BRIDE} & ${GROOM} — Boda`,
    description: SITE_DESCRIPTION,
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "es-CL",
    isAccessibleForFree: true,
    url: `${SITE_URL}/`,
    image: HERO_IMAGES.map(toAbsoluteUrl),
    organizer: [
      { "@type": "Person", name: BRIDE },
      { "@type": "Person", name: GROOM },
    ],
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
    performer: [
      { "@type": "Person", name: BRIDE },
      { "@type": "Person", name: GROOM },
    ],
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
