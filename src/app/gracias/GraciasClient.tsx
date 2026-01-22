"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Hourglass, XCircle, Heart, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GraciasClient() {
  const params = useSearchParams();
  const router = useRouter();

  const status = (params.get("status") || params.get("collection_status") || "").toLowerCase();
  const paymentId = params.get("payment_id") || params.get("collection_id") || "";
  const preferenceId = params.get("preference_id") || "";
  const externalRef = params.get("external_reference") || "";
  const merchantOrderId = params.get("merchant_order_id") || "";

  // Limpia carrito si approved
  React.useEffect(() => {
    if (status === "approved") {
      try {
        localStorage.removeItem("gift_cart");
      } catch {}
    }
  }, [status]);

  // Enviar email (una sola vez por payment_id)
  React.useEffect(() => {
    if (status !== "approved" || !paymentId) return;
    const sentKey = `thanks_mail_sent:${paymentId}`;
    if (typeof window !== "undefined" && localStorage.getItem(sentKey) === "1") return;

    let fallback: { name?: string; email?: string } = {};
    try {
      const raw = localStorage.getItem("gift_donor");
      if (raw) fallback = JSON.parse(raw) ?? {};
    } catch {}

    fetch("/api/email/thanks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_id: paymentId,
        external_reference: externalRef || undefined,
        fallback,
      }),
    })
      .then(() => {
        try {
          localStorage.setItem(sentKey, "1");
        } catch {}
      })
      .catch(() => {});
  }, [status, paymentId, externalRef]);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "/";

  const variants = {
    approved: {
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
      title: "¡Pago recibido con amor!",
      desc: "Muchas gracias por tu regalo. Tu aporte nos acerca un poquito más a nuestra luna de miel y a nuevos recuerdos juntos.",
      note: "Te llegará un mail de confirmación con el detalle del pago.",
      accent: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    pending: {
      icon: <Hourglass className="h-8 w-8 text-amber-600" />,
      title: "Tu pago está en revisión",
      desc: "Flow/Webpay está validando la transacción. Te avisaremos por correo cuando se confirme.",
      note: "Si ves que tarda demasiado, puedes volver a intentar más tarde.",
      accent: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    failure: {
      icon: <XCircle className="h-8 w-8 text-rose-600" />,
      title: "No pudimos procesar el pago",
      desc: "La transacción fue rechazada o cancelada. Puedes volver e intentar nuevamente.",
      note: "Revisa tu medio de pago o el límite de tu tarjeta.",
      accent: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
    default: {
      icon: <Heart className="h-8 w-8 text-pink-600" />,
      title: "¡Gracias por tu cariño!",
      desc: "Si realizaste un pago, pronto te llegará un mail con la confirmación.",
      note: "",
      accent: "text-pink-700",
      bg: "bg-pink-50",
      border: "border-pink-200",
    },
  } as const;

  const v =
    status === "approved"
      ? variants.approved
      : status === "pending"
      ? variants.pending
      : status === "failure"
      ? variants.failure
      : variants.default;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card className="rounded-2xl">
        <CardHeader className="space-y-3">
          <div className="inline-flex items-center gap-3">
            {v.icon}
            <CardTitle className="text-2xl">{v.title}</CardTitle>
          </div>
          <CardDescription className="text-base">{v.desc}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {(paymentId || preferenceId || externalRef || merchantOrderId) && (
            <div className={["rounded-xl border p-4 text-sm", v.bg, v.border, v.accent].join(" ")}>
              <div className="font-medium mb-1">Detalle de la operación</div>
              <ul className="grid gap-1 text-foreground/80">
                {status && (
                  <li>
                    <span className="text-foreground/60">Estado:</span> {status}
                  </li>
                )}
                {paymentId && (
                  <li>
                    <span className="text-foreground/60">Payment ID:</span> {paymentId}
                  </li>
                )}
                {preferenceId && (
                  <li>
                    <span className="text-foreground/60">Preference ID:</span> {preferenceId}
                  </li>
                )}
                {merchantOrderId && (
                  <li>
                    <span className="text-foreground/60">Merchant Order:</span> {merchantOrderId}
                  </li>
                )}
                {externalRef && (
                  <li>
                    <span className="text-foreground/60">Referencia:</span> {externalRef}
                  </li>
                )}
              </ul>
            </div>
          )}

          {v.note && <p className="text-sm text-muted-foreground">{v.note}</p>}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="rounded-xl" onClick={() => router.push("/")} aria-label="Volver al inicio">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>

            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={() => router.push(`${SITE_URL}#regalo`)}
              aria-label="Hacer otro regalo"
            >
              Hacer otro regalo
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">Gracias por ser parte de nuestra historia 💖</p>
    </div>
  );
}
