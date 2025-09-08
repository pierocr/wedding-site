import { Suspense } from "react";
import GraciasClient from "./GraciasClient";

export const runtime = "edge";            // ✅ requerido por Cloudflare Pages para rutas dinámicas
export const dynamic = "force-dynamic";   // evita SSG
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
