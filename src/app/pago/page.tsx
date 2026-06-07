import { Suspense } from "react";
import PagoClient from "./PagoClient";

export default function PagoPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-muted-foreground">Cargando…</div>}>
      <PagoClient />
    </Suspense>
  );
}
