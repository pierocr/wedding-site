"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Home, RefreshCw, AlertCircle } from "lucide-react";

type StatusResponse = {
  status: "pending" | "paid" | "rejected" | "cancelled" | "unknown";
  raffle_number?: number | null;
  amount?: number | null;
  donor_name?: string | null;
  donor_email?: string | null;
  cart?: Array<{ title?: string; unitPrice?: number; qty?: number }> | null;
  message?: string | null;
  external_reference?: string | null;
};

const priceFmt = (n?: number | null) =>
  typeof n === "number" && !Number.isNaN(n)
    ? new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(n)
    : null;

export default function ResultadoClient() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [noToken, setNoToken] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const status = data?.status || (noToken || invalidToken ? "unknown" : "pending");
  const statusInfo = useMemo(() => {
    if (noToken) {
      return {
        icon: AlertCircle,
        color: "text-amber-700",
        title: "Falta el código del pago",
        desc: "Si acabas de pagar, vuelve a intentar desde el botón al final de Flow. Si entraste manualmente, no tenemos el token.",
      };
    }
    if (invalidToken) {
      return {
        icon: AlertCircle,
        color: "text-rose-700",
        title: "Pago no encontrado",
        desc: "El token que recibimos no es válido o el pago no existe.",
      };
    }
    if (status === "paid")
      return {
        icon: CheckCircle2,
        color: "text-emerald-600",
        title: "Pago recibido ✅",
        desc: "¡Gracias! Tu regalo fue procesado exitosamente.",
      };
    if (status === "rejected" || status === "cancelled")
      return {
        icon: XCircle,
        color: "text-rose-600",
        title: "Pago rechazado o cancelado",
        desc: "No se realizó el cobro. Puedes intentar nuevamente.",
      };
    if (status === "pending")
      return {
        icon: Clock,
        color: "text-amber-600",
        title: "Pago pendiente",
        desc: "Estamos esperando la confirmación de Flow. Esto puede tardar unos segundos.",
      };
    return {
      icon: Clock,
      color: "text-slate-500",
      title: "Estado en revisión",
      desc: "Estamos verificando el estado de tu pago.",
    };
  }, [invalidToken, noToken, status]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      if (!token) {
        setNoToken(true);
        setError("Falta el token de pago entregado por Flow.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/flow/status?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) {
          setInvalidToken(true);
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setData(json as StatusResponse);
          setError(null);
          if (json?.status === "pending") {
            timer = setTimeout(load, 3500);
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "No pudimos obtener el estado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  // Clear local cart after a successful payment so the home page starts fresh.
  useEffect(() => {
    if (data?.status === "paid") {
      try {
        localStorage.removeItem("gift_cart");
        localStorage.removeItem("gift_donor");
      } catch {
        // no-op
      }
    }
  }, [data?.status]);

  const Icon = statusInfo.icon;

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Icon className={`mt-1 h-8 w-8 ${statusInfo.color}`} />
          <div>
            <h1 className="text-2xl font-semibold">{statusInfo.title}</h1>
            <p className="text-sm text-muted-foreground">{statusInfo.desc}</p>
            {data?.raffle_number && status === "paid" && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                Número de concurso: {data.raffle_number}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-2 text-sm">
          {data?.amount && (
            <div className="flex justify-between gap-3 border-b py-2">
              <span className="text-muted-foreground">Monto</span>
              <span className="font-semibold">{priceFmt(data.amount)}</span>
            </div>
          )}
          {data?.donor_name && (
            <div className="flex justify-between gap-3 border-b py-2">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{data.donor_name}</span>
            </div>
          )}
          {data?.donor_email && (
            <div className="flex justify-between gap-3 border-b py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate text-right">{data.donor_email}</span>
            </div>
          )}
          {data?.external_reference && (
            <div className="flex justify-between gap-3 border-b py-2">
              <span className="text-muted-foreground">Referencia</span>
              <span className="font-mono text-xs">{data.external_reference}</span>
            </div>
          )}
          {data?.message && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Mensaje</div>
              <div className="mt-1 text-sm">{data.message}</div>
            </div>
          )}
          {data?.cart && data.cart.length > 0 && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Regalos
              </div>
              <ul className="mt-1 space-y-1">
                {data.cart.map((l, idx) => (
                  <li key={`${l.title}-${idx}`} className="flex justify-between text-sm">
                    <span>
                      {l.qty ? `${l.qty}× ` : ""}
                      {l.title}
                    </span>
                    {l.unitPrice ? (
                      <span className="text-muted-foreground">{priceFmt(l.unitPrice * (l.qty ?? 1))}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {status !== "paid" && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              {loading ? "Actualizando..." : "Reintentar"}
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-rose-600"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
