import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Minus,
  Sparkles,
  Workflow,
  HeartHandshake,
  Heart,
  CalendarHeart,
  Info,
  CreditCard,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Planes para sitio web de matrimonio | Piero & Debby",
  description:
    "Creamos sitios web de matrimonio cercanos, emotivos y listos para compartir con tus invitados. Desde una invitación digital sencilla hasta una experiencia premium con lista de regalos y panel de administración.",
};

type FeatureKey =
  | "informacion"
  | "galeria"
  | "agenda"
  | "rsvp"
  | "regalos"
  | "dominio"
  | "panel"
  | "pasarela"
  | "estiloPremium";

type Plan = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  tone: "silver" | "gold" | "diamond";
  highlight?: boolean;
  features: Record<FeatureKey, boolean | string>;
};

const featureCatalog: Array<{ key: FeatureKey; label: string }> = [
  { key: "informacion", label: "Landing con toda la información importante" },
  { key: "galeria", label: "Galería fotográfica para tus recuerdos" },
  { key: "agenda", label: "Agenda del día con mapas y horarios" },
  { key: "rsvp", label: "Confirmación de asistencia y mensajes personalizados" },
  { key: "regalos", label: "Sección de regalos y datos bancarios" },
  { key: "dominio", label: "Dominio propio .cl listo para compartir" },
  { key: "panel", label: "Panel intuitivo para editar textos y fotos" },
  { key: "pasarela", label: "Lista de regalos interactiva y pagos vía Mercado Pago (Tarjeta de Crédito) 💳" },
  {
    key: "estiloPremium",
    label: "Experiencia visual similar a pieroydebby.cl",
  },
];

const formatPriceCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const plans: Plan[] = [
  {
    id: "plata",
    name: "Anillo de plata",
    subtitle: "Esencia",
    description:
      "Un plan diseñado para compartir todo lo esencial con tus invitados.",
    price: 250_000,
    tone: "silver",
    features: {
      informacion: true,
      galeria: "Selección curada de fotos",
      agenda: true,
      regalos: true,
      rsvp: false,
      dominio: false,
      panel: false,
      pasarela: false,
      estiloPremium: false,
    },
  },
  {
    id: "oro",
    name: "Anillo de oro",
    subtitle: "Brillo",
    description:
      "Más personalización y tranquilidad: incluye dominio propio por 1 año.",
    price: 450_000,
    tone: "gold",
    highlight: true,
    features: {
      informacion: true,
      galeria: "Galería destacada y video corto",
      agenda: true,
      rsvp: "Formulario de RSVP y mensajes",
      regalos: true,
      dominio: "Dominio propio .cl por 1 año",
      panel: false,
      pasarela: false,
      estiloPremium: false,
    },
  },
  {
    id: "diamante",
    name: "Anillo de diamante",
    subtitle: "Leyenda",
    description:
      "La experiencia completa similar a pieroydebby.cl, con extras y soporte extendido.",
    price: 750_000,
    tone: "diamond",
    features: {
      informacion: true,
      galeria: "Galería ampliada y video hero",
      agenda: true,
      rsvp: "Confirmaciones VIP y mensajes",
      regalos: true,
      dominio: "Dominio propio .cl por 2 años",
      panel: "Panel para editar textos y fotos",
      pasarela: "Lista de regalos interactiva y pagos",
      estiloPremium: true,
    },
  },
];

const steps = [
  {
    title: "Nos cuentan su historia",
    description:
      "Conversamos sobre su celebración, preferencias visuales y los detalles importantes.",
  },
  {
    title: "Elegimos el plan ideal",
    description:
      "Definimos alcance, tiempos y entregables para que todo quede claro antes de iniciar.",
  },
  {
    title: "Diseñamos y lanzamos",
    description:
      "Creamos el sitio, iteramos con ustedes y publicamos en la plataforma seleccionada.",
  },
];

const inspirationImages = [
  {
    src: "/imgs/timeline/pexels-marina-abrosimova-3319804-5222109.jpg",
    alt: "Pareja recién casada celebrando al aire libre",
  },
  {
    src: "/imgs/timeline/pexels-jonathanborba-12846017.jpg",
    alt: "Decoración acogedora para la ceremonia de matrimonio",
  },
  {
    src: "/imgs/timeline/pexels-hannaauramenka-8669230.jpg",
    alt: "Detalles delicados del vestido y ramos de novia",
  },
];

const reasons = [
  {
    icon: HeartHandshake,
    title: "Hecho por novios, para novios",
    description:
      "Vivimos este proceso y sabemos exactamente la mezcla entre emoción, diseño bonito y cero complicaciones que están buscando.",
  },
  {
    icon: CalendarHeart,
    title: "Todo pensado para sus invitados",
    description:
      "Horarios, mapas, dress code, RSVP y más: todo ordenado en un solo lugar para que cada invitado se sienta acompañado desde el primer clic.",
  },
  {
    icon: Sparkles,
    title: "Diseño cercano y funcional",
    description:
      "Animaciones suaves, tipografías cuidadas y un diseño que se ve perfecto tanto en computador como en celular.",
  },
];

