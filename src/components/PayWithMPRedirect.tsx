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
      const res = await fetch("/api/flow/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name: name,
          donor_email: email,
          amount,
          cart: [{ id: "custom", title, unitPrice: amount, qty: 1 }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al crear pago en Flow");
      if (!data?.redirectUrl) throw new Error("Falta redirectUrl");
      window.location.href = data.redirectUrl as string;
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
      {loading ? "Redirigiendo…" : "Pagar con Flow"}
    </button>
  );
}
