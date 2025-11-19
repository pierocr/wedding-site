import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Workflow } from "lucide-react";
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
    "Conoce nuestros planes para crear tu sitio web de matrimonio: desde una página informativa hasta una experiencia premium con panel de administración y pasarela de pago.",
};

const plans = [
  {
    title: "Plan Básico – Página informativa",
    description: "Ideal para parejas que desean una página simple, delicada y funcional.",
    price: "Valor de referencia: $180.000 – $300.000 CLP",
    note: "Tiempo estimado: 10 a 15 horas de trabajo",
    features: [
      "Home con información principal",
      "Cuenta regresiva para el día del matrimonio",
      "Historia y fotografías destacadas",
      "Información del evento (lugar, fecha, hora)",
      "Dress code y recomendaciones para invitados",
      "Ubicación con mapa o enlace directo",
      "Formulario simple de confirmación de asistencia (RSVP)",
    ],
  },
  {
    title: "Plan Completo – Estilo Piero & Debby",
    description: "Una experiencia similar a https://www.pieroydebby.cl/, cuidando cada detalle visual.",
    price: "Valor de referencia: $400.000 – $500.000 CLP",
    note: "Trabajo estimado: 25 a 40 horas",
    features: [
      "Diseño personalizado en Next.js + Tailwind",
      "Animaciones y UI optimizada para móvil y desktop",
      "RSVP con almacenamiento en base de datos",
      "Formulario de mensajes o contacto",
      "Sección de regalos o datos de transferencia",
      "Deploy en Cloudflare Pages",
      "Optimización SEO básica",
    ],
  },
  {
    title: "Plan Premium – Todo incluido",
    description: "Pensado para proyectos a medida con más integración y herramientas para la pareja.",
    price: "Valor de referencia: $600.000 – $1.200.000 CLP",
    note: "Pensado para proyectos más personalizados y con mayor integración.",
    features: [
      "Panel simple para editar textos y fotos",
      "Galería fotográfica más completa",
      "Timeline ilustrado y mejorado",
      "Integración de pasarela de pago para regalos (ej: Mercado Pago)",
      "Gift registry dinámica",
      "Hosting + dominio + soporte por 1 año",
    ],
  },
];

const steps = [
  {
    title: "Nos cuentan su historia",
    description: "Conversamos sobre su celebración, preferencias visuales y los detalles importantes.",
  },
  {
    title: "Elegimos el plan ideal",
    description: "Definimos alcance, tiempos y entregables para que todo quede claro antes de iniciar.",
  },
  {
    title: "Diseñamos y lanzamos",
    description: "Creamos el sitio, iteramos con ustedes y publicamos en la plataforma seleccionada.",
  },
];

const inspirationImages = [
  {
    src: "/imgs/timeline/pexels-marina-abrosimova-3319804-5222109.jpg",
    alt: "Pareja recién casada celebrando al aire libre",
  },
  {
    src: "/imgs/timeline/pexels-jonathanborba-12846017.jpg",
    alt: "Decoración elegante para la ceremonia de matrimonio",
  },
  {
    src: "/imgs/timeline/pexels-hannaauramenka-8669230.jpg",
    alt: "Detalles delicados del vestido y ramos de novia",
  },
];

export default function WeddingPlansPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
          <p className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Sitios con alma
          </p>
          <h1 className="mt-6 font-serif text-4xl font-semibold sm:text-5xl">
            Diseñamos tu sitio web de matrimonio
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground">
            Elige el plan que mejor se adapta a su celebración y nosotros nos encargamos de crear una experiencia
            elegante, emocional y funcional para sus invitados.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="#contacto">Quiero cotizar</Link>
            </Button>
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver ejemplo en vivo
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {inspirationImages.map((image) => (
              <figure
                key={image.src}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-muted/30 shadow-sm"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="h-48 w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <figcaption className="sr-only">{image.alt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Planes a medida</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Tres caminos para contar su historia</h2>
            <p className="mt-4 text-base text-muted-foreground">
              Cada plan mantiene el estilo elegante y el cuidado por los detalles que viste en nuestra invitación digital.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.title} className="flex h-full flex-col border-border/80 bg-background/90">
                <CardHeader>
                  <CardTitle className="font-serif text-[1.65rem] font-semibold leading-snug">{plan.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 text-sm">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-foreground">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 border-t border-dashed border-border/60 pt-4">
                  <p className="text-base font-medium text-foreground">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">{plan.note}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Cómo funciona</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
              Un proceso acompañado y transparente
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              Nos involucramos en cada etapa para que disfruten el proceso tanto como el resultado final.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-8 text-center shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background text-lg font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <h2 className="mt-5 font-serif text-3xl font-semibold sm:text-4xl">¿Listos para cotizar su sitio?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              Escríbenos y coordinemos una reunión breve para entender lo que imaginan. Les enviaremos una propuesta
              personalizada con alcances, tiempos y valores claros.
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
                <span className="hidden sm:inline text-muted-foreground">/</span>
                <a
                  href="mailto:debby.gutierrez.parra@gmail.com?subject=Cotizaci%C3%B3n%20sitio%20web%20de%20matrimonio"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  debby.gutierrez.parra@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
