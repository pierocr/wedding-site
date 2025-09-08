// src/app/layout.tsx
import type { Metadata } from "next";
import "@/app/globals.css";
import { fontSans, fontSerif, fontScript } from "./fonts";

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
        url: "/og.jpg", // 1200x630 recomendado
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
  // (opcional) colores del navegador en mobile
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

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
        {children}
      </body>
    </html>
  );
}
