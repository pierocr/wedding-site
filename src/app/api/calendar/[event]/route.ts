import { NextResponse } from "next/server";
import {
  CEREMONY,
  EVENT_TIMEZONE,
  RECEPTION,
  WEDDING_DATE_ISO,
} from "@/data/site";

const escapeIcs = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");

const toIcsDate = (time: string) =>
  `${WEDDING_DATE_ISO.replaceAll("-", "")}T${time.replaceAll(":", "")}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ event: string }> },
) {
  const { event } = await params;

  if (event !== "ceremony" && event !== "reception") {
    return new NextResponse("Evento no encontrado", { status: 404 });
  }

  const details =
    event === "ceremony"
      ? {
          title: "Ceremonia — Piero & Debby",
          start: CEREMONY.timeIso,
          end: CEREMONY.endTimeIso,
          venue: CEREMONY.venue,
          address: CEREMONY.venueAddress,
        }
      : {
          title: "Recepción — Piero & Debby",
          start: RECEPTION.startTimeIso,
          end: RECEPTION.endTimeIso,
          venue: RECEPTION.venue,
          address: RECEPTION.venueAddress,
        };

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Piero & Debby//Boda 2026//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:piero-debby-${event}-20261121@pieroydebby.cl`,
    `DTSTAMP:${new Date().toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=${EVENT_TIMEZONE}:${toIcsDate(details.start)}`,
    `DTEND;TZID=${EVENT_TIMEZONE}:${toIcsDate(details.end)}`,
    `SUMMARY:${escapeIcs(details.title)}`,
    `LOCATION:${escapeIcs(`${details.venue}, ${details.address}`)}`,
    "DESCRIPTION:Acompáñanos a celebrar la boda de Piero & Debby.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"piero-y-debby-${event}.ics\"`,
    },
  });
}
