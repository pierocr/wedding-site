import type { Metadata } from "next";
import InvitacionClient from "./InvitacionClient";

export const metadata: Metadata = {
  title: "Invitación | Debby & Piero",
  description: "Nos casamos — Debby & Piero, 21 de noviembre de 2026",
  alternates: {
    canonical: "/invitacion",
  },
  openGraph: {
    title: "Invitación | Debby & Piero",
    description: "Nos casamos — Debby & Piero, 21 de noviembre de 2026",
    url: "/invitacion",
    images: [
      {
        url: "/images/wedding/moon-photo.jpg",
        width: 1280,
        height: 960,
        alt: "Debby y Piero en la luna",
      },
    ],
  },
};

export default function InvitacionPage() {
  return <InvitacionClient />;
}
