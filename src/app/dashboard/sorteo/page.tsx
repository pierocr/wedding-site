import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasDashboardAccess } from "@/lib/dashboardAccess";
import Raffle from "./raffle";

export const metadata: Metadata = { title: "El gran sorteo", robots: { index: false, follow: false } };

export default async function RafflePage() {
  if (!(await hasDashboardAccess())) redirect("/dashboard");
  return <Raffle />;
}
