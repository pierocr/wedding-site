"use client";
import * as React from "react";
import { Heart, Send, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const RSVPSection = () => {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    attending: "Sí, allí estaré",
    vegetarian: false,
    message: "",
  });
  const [touched, setTouched] = React.useState<{ name: boolean; email: boolean }>({
    name: false,
    email: false,
  });
  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "error">("idle");

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const canSubmit =
    !!form.name.trim() && !!form.email.trim() && EMAIL_RE.test(form.email) && status !== "sending";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("sending");
    try {
      // TODO: reemplazar por tu integración real (Supabase/Email/Route)
      await new Promise((r) => setTimeout(r, 900));
      setStatus("ok");
      // Mantén nombre/email por si quieren editar, resetea lo demás
      setForm((f) => ({ ...f, message: "" }));
    } catch {
      setStatus("error");
    }
  };

  const inputBase =
    "h-10 w-full rounded-md bg-background px-3 border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const invalidRing = "ring-2 ring-destructive/70 focus-visible:ring-destructive";

  return (
    <Card className="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-serif">
          <Heart className="h-5 w-5" /> Confirmar asistencia (RSVP)
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Nombre + Email */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre completo</label>
              <input
                type="text"
                value={form.name}
                onChange={onChange("name")}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="Ej: Carolina Pérez"
                className={`${inputBase} ${touched.name && !form.name.trim() ? invalidRing : ""}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={onChange("email")}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="nombre@correo.cl"
                className={`${inputBase} ${
                  touched.email && (!form.email.trim() || !EMAIL_RE.test(form.email)) ? invalidRing : ""
                }`}
                required
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="mb-1 block text-sm font-medium">Teléfono (opcional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={onChange("phone")}
              placeholder="+56 9 1234 5678"
              className={inputBase}
            />
          </div>

          {/* Asistencia + Preferencias */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">¿Asistirás?</label>
              <select value={form.attending} onChange={onChange("attending")} className={inputBase}>
                <option>Sí, allí estaré</option>
                <option>No podré asistir</option>
                <option>Lo confirmaré más adelante</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Preferencias</label>
              <label className="flex items-center gap-2 rounded-md border bg-background p-3">
                <input
                  type="checkbox"
                  checked={form.vegetarian}
                  onChange={onChange("vegetarian")}
                />
                <span className="inline-flex items-center gap-2">
                  <Salad className="h-4 w-4" />
                  Opción vegetariana
                </span>
              </label>
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="mb-1 block text-sm font-medium">Mensaje para los novios (opcional)</label>
            <textarea
              value={form.message}
              onChange={onChange("message")}
              placeholder="Escribe aquí tu mensaje…"
              rows={4}
              className="min-h-[120px] w-full rounded-md border bg-background p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Estado */}
          {status === "ok" && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              ¡Gracias! Recibimos tu confirmación 💌
            </div>
          )}
          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Ocurrió un error al enviar. Intenta nuevamente.
            </div>
          )}

          {/* Botón */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              size="lg"
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:w-auto rounded-xl"
            >
              <Send className="mr-2 h-4 w-4" />
              {status === "sending" ? "Enviando…" : "Enviar confirmación"}
            </Button>

            <p className="text-xs text-muted-foreground">
              * Solo usaremos tus datos para la coordinación del evento.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default RSVPSection;
