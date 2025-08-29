"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";

export default function ResultadoPago() {
  const sp = useSearchParams();
  const status = (sp.get("status") || "").toLowerCase();
  const router = useRouter();

  const map = {
    approved: {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "¡Pago aprobado!",
      desc: "¡Muchas gracias por tu regalo y tu mensaje! 💖",
    },
    pending: {
      icon: <Clock className="h-8 w-8" />,
      title: "Pago pendiente",
      desc: "Tu pago quedó en revisión. Te contactaremos si es necesario.",
    },
    failure: {
      icon: <XCircle className="h-8 w-8" />,
      title: "Pago no realizado",
      desc: "No se pudo completar el pago. Puedes intentar nuevamente.",
    },
  } as const;

  const view = map[status as keyof typeof map] || map.failure;

  return (
    <div className="mx-auto max-w-xl p-6 text-center">
      <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-full bg-muted p-4">
        {view.icon}
      </div>
      <h1 className="mb-2 text-2xl font-semibold">{view.title}</h1>
      <p className="text-muted-foreground">{view.desc}</p>

      <button
        className="mt-6 inline-flex items-center gap-2 rounded-md border px-4 py-2"
        onClick={() => router.push("/#regalo")}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a los regalos
      </button>
    </div>
  );
}
