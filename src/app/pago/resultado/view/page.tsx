import { Suspense } from "react";
import ResultadoClient from "../client";

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
