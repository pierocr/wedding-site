import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Home, RotateCcw } from "lucide-react";

// Opcional: fuerza render dinámico para que no intente cachear
export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Record<string, string | string[] | undefined> };

const first = (sp: PageProps["searchParams"], k: string) =>
  Array.isArray(sp?.[k]) ? (sp?.[k] as string[])[0] : (sp?.[k] as string | null) ?? null;

export default function PagoPage({ searchParams }: PageProps) {
  const rawStatus =
    (first(searchParams, "status") || first(searchParams, "collection_status") || "") + "";
  const status = rawStatus.toLowerCase();

  const params = {
    collection_id: first(searchParams, "collection_id"),
    payment_id: first(searchParams, "payment_id"),
    preference_id: first(searchParams, "preference_id") || first(searchParams, "preference"),
    external_reference: first(searchParams, "external_reference"),
    merchant_order_id: first(searchParams, "merchant_order_id"),
  };

  const isSuccess = ["success", "approved"].includes(status);
  const isFailure = ["failure", "rejected", "cancelled"].includes(status);
  const isPending = ["pending", "in_process"].includes(status);

  const Icon = isSuccess ? CheckCircle2 : isFailure ? XCircle : Clock;
  const color = isSuccess ? "text-emerald-600" : isFailure ? "text-rose-600" : "text-amber-600";

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="rounded-2xl">
        <CardHeader className="text-center">
          <Icon className={`mx-auto h-10 w-10 ${color}`} />
          <CardTitle className="mt-2 font-serif text-2xl">
            {isSuccess ? "¡Gracias! Tu pago fue aprobado."
              : isFailure ? "No pudimos procesar tu pago"
              : "Tu pago está pendiente"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Te mostramos el resultado de tu pago y guardamos un respaldo.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">collection_id</span>
            <span>{params.collection_id ?? "—"}</span>

            <span className="text-muted-foreground">collection_status</span>
            <span>{status || "—"}</span>

            <span className="text-muted-foreground">payment_id</span>
            <span>{params.payment_id ?? "—"}</span>

            <span className="text-muted-foreground">preference_id</span>
            <span className="truncate">{params.preference_id ?? "—"}</span>

            <span className="text-muted-foreground">external_reference</span>
            <span className="truncate">{params.external_reference ?? "—"}</span>

            <span className="text-muted-foreground">merchant_order_id</span>
            <span>{params.merchant_order_id ?? "—"}</span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            {isFailure && (
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
