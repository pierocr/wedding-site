"use client";

import { useState } from "react";

type Props = {
  title: string;
  amount: number; // CLP entero
  name?: string;
  email?: string;
  className?: string;
};

export default function PayWithMPRedirect({
  title,
  amount,
  name,
  email,
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al crear preferencia");
      if (!data?.init_point) throw new Error("Falta init_point");
      window.location.href = data.init_point as string; // redirección a Checkout Pro
    } catch (e) {
      console.error(e);
      alert("No pudimos iniciar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={className ?? "rounded-md border px-4 py-2"}
    >
      {loading ? "Redirigiendo…" : "Pagar con Mercado Pago"}
    </button>
  );
}
