import type { Metadata } from "next";
import "@/app/globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "Piero & Debby",
  description: "Sitio oficial del matrimonio",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