const faqs = [
  {
    question: "¿Cómo se contrata el servicio?",
    answer:
      "Nos escriben por correo o WhatsApp, coordinamos una breve reunión online para conocernos, elegimos el plan ideal y les enviamos una propuesta formal con valores, plazos y formas de pago.",
  },
  {
    question: "¿Puedo contratar abonando solo una parte?",
    answer:
      "Sí. Pueden reservar el servicio abonando el 50% del valor del plan. El 50% restante se paga al finalizar el sitio, justo antes de publicarlo y entregarlo listo para compartir.",
  },
  {
    question: "¿Cuánto se demora en estar listo el sitio?",
    answer:
      "Dependiendo del plan y de la rapidez con que nos envíen la información, el tiempo estimado va entre 2 y 4 semanas. Les damos un cronograma con fechas claras para que puedan organizarse sin estrés.",
  },
  {
    question: "¿Qué pasa si necesitamos hacer cambios después?",
    answer:
      "Cada plan incluye un número de rondas de revisión (2 o 3 según el plan). Después del lanzamiento, podemos hacer ajustes puntuales como cambio de horarios, mapas o textos importantes.",
  },
  {
    question: "¿Nuestros invitados podrán ver el sitio desde el celular?",
    answer:
      "Sí. Diseñamos el sitio para que se vea y funcione perfecto en el teléfono, ya que la mayoría de los invitados accederá desde ahí. También se ve muy bien en tablet y computador.",
  },
  {
    question: "¿Incluye dominio y hosting?",
    answer:
      "En el plan de Anillo de oro podemos gestionar dominio y hosting por ustedes. En el Anillo de diamante, el dominio propio y el hosting están incluidos y contemplados en el presupuesto.",
  },
];

