"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type MPReturn = {
  collection_id?: string | null;
  collection_status?: string | null;
  payment_id?: string | null;
  status?: string | null;
  preference_id?: string | null;
  external_reference?: string | null;
  merchant_order_id?: string | null;
};

export default function ResultadoClient() {
  const sp = useSearchParams();
  const [submitted, setSubmitted] = useState(false);

  const data: MPReturn = useMemo(
    () => ({
      collection_id: sp.get("collection_id"),
      collection_status: sp.get("collection_status"),
      payment_id: sp.get("payment_id") || sp.get("paymentId"),
      status: sp.get("status") || sp.get("collection_status"),
      preference_id: sp.get("preference_id") || sp.get("preferenceId"),
      external_reference: sp.get("external_reference"),
      merchant_order_id: sp.get("merchant_order_id"),
    }),
    [sp]
  );

  // Opcional: notificar a tu backend para registrar el retorno (idempotente)
  useEffect(() => {
    if (!submitted && (data.payment_id || data.collection_id)) {
      setSubmitted(true);
      fetch("/api/mp/registrar-retorno", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, source: "return_url" }),
      }).catch(() => {});
    }
  }, [data, submitted]);

  const approved = (data.status || "").toLowerCase() === "approved";

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">
          {approved ? "¡Pago aprobado!" : "Estado del pago"}
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Te mostraremos el resultado de tu pago y guardaremos un respaldo.
        </p>

        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {Object.entries(data).map(([k, v]) =>
            v ? (
              <div key={k} className="flex justify-between gap-4 border-b py-2">
                <dt className="font-medium">{k}</dt>
                <dd className="truncate">{v}</dd>
              </div>
            ) : null
          )}
        </dl>

        <a href="/" className="mt-6 inline-block rounded-xl border px-4 py-2">
          Volver al inicio
        </a>
      </div>
    </main>
  );
}
