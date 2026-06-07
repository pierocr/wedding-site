"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Home, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PagoClient() {
  const searchParams = useSearchParams();
  const status = (
    searchParams.get("status") ||
    searchParams.get("collection_status") ||
    ""
  ).toLowerCase();

  const isSuccess = ["success", "approved"].includes(status);
  const isFailure = ["failure", "rejected", "cancelled"].includes(status);
  const isPending = ["pending", "in_process"].includes(status) || (!isSuccess && !isFailure);

  const Icon = isSuccess ? CheckCircle2 : isFailure ? XCircle : Clock;
  const color = isSuccess
    ? "text-emerald-600"
    : isFailure
      ? "text-rose-600"
      : "text-amber-600";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="rounded-2xl">
        <CardHeader className="text-center">
          <Icon className={`mx-auto h-10 w-10 ${color}`} />
          <CardTitle className="mt-2 font-serif text-2xl">
            {isSuccess
              ? "¡Gracias! Tu pago fue aprobado."
              : isFailure
                ? "No pudimos procesar tu pago"
                : "Tu pago está pendiente"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSuccess &&
              "Hemos recibido tu aporte correctamente. ¡Gracias por acompañarnos en este momento especial! ❤️"}
            {isPending && "Tu pago no fue procesado. No se ha realizado ningún cargo aún."}
            {isFailure &&
              "El pago fue cancelado o rechazado por el medio de pago. No se realizó ningún cobro."}
          </p>
        </CardHeader>

        <CardContent>
          <div className="mt-4 flex items-center justify-center gap-3">
            {(isFailure || isPending) && (
              <Link href="/" prefetch>
                <Button variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Intentar nuevamente
                </Button>
              </Link>
            )}
            <Link href="/" prefetch>
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
