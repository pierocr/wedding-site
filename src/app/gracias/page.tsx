import { Suspense } from "react";
import GraciasClient from "./GraciasClient";

// Evita que Next intente prerender con datos estáticos y nos deje usar searchParams
export const dynamic = "force-dynamic";

// (opcional) si quieres theme-color aquí, usa viewport en vez de metadata:
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function Page() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-muted-foreground">Cargando…</div>}>
      <GraciasClient />
    </Suspense>
  );
}
