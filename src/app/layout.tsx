// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { fontSans, fontSerif, fontScript } from "./fonts";
import SeoWebsite from "@/components/seo/SeoWebsite";
import SeoWeddingEvent from "@/components/seo/SeoWeddingEvent";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", languages: { "es-CL": "/" } },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "es_CL",
    images: [
      { url: "/og.jpg", width: 1200, height: 630, alt: `${SITE_NAME} — Invitación` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.jpg"],
  },
  icons: { 
  icon: "/favicon.ico", 
  apple: "/apple-touch-icon.png" 
},
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
};

// ✅ Mover themeColor aquí
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={[
          fontSans.variable,
          fontSerif.variable,
          fontScript.variable,
          "bg-background text-foreground font-sans antialiased",
        ].join(" ")}
      >
        <SeoWebsite name={SITE_NAME} url={SITE_URL} />
        <SeoWeddingEvent />
        <GoogleAnalytics />
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
