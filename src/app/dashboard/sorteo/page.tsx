import type { Metadata } from "next";
import Raffle from "./raffle";

export const metadata: Metadata = { title: "El gran sorteo", robots: { index: false, follow: false } };

export default function RafflePage() {
  return <Raffle />;
}
