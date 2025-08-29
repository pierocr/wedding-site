import { Suspense } from "react";
import ResultadoClient from "./client";

export const dynamic = "force-dynamic"; // evita SSG/ISR en build
export const runtime = "edge";          // Cloudflare Workers

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md p-8 text-center">
          Procesando resultado de pago…
        </main>
      }
    >
      <ResultadoClient />
    </Suspense>
  );
}
