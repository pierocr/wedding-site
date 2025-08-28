// src/app/layout.tsx
import type { Metadata } from "next";
import "@/app/globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

// Puedes definir estos envs en Cloudflare Pages (Project → Settings → Environment variables)
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pieroydebby.cl";
const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || "Piero & Debby";
const SITE_TITLE = `${SITE_NAME} — ¡Nos casamos!`;
const SITE_DESC =
  "Acompáñanos en nuestro gran día. Revisa fecha, ubicación, dress code y confirma tu asistencia (RSVP).";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
    siteName: SITE_NAME,
    images: [
      {
        url: "/og.jpg", // 1200x630
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Invitación`,
      },
    ],
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/og.jpg"],
  },
  alternates: {
    canonical: "/",
    languages: { "es-CL": "/" },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={cn(
          "min-h-screen bg-background text-foreground antialiased",
          inter.variable,
          playfair.variable,
          "font-sans"
        )}
      >
        {children}
      </body>
    </html>
  );
}