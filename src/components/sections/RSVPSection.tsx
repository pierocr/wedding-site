"use client";
import * as React from "react";
import { Heart, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/data/site";
import { trackEvent } from "@/lib/analytics";
import type { AttendingStatus, CompanionStatus } from "@/lib/rsvpSchema";

// 🔒 Fuente única de verdad para los estados (evita strings sueltos)
const STATUS = {
  Idle: "idle",
  Sending: "sending",
  Ok: "ok",
  Error: "error",
} as const;
type Status = (typeof STATUS)[keyof typeof STATUS];

const ATTENDING_LABELS = {
  yes: "Sí, confirmo mi asistencia",
  no: "No podré asistir",
  later: "Lo confirmaré más adelante",
} as const;

type DietaryPreference = "" | "vegetarian" | "pescatarian" | "vegan";

const RSVPSectionForm = () => {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    attending_status: "yes" as AttendingStatus,
    dietary_preference: "" as DietaryPreference,
    diet: "",
    companion_status: "no" as CompanionStatus,
    companion_name: "",
    companion_email: "",
    companion_phone: "",
    companion_dietary_preference: "" as DietaryPreference,
    companion_diet: "",
    message: "",
  });

  const [touched, setTouched] = React.useState<{
    name: boolean;
    email: boolean;
  }>({
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
    dietaryPreference: "rsvp-dietary-preference",
    diet: "rsvp-diet",
    companionStatus: "rsvp-companion-status",
    companionName: "rsvp-companion-name",
    companionEmail: "rsvp-companion-email",
    companionPhone: "rsvp-companion-phone",
    companionDietaryPreference: "rsvp-companion-dietary-preference",
    companionDiet: "rsvp-companion-diet",
    message: "rsvp-message",
  } as const;

  const onChange =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const isSending = status === STATUS.Sending;
  const canSubmitCompanion =
    form.attending_status !== "yes" ||
    form.companion_status !== "yes" ||
    (!!form.companion_name.trim() &&
      !!form.companion_email.trim() &&
      EMAIL_RE.test(form.companion_email) &&
      form.companion_email.trim().toLowerCase() !==
        form.email.trim().toLowerCase());
  const canSubmit =
    !!form.name.trim() &&
    !!form.email.trim() &&
    EMAIL_RE.test(form.email) &&
    canSubmitCompanion &&
    !isSending;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || isSending) return;

    setStatus(STATUS.Sending);
    setServerMsg(null);

    trackEvent("rsvp_click", {
      location: "rsvp_form",
      attending_status: form.attending_status,
      dietary_preference: form.dietary_preference || "none",
      companion_status:
        form.attending_status === "yes" ? form.companion_status : "no",
    });

    const companionStatus =
      form.attending_status === "yes" ? form.companion_status : "no";
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      attending_status: form.attending_status,
      vegetarian: form.dietary_preference === "vegetarian",
      pescatarian: form.dietary_preference === "pescatarian",
      vegan: form.dietary_preference === "vegan",
      diet: form.diet.trim(),
      companion_status: companionStatus,
      companion:
        companionStatus === "yes"
          ? {
              name: form.companion_name.trim(),
              email: form.companion_email.trim().toLowerCase(),
              phone: form.companion_phone.trim(),
              vegetarian: form.companion_dietary_preference === "vegetarian",
              pescatarian: form.companion_dietary_preference === "pescatarian",
              vegan: form.companion_dietary_preference === "vegan",
              diet: form.companion_diet.trim(),
            }
          : undefined,
      message: form.message.trim(),
      source: "pieroydebby.cl/rsvp",
    } as const;

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        mode?: "created" | "updated";
      } | null;

      if (!response.ok || !result?.ok) {
        setStatus(STATUS.Error);
        setServerMsg(
          result?.message ||
            "Ups, no pudimos guardar tu confirmación. Intenta nuevamente en unos minutos.",
        );
        return;
      }

      setStatus(STATUS.Ok);
      setServerMsg(result.message || "Recibimos tu confirmación. Gracias.");
      setForm((f) => ({
        ...f,
        phone: "",
        diet: "",
        companion_phone: "",
        companion_diet: "",
      }));
    } catch (error) {
      console.error("RSVP submit error:", error);
      setStatus(STATUS.Error);
      setServerMsg(
        "Ups, no pudimos guardar tu confirmación. Intenta nuevamente en unos minutos.",
      );
    }
  };

  const inputBase =
    "h-11 w-full rounded-md bg-background px-3 border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const invalidRing =
    "ring-2 ring-destructive/70 focus-visible:ring-destructive";

  return (
    <Card className="rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.035)]">
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
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor={FIELD_IDS.name}
              >
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
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor={FIELD_IDS.email}
              >
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
                  touched.email &&
                  (!form.email.trim() || !EMAIL_RE.test(form.email))
                    ? invalidRing
                    : ""
                }`}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor={FIELD_IDS.phone}
            >
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
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor={FIELD_IDS.attending}
              >
                ¿Asistirás?
              </label>
              <select
                id={FIELD_IDS.attending}
                value={form.attending_status}
                onChange={onChange("attending_status")}
                className={inputBase}
              >
                <option value="yes">{ATTENDING_LABELS.yes}</option>
                <option value="no">{ATTENDING_LABELS.no}</option>
                <option value="later">{ATTENDING_LABELS.later}</option>
              </select>
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor={FIELD_IDS.dietaryPreference}
              >
                Preferencias
              </label>
              <select
                id={FIELD_IDS.dietaryPreference}
                value={form.dietary_preference}
                onChange={onChange("dietary_preference")}
                className={inputBase}
              >
                <option value="">Sin preferencia alimentaria</option>
                <option value="vegetarian">Opción vegetariana</option>
                <option value="pescatarian">Opción pescetariana</option>
                <option value="vegan">Opción vegana</option>
              </select>
            </div>
          </div>

          {form.attending_status === "yes" && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <fieldset>
                <legend
                  className="mb-3 block text-sm font-medium"
                  id={FIELD_IDS.companionStatus}
                >
                  ¿Asistirás con acompañante?
                </legend>
                <div
                  className="grid gap-2 sm:grid-cols-3"
                  role="radiogroup"
                  aria-labelledby={FIELD_IDS.companionStatus}
                >
                  {[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Sí, ingreso sus datos" },
                    { value: "later", label: "Lo completo más tarde" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-center text-sm transition ${
                        form.companion_status === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="companion_status"
                        value={option.value}
                        checked={form.companion_status === option.value}
                        onChange={onChange("companion_status")}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {form.companion_status === "later" && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Dejaremos marcado que quieres completar los datos del
                  acompañante más adelante.
                </p>
              )}

              {form.companion_status === "yes" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        className="mb-1 block text-sm font-medium"
                        htmlFor={FIELD_IDS.companionName}
                      >
                        Nombre completo del acompañante
                      </label>
                      <input
                        type="text"
                        id={FIELD_IDS.companionName}
                        value={form.companion_name}
                        onChange={onChange("companion_name")}
                        placeholder="Ej: Andrés González"
                        className={inputBase}
                        required={form.companion_status === "yes"}
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block text-sm font-medium"
                        htmlFor={FIELD_IDS.companionEmail}
                      >
                        Email del acompañante
                      </label>
                      <input
                        type="email"
                        id={FIELD_IDS.companionEmail}
                        value={form.companion_email}
                        onChange={onChange("companion_email")}
                        placeholder="acompanante@correo.cl"
                        className={inputBase}
                        required={form.companion_status === "yes"}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        className="mb-1 block text-sm font-medium"
                        htmlFor={FIELD_IDS.companionPhone}
                      >
                        Teléfono del acompañante (opcional)
                      </label>
                      <input
                        type="tel"
                        id={FIELD_IDS.companionPhone}
                        value={form.companion_phone}
                        onChange={onChange("companion_phone")}
                        placeholder="+56 9 1234 5678"
                        className={inputBase}
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block text-sm font-medium"
                        htmlFor={FIELD_IDS.companionDietaryPreference}
                      >
                        Preferencias del acompañante
                      </label>
                      <select
                        id={FIELD_IDS.companionDietaryPreference}
                        value={form.companion_dietary_preference}
                        onChange={onChange("companion_dietary_preference")}
                        className={inputBase}
                      >
                        <option value="">Sin preferencia alimentaria</option>
                        <option value="vegetarian">Opción vegetariana</option>
                        <option value="pescatarian">Opción pescetariana</option>
                        <option value="vegan">Opción vegana</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor={FIELD_IDS.companionDiet}
                    >
                      Restricciones alimentarias del acompañante (opcional)
                    </label>
                    <input
                      type="text"
                      id={FIELD_IDS.companionDiet}
                      value={form.companion_diet}
                      onChange={onChange("companion_diet")}
                      placeholder="Ej: alergia a frutos secos, sin gluten"
                      className={inputBase}
                      maxLength={500}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor={FIELD_IDS.diet}
            >
              Restricciones alimentarias (opcional)
            </label>
            <input
              type="text"
              id={FIELD_IDS.diet}
              value={form.diet}
              onChange={onChange("diet")}
              placeholder="Ej: alergia a frutos secos, sin gluten"
              className={inputBase}
              maxLength={500}
            />
          </div>

          {/* Mensaje */}
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor={FIELD_IDS.message}
            >
              Mensaje para los novios (opcional)
            </label>
            <textarea
              id={FIELD_IDS.message}
              value={form.message}
              onChange={onChange("message")}
              placeholder="Escribe aquí tu mensaje…"
              rows={4}
              className="min-h-[120px] w-full rounded-md border bg-background p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              maxLength={1000}
            />
          </div>

          {/* Estado */}
          {status === STATUS.Ok && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {serverMsg || "¡Gracias! Recibimos tu confirmación."}
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
        <div
          className="filter blur-[4px] pointer-events-none select-none"
          aria-hidden="true"
        >
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
                  Esta sección estará disponible cuando se entreguen las
                  invitaciones
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
