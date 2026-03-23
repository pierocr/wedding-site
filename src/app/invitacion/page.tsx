import type { Metadata } from "next";
import InvitationExperience from "./InvitationExperience";
import { SITE_NAME, SITE_URL, BRIDE, GROOM, CEREMONY } from "@/data/site";

const invitationTitle = `${GROOM} & ${BRIDE} | Invitacion`;
const invitationDescription =
  "Te invitamos a celebrar nuestra boda. Revisa la fecha, lugares, agenda, historia y confirma tu asistencia desde tu celular.";
const invitationUrl = `${SITE_URL}/invitacion`;

export const metadata: Metadata = {
  title: invitationTitle,
  description: invitationDescription,
  alternates: {
    canonical: "/invitacion",
    languages: {
      "es-CL": "/invitacion",
    },
  },
  openGraph: {
    title: invitationTitle,
    description: invitationDescription,
    url: invitationUrl,
    siteName: SITE_NAME,
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${GROOM} y ${BRIDE} - Invitacion de matrimonio`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: invitationTitle,
    description: invitationDescription,
    images: ["/og.jpg"],
  },
  keywords: [
    "invitacion matrimonio",
    "boda chile",
    "invitacion digital",
    "Piero y Debby",
    CEREMONY.locality,
  ],
};

export default function InvitationPage() {
  return <InvitationExperience />;
}
