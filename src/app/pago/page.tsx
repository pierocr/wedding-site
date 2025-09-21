// src/app/pago/page.tsx
export const runtime = "edge";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Home, RotateCcw } from "lucide-react";

type PageProps = { searchParams?: Record<string, string | string[] | undefined> };

const first = (sp: PageProps["searchParams"], k: string) =>
  Array.isArray(sp?.[k]) ? sp?.[k]?.[0] ?? null : (sp?.[k] as string | null) ?? null;

export default function PagoPage({ searchParams }: PageProps) {
  const rawStatus =
    (first(searchParams, "status") || first(searchParams, "collection_status") || "") + "";
  const status = rawStatus.toLowerCase();

  const isSuccess = ["success", "approved"].includes(status);
  const isFailure = ["failure", "rejected", "cancelled"].includes(status);
  const isPending = ["pending", "in_process"].includes(status) || (!isSuccess && !isFailure);

  const Icon = isSuccess ? CheckCircle2 : isFailure ? XCircle : Clock;
  const color = isSuccess
    ? "text-emerald-600"
    : isFailure
    ? "text-rose-600"
    : "text-amber-600";

  // OPCIONAL: auto-redirigir al inicio a los X segundos (descomenta si lo quieres)
  // if (typeof window !== "undefined") {
  //   setTimeout(() => { window.location.href = "/"; }, 6000);
  // }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
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
          <p className="text-sm text-muted-foreground mt-1">
            {isSuccess &&
              "Hemos recibido tu aporte correctamente. ¡Gracias por acompañarnos en este momento especial! ❤️"}
            {isPending &&
              "Tu pago está siendo revisado por el medio de pago. No se ha realizado ningún cargo aún."}
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
