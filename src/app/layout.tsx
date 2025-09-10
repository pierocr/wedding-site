// src/app/layout.tsx
import type { Metadata } from "next";
import "@/app/globals.css";
import { fontSans, fontSerif, fontScript } from "./fonts";
import SeoWebsite from '@/components/seo/SeoWebsite'

/**
 * Puedes definir estas variables en tu hosting (p. ej. Cloudflare Pages → Project → Settings → Environment variables)
 * NEXT_PUBLIC_SITE_URL y NEXT_PUBLIC_SITE_NAME
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pieroydebby.cl";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Piero & Debby";
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
  alternates: {
    canonical: "/",
    languages: { "es-CL": "/" },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
    siteName: SITE_NAME,
    locale: "es_CL",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Invitación`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/og.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],

  // 👇 NUEVO: deja explícito index/follow y límites generosos para rich snippets
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={[
          // Variables de fuente (desde src/app/fonts.ts)
          fontSans.variable,
          fontSerif.variable,
          fontScript.variable,
          // Tipografía base y color
          "font-sans antialiased text-foreground bg-background",
          // Layout base
          "min-h-screen",
        ].join(" ")}
        
      >
        <SeoWebsite name="Piero & Debby" url="https://www.pieroydebby.cl" />
        {children}
      </body>
    </html>
  );
}
