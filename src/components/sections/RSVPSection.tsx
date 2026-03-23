"use client";
import * as React from "react";
import { Heart, Send, Salad, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { FEATURE_FLAGS } from "@/data/site";

// 🔒 Fuente única de verdad para los estados (evita strings sueltos)
const STATUS = {
  Idle: "idle",
  Sending: "sending",
  Ok: "ok",
  Error: "error",
} as const;
type Status = typeof STATUS[keyof typeof STATUS];

const ATTENDING_LABELS = {
  yes: "Sí, allí estaré",
  no: "No podré asistir",
  later: "Lo confirmaré más adelante",
} as const;
type AttendingKey = keyof typeof ATTENDING_LABELS;

const RSVPSectionForm = () => {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    attending: ATTENDING_LABELS.yes,
    vegetarian: false,
    message: "",
  });

  const [touched, setTouched] = React.useState<{ name: boolean; email: boolean }>({
    name: false,
    email: false,
  });

  const [status, setStatus] = React.useState<Status>(STATUS.Idle);
  const [serverMsg, setServerMsg] = React.useState<string | null>(null);

  const FIELD_IDS = {
    name: "rsvp-name",
    email: "rsvp-email",
    phone: "rsvp-phone",
    attending: "rsvp-attending",
    vegetarian: "rsvp-vegetarian",
    message: "rsvp-message",
  } as const;

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const isSending = status === STATUS.Sending;
  const canSubmit =
    !!form.name.trim() && !!form.email.trim() && EMAIL_RE.test(form.email) && !isSending;

  const toStatusCode = (label: string): AttendingKey => {
    if (label === ATTENDING_LABELS.yes) return "yes";
    if (label === ATTENDING_LABELS.no) return "no";
    return "later";
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || isSending) return;

    setStatus(STATUS.Sending);
    setServerMsg(null);

    // 'yes' | 'no' | 'later'
    const statusKey = toStatusCode(form.attending);
    // boolean para tu columna antigua NOT NULL
    const attendingBool = statusKey === "yes";

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,

      // 👉 enviamos ambos para evitar el 23502
      attending_status: statusKey, // texto controlado
      attending: attendingBool, // boolean (NOT NULL en tu tabla)

      vegetarian: !!form.vegetarian,
      message: form.message.trim() || null,
      source: "pieroydebby.cl/rsvp",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    } as const;

    const { error } = await getSupabaseClient().from("rsvp").insert([payload]);

    if (error) {
      // 23505 => unique_violation (email duplicado)
      if ((error as any).code === "23505") {
        setStatus(STATUS.Error);
        setServerMsg(
          "Este correo ya tiene una confirmación registrada. Si necesitas actualizarla, escríbenos y lo ajustamos 🙏"
        );
        return;
      }

      console.error("RSVP insert error:", error);
      setStatus(STATUS.Error);
      setServerMsg("Ups, no pudimos guardar tu confirmación. Intenta nuevamente en unos minutos.");
      return;
    }

    setStatus(STATUS.Ok);
    // Si quieres limpiar parte del formulario:
    setForm((f) => ({ ...f, phone: "", message: "" }));
  };

  const inputBase =
    "h-10 w-full rounded-md bg-background px-3 border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const invalidRing = "ring-2 ring-destructive/70 focus-visible:ring-destructive";

  return (
    <Card className="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <CardHeader className="pb-1">
        {/* Si quieres mostrar el título dentro del Card: */}
        {/* <CardTitle className="flex items-center gap-2 font-serif">
          <Heart className="h-5 w-5" /> Confirmar asistencia
        </CardTitle> */}
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Nombre + Email */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor={FIELD_IDS.name}>
                Nombre completo
              </label>
              <input
                type="text"
                id={FIELD_IDS.name}
                value={form.name}
                onChange={onChange("name")}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="Ej: Carolina Pérez"
                className={`${inputBase} ${touched.name && !form.name.trim() ? invalidRing : ""}`}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor={FIELD_IDS.email}>
                Email
              </label>
              <input
                type="email"
                id={FIELD_IDS.email}
                value={form.email}
                onChange={onChange("email")}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="nombre@correo.cl"
                className={`${inputBase} ${
                  touched.email && (!form.email.trim() || !EMAIL_RE.test(form.email)) ? invalidRing : ""
                }`}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor={FIELD_IDS.phone}>
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              id={FIELD_IDS.phone}
              value={form.phone}
              onChange={onChange("phone")}
              placeholder="+56 9 1234 5678"
              className={inputBase}
              autoComplete="tel"
            />
          </div>

          {/* Asistencia + Preferencias */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor={FIELD_IDS.attending}>
                ¿Asistirás?
              </label>
              <select
                id={FIELD_IDS.attending}
                value={form.attending}
                onChange={onChange("attending")}
                className={inputBase}
              >
                <option>{ATTENDING_LABELS.yes}</option>
                <option>{ATTENDING_LABELS.no}</option>
                <option>{ATTENDING_LABELS.later}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor={FIELD_IDS.vegetarian}>
                Preferencias
              </label>
              <label className="flex items-center gap-2 rounded-md border bg-background p-3">
                <input
                  type="checkbox"
                  id={FIELD_IDS.vegetarian}
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
            <label className="mb-1 block text-sm font-medium" htmlFor={FIELD_IDS.message}>
              Mensaje para los novios (opcional)
            </label>
            <textarea
              id={FIELD_IDS.message}
              value={form.message}
              onChange={onChange("message")}
              placeholder="Escribe aquí tu mensaje…"
              rows={4}
              className="min-h-[120px] w-full rounded-md border bg-background p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Estado */}
          {status === STATUS.Ok && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              ¡Gracias! Recibimos tu confirmación 💌
            </div>
          )}
          {status === STATUS.Error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {serverMsg || "Ocurrió un error al enviar. Intenta nuevamente."}
            </div>
          )}

          {/* Botón */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              size="lg"
              type="submit"
              disabled={!canSubmit || isSending}
              className="w-full sm:w-auto rounded-xl"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? "Guardando…" : "Enviar confirmación"}
            </Button>

            <p className="text-xs text-muted-foreground">
              * Solo usaremos tus datos para la coordinación del evento.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const RSVPSection = () => {
  if (!FEATURE_FLAGS.rsvpEnabled) {
    return (
      <div className="relative">
        {/* Placeholder borroso detrás para no inicializar Supabase cuando la feature está apagada */}
        <div className="filter blur-[4px] pointer-events-none select-none" aria-hidden="true">
          <Card className="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <CardContent className="pt-6">
              <div className="space-y-5 opacity-70">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-16 rounded-md border bg-background" />
                  <div className="h-16 rounded-md border bg-background" />
                </div>
                <div className="h-10 rounded-md border bg-background" />
                <div className="h-10 rounded-md border bg-background" />
                <div className="h-32 rounded-md border bg-background" />
                <div className="h-10 w-48 rounded-xl bg-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overlay con mensaje */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md shadow-lg border-2">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Pronto disponible
                </h3>
                <p className="text-sm text-muted-foreground">
                  Esta sección estará disponible cuando se entreguen las invitaciones
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <RSVPSectionForm />;
};

export default RSVPSection;
