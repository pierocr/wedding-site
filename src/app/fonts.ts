// src/app/fonts.ts
import { Playfair_Display, Inter, Great_Vibes } from "next/font/google";

/** Serif elegante para títulos */
export const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

/** Sans legible para párrafos y UI */
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

/** Script caligráfica para acentos (nombres, & , firmas) */
export const fontScript = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
  display: "swap",
});