export default function WeddingPlansPage() {
  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="relative border-b border-border/60 bg-gradient-to-b from-background via-muted/40 to-background">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_55%)]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:py-20 lg:flex-row lg:items-center">
          <div className="flex-1 text-center lg:text-left">
            <p className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Sitios web de matrimonio
            </p>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.2rem]">
              Convierte tu historia de amor
              <br className="hidden sm:block" /> en una invitación digital
              inolvidable
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground lg:mx-0">
              Diseñamos sitios web de matrimonio cálidos, cercanos y
              totalmente personalizados, para que compartir los detalles de su
              boda sea tan especial como el gran día.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Button asChild size="lg" className="px-8">
                <Link href="#precios">Ver planes y precios</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-dashed"
              >
                <Link href="#contacto">Quiero cotizar</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Plazos estimados desde 2 a 4 semanas, según el plan y la cantidad
              de ajustes.
            </p>
          </div>

          <div className="flex-1">
            <div className="grid gap-4 sm:grid-cols-3">
              {inspirationImages.map((image, index) => (
                <figure
                  key={image.src}
                  className={`group relative h-40 overflow-hidden rounded-3xl border border-border/40 bg-muted/30 shadow-sm sm:h-48 ${
                    index === 1 ? "sm:translate-y-4" : ""
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 90vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-105 group-hover:brightness-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-70" />
                  <figcaption className="sr-only">{image.alt}</figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-border/60 bg-background/90 px-5 py-3 text-xs text-muted-foreground shadow-sm">
              Inspirado en{" "}
              <span className="font-medium text-foreground">
                pieroydebby.cl
              </span>{" "}
              y adaptado a la historia de cada pareja.
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="border-b border-border/60 bg-muted/20 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Diseñado con cariño
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              Más que una página, una experiencia para ustedes y sus invitados
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              Nos enfocamos en que cada sitio se sienta único: alineado con la
              estética de su boda, fácil de usar para sus invitados y con la
              calidez de una invitación hecha a mano.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <Card
                  key={reason.title}
                  className="border-border/70 bg-background/90 shadow-sm"
                >
                  <CardHeader className="space-y-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-muted/60">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {reason.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {reason.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="precios"
        className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Planes
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              Elijan el anillo que mejor cuenta su historia
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Todos los planes incluyen un sitio web de matrimonio cercano y
              adaptado a celular y con acompañamiento durante el proceso. Lo que
              cambia es el nivel de personalización y las funcionalidades
              avanzadas.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Pago único, sin letra chica.</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Reserva con el 50% y el resto al entregar.</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex h-full flex-col border-border/80 bg-background/95 ${
                  plan.highlight
                    ? "shadow-xl shadow-primary/15 ring-2 ring-primary/30"
                    : "shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute inset-x-0 top-0 flex justify-center">
                    <div className="mt-3 rounded-full bg-foreground px-4 py-1 text-[11px] font-semibold tracking-[0.2em] text-background">
                      ¡POPULAR!
                    </div>
                  </div>
                )}

                <CardHeader className="pt-8">
                  <CardTitle className="font-serif text-[1.7rem] font-semibold leading-snug text-center">
                    {plan.name}
                  </CardTitle>
                  <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {plan.subtitle}
                  </p>
                  <CardDescription className="mt-4 text-center text-sm text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-semibold">
                      {formatPriceCLP(plan.price)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Pago único. Puedes contratar abonando el{" "}
                      <span className="font-semibold text-foreground">50%</span>
                      .
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {(() => {
                      const includedList: typeof featureCatalog = [];
                      const missingList: typeof featureCatalog = [];

                      featureCatalog.forEach((feature) => {
                        const isIncluded = Boolean(plan.features[feature.key]);
                        (isIncluded ? includedList : missingList).push(feature);
                      });

                      return [...includedList, ...missingList].map((feature) => {
                        const status = plan.features[feature.key];
                        const isIncluded = Boolean(status);
                        const note =
                          typeof status === "string" ? status : null;

                        return (
                          <li
                            key={feature.key}
                            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all ${
                              isIncluded
                                ? "border border-primary/20 bg-primary/5 text-foreground shadow-sm"
                                : "opacity-50"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                                isIncluded
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-transparent text-muted-foreground"
                              }`}
                              aria-hidden
                            >
                              {isIncluded ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Minus className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="leading-tight">
                              <span className={`block ${isIncluded ? "font-medium" : "font-normal"}`}>
                                {feature.label}
                              </span>
                              {note && isIncluded && (
                                <span className="mt-0.5 block text-xs text-foreground/70">
                                  {note}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      });
                    })()}
                  </ul>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 border-t border-dashed border-border/60 pt-4">
                  <Button asChild className="w-full">
                    <Link href="#contacto">Empezar con este plan</Link>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Enviaremos una propuesta detallada según su fecha, lugar y
                    tipo de celebración.
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-b border-border/60 bg-muted/15 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Cómo funciona
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              Acompañamos cada etapa del proceso
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              Queremos que el sitio web sea un motivo más para emocionarse, no
              una preocupación. Por eso trabajamos con pasos claros, plazos
              definidos y comunicación cercana.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-dashed border-border/70 bg-background/90 px-6 py-8 text-center shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-lg font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border/70 bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Preguntas frecuentes
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              Todo lo que necesitas saber antes de reservar
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Si aún tienen dudas, aquí respondemos las preguntas más comunes
              que nos hacen las parejas antes de contratar.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm transition data-[open=true]:bg-muted/40 sm:px-5 sm:py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground">
                      <Info className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium text-foreground">
                      {faq.question}
                    </span>
                  </div>
                  <span className="ml-4 text-xs text-muted-foreground group-open:hidden">
                    Ver respuesta
                  </span>
                  <span className="ml-4 hidden text-xs text-muted-foreground group-open:block">
                    Ocultar
                  </span>
                </summary>
                <div className="mt-2 pl-8 text-sm text-muted-foreground">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section
        id="contacto"
        className="border-t border-border/70 bg-gradient-to-b from-muted/30 via-background to-background py-16 sm:py-20"
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-border/70 bg-background/95 px-6 py-12 text-center shadow-lg sm:px-12">
            <p className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <Workflow className="h-4 w-4" />
              Cotización
            </p>
            <h2 className="mt-5 font-serif text-3xl font-semibold sm:text-4xl">
              ¿Listos para crear su sitio de matrimonio?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              Cuéntennos la fecha de la boda, el estilo que imaginan y el plan
              que más les llamó la atención. Les responderemos con una propuesta
              personalizada, tiempos estimados y próximos pasos claros.
            </p>

            <div className="mt-8 space-y-3 text-sm text-muted-foreground">
              <p>Pueden escribirnos directamente a:</p>
              <div className="flex flex-col items-center gap-2 text-base font-medium sm:flex-row sm:justify-center">
                <a
                  href="mailto:pierocr@gmail.com?subject=Cotizaci%C3%B3n%20sitio%20web%20de%20matrimonio"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  pierocr@gmail.com
                </a>
                <span className="hidden text-muted-foreground sm:inline">
                  /
                </span>
                <a
                  href="mailto:debby.gutierrez.parra@gmail.com?subject=Cotizaci%C3%B3n%20sitio%20web%20de%20matrimonio"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  debby.gutierrez.parra@gmail.com
                </a>
              </div>
            </div>

            <div className="mt-8 grid gap-4 text-left text-xs text-muted-foreground sm:grid-cols-3">
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                  Tiempo estimado
                </p>
                <p className="mt-1">
                  Entre 2 y 4 semanas, según el plan y la cantidad de ajustes.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                  Soporte
                </p>
                <p className="mt-1">
                  Acompañamiento para el lanzamiento y ajustes menores iniciales.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                  Listo para compartir
                </p>
                <p className="mt-1">
                  Enlace ideal para invitaciones, WhatsApp y redes sociales.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="h-4 w-4 text-primary" />
              <span>
                Nos encantaría ser parte de este capítulo en su historia 💍
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}