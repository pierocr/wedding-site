"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Gift,
  Mail,
  Phone,
  Heart,
  ExternalLink,
  Banknote,
  CreditCard,
  Send,
  Stars,
  PartyPopper,
  Salad,
  Users,
  Image as ImageIcon,
  Music2,
  Camera,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Menu,
  X,
  Flame, Utensils, Home, Sparkles, CalendarCheck, Video, Play, Pause, Volume2, VolumeX,
} from "lucide-react";
import PayWithMPRedirect from "@/components/PayWithMPRedirect";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { createPortal } from "react-dom";
import { SpotifyEmbed } from "@/components/ui/SpotifyEmbed";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Story from "@/components/sections/Story";
import Gallery from "@/components/sections/Gallery";
import GiftSection from "@/components/sections/GiftSection";
import RSVPSection from "@/components/sections/RSVPSection";
import Timeline from '@/components/sections/Timeline';


/* ==============================
   ANIMATION PRESETS (Framer Motion)
============================== */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Fade + up
const REVEAL_UP = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Fade + desde la izquierda
const REVEAL_LEFT = {
  hidden: { opacity: 0, x: -40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

// Fade + desde la derecha
const REVEAL_RIGHT = {
  hidden: { opacity: 0, x: 40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

// Contenedor con "stagger" de hijos
const STAGGER = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

// Animaciones para los íconos del header de cada sección (loop sutil)
const ICON_ANIMS: Record<
  string,
  { animate: any; transition: { duration: number; repeat: number; repeatType?: "loop" | "mirror"; ease?: string } }
> = {
  agenda:   { animate: { rotate: [0, 6, -6, 0] },      transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" } },
  historia: { animate: { scale: [1, 1.08, 1] },        transition: { duration: 2.2, repeat: Infinity, repeatType: "mirror" } },
  galeria:  { animate: { y: [0, -3, 0] },              transition: { duration: 2.0, repeat: Infinity, repeatType: "mirror" } },
  regalo:   { animate: { y: [0, -5, 0], rotate: [0, -8, 8, 0] },
              transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  rsvp:     { animate: { scale: [1, 1.12, 1] },        transition: { duration: 2.0, repeat: Infinity, repeatType: "mirror" } },
  faq:      { animate: { rotate: [0, 10, -10, 0] },    transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" } },
};

// Fallback para secciones sin animación específica
const ICON_DEFAULT = { animate: { y: [0, -2, 0] }, transition: { duration: 2.2, repeat: Infinity, repeatType: "mirror" } };

/* ==============================
   CONFIG
============================== */
const WEDDING_DATE_ISO = process.env.NEXT_PUBLIC_EVENT_DATE ?? "2026-11-21";

const BRIDE = "Debby";
const GROOM = "Piero";

const CEREMONY = {
  datePretty: "Sábado 21 de noviembre de 2026",
  timePretty: "16:30 hrs",
  venue: "Iglesia Santa Ursula de Vitacura",
  venueAddress: "Vitacura, Chile",
  mapsUrl: "https://maps.app.goo.gl/Hsxztok7HaTwegmm7",
};

const RECEPTION = {
  venue: "Casona Santa Luz de Chicureo  ",
  venueAddress: "Chicureo, Santiago",
  mapsUrl: "https://maps.app.goo.gl/7u4oLZkD91fxuqdc7",
  startTime: "18:30 hrs",
};

const BANK_TRANSFER = {
  titular: "PIERO ALONSO CÉSPEDES",
  rut: "16.292.075-8",
  banco: "BCI",
  tipo: "Cuenta Corriente",
  numero: "32730098",
  email: "piero@gmail.com",
};

// Imágenes de muestra (Unsplash). Reemplázalas luego por archivos en /public
const GALLERY = [
  "/hero/1.jpg",
  "/hero/20240720_130310.jpg",
  "/hero/IMG-20230923-WA0054~2.jpg",
  "/hero/IMG-20231205-WA0010.jpg",
  "/hero/20231208_143753.jpg",
  "/hero/imagen6.jpeg",
  "/hero/IMG-20240214-WA0313.jpg",
  "/hero/IMG-20250816-WA0036.jpg",
];

/* ==============================
   HELPERS
============================== */
function useCountdown(targetISO: string) {
  const target = useMemo(() => new Date(`${targetISO}T00:00:00`), [targetISO]);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function currencyCLP(n: number) {
  return n.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

const Section = ({
  id,
  title,
  icon: Icon,
  children,
  animation = "up", // 👈 por defecto "up"
}: {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  animation?: "up" | "left" | "right";
}) => {
  const prefersReducedMotion = useReducedMotion();
  const MIcon = React.useMemo(() => motion(Icon as any), [Icon]);
  const iconAnim = ICON_ANIMS[id] ?? ICON_DEFAULT;

  // según el prop, elige el preset correcto
  const variantMap = {
    up: REVEAL_UP,
    left: REVEAL_LEFT,
    right: REVEAL_RIGHT,
  };
  const chosenVariant = variantMap[animation];

  return (
    <motion.section
      id={id}
      className="scroll-mt-24 py-8"
      aria-labelledby={`${id}-title`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={STAGGER}
    >
      <div className="mx-auto max-w-6xl px-4">
        <motion.div className="mb-4 flex items-center gap-3" variants={chosenVariant}>
          <MIcon
            className="h-6 w-6 text-primary"
            {...(!prefersReducedMotion ? { animate: iconAnim.animate, transition: iconAnim.transition } : {})}
          />
          <h2 id={`${id}-title`} className="font-serif text-2xl md:text-3xl font-semibold">
            {title}
          </h2>
        </motion.div>

        <motion.div variants={chosenVariant}>
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
};

/* ==============================
   UI SECTIONS
============================== */
// import { Menu, X } from "lucide-react";

const Nav = () => {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Estado del carrito para el badge
  const [cartQty, setCartQty] = React.useState(0);
  const [cartTotal, setCartTotal] = React.useState(0);
  const CART_KEY = "gift_cart";

  React.useEffect(() => setMounted(true), []);

  // Bloquea el scroll del body cuando el drawer está abierto
  React.useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  // Lee carrito desde localStorage
  const refreshFromStorage = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) {
        setCartQty(0);
        setCartTotal(0);
        return;
      }
      const arr = JSON.parse(raw) as Array<{ qty: number; unitPrice: number }>;
      const qty = Array.isArray(arr) ? arr.reduce((a, l) => a + (l?.qty || 0), 0) : 0;
      const total = Array.isArray(arr) ? arr.reduce((a, l) => a + (l?.qty || 0) * (l?.unitPrice || 0), 0) : 0;
      setCartQty(qty);
      setCartTotal(total);
    } catch {
      setCartQty(0);
      setCartTotal(0);
    }
  }, []);

  // Escucha: evento custom, cambio de storage (otras pestañas) y focus
  React.useEffect(() => {
    refreshFromStorage();
    const onCart = (e: Event) => {
      const detail = (e as CustomEvent<{ qty: number; total: number }>).detail;
      if (detail) {
        setCartQty(detail.qty);
        setCartTotal(detail.total);
      } else {
        refreshFromStorage();
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) refreshFromStorage();
    };
    window.addEventListener("gift:cart-changed", onCart as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshFromStorage);
    return () => {
      window.removeEventListener("gift:cart-changed", onCart as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshFromStorage);
    };
  }, [refreshFromStorage]);

  const links = [
    { href: "#agenda", label: "Agenda" },
    { href: "#historia", label: "Historia" },
    { href: "#galeria", label: "Galería" },
    { href: "#regalo", label: "Regalo" },
    { href: "#rsvp", label: "Confirmar asistencia" },
    { href: "#faq", label: "FAQ" },
    { href: "#musica", label: "Música" },
  ];

  const GiftButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    const hasItems = cartQty > 0;
    return (
      <a href="#regalo" aria-label={hasItems ? `Regalo (${cartQty} ítems)` : "Hacer regalo"}>
        <Button
          size="sm"
          variant={hasItems ? "default" : "secondary"}
          className={[
            "rounded-xl",
            fullWidth ? "w-full" : "",
            hasItems ? "bg-emerald-600 text-white hover:bg-emerald-700" : "",
          ].join(" ")}
        >
          <Gift className="mr-2 h-4 w-4" />
          {hasItems ? "Regalo" : "Hacer regalo"}
          {hasItems && (
            <>
              <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums bg-white/90 text-emerald-700">
                {cartQty}
              </span>
              <span className="ml-2 hidden sm:inline text-xs font-semibold tabular-nums">
                {currencyCLP(cartTotal)}
              </span>
            </>
          )}
        </Button>
      </a>
    );
  };

  return (
    <div className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <a href="#inicio" className="text-lg font-semibold">
          {BRIDE} & {GROOM}
        </a>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:underline">{l.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Botón regalo con badge */}
          <GiftButton />

          {/* Hamburguesa (solo mobile) */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-foreground/10 md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Drawer móvil */}
      {mounted &&
        createPortal(
          <div
            id="mobile-menu"
            className={`fixed inset-0 z-[9999] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <div
              className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity ${
                open ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside
              role="dialog"
              aria-modal="true"
              className={`fixed right-0 inset-y-0 w-[86%] max-w-[22rem]
                          transform transition-transform duration-200 ease-out
                          ${open ? "translate-x-0" : "translate-x-full"}
                          bg-white dark:bg-neutral-950 shadow-2xl border-l border-black/10
                          flex flex-col`}
            >
              <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="font-semibold">{BRIDE} & {GROOM}</span>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-foreground/10"
                  aria-label="Cerrar menú"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grow overflow-y-auto px-4 py-4">
                <nav className="space-y-1">
                  {links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
                    >
                      {l.label}
                    </a>
                  ))}
                </nav>

                <div className="mt-4">
                  <div onClick={() => setOpen(false)}>
                    <GiftButton fullWidth />
                  </div>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </div>
  );
};


const MiniCountdownBar = () => {
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_DATE_ISO);

  const targetDate = React.useMemo(() => new Date(`${WEDDING_DATE_ISO}T00:00:00`), []);
  const today = new Date();
  const isEventDay =
    today.getFullYear() === targetDate.getFullYear() &&
    today.getMonth() === targetDate.getMonth() &&
    today.getDate() === targetDate.getDate();

  const isOver = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

const Micro = ({ v, l }: { v: number; l: string }) => (
  <div className="flex items-baseline justify-center gap-1 rounded-md border border-white/60 bg-white/85 px-3 py-2 shadow-sm">
    <span className="text-[15px] md:text-lg font-extrabold text-foreground">{v}</span>
    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</span>
  </div>
);


  return (
    <div className="sticky top-16 z-40 hidden md:block">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-2 rounded-xl border border-black/5 bg-white/80 px-3 py-2 backdrop-blur-md shadow-sm">
          {isEventDay && !isOver ? (
            <div className="text-center text-sm font-medium text-foreground">
              🎉 <span className="font-semibold">¡Hoy es el gran día!</span> Nos vemos a las {CEREMONY.timePretty}.
            </div>
          ) : isOver ? (
            <div className="text-center text-sm font-medium text-foreground">
              💖 <span className="font-semibold">¡Gracias por acompañarnos!</span> Fue un día inolvidable.
            </div>
          ) : (
              <div className="flex items-center justify-center gap-2">
                <Micro v={days} l="D" />
                <Micro v={hours} l="H" />
                <Micro v={minutes} l="M" />
                <Micro v={seconds} l="S" />
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HERO_IMAGES = ["/hero/1.jpg"];

// === HERO (versión centrada, sin solaparse y sin altura excesiva en desktop) ===
const Hero = () => {
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_DATE_ISO);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Evita hydration mismatch del contador
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const safe = (n: number) => (hydrated ? n : 0);

  const TimerChip = ({ v, l }: { v: number; l: string }) => (
    <div className="flex items-baseline gap-1 rounded-2xl border border-white/20 bg-white/70 px-[clamp(8px,0.9vw,12px)] py-[clamp(5px,0.7vw,7px)] shadow-sm">
      <div
        className="tabular-nums font-extrabold leading-none tracking-tight text-[clamp(16px,2.1vw,20px)] text-black"
        suppressHydrationWarning
      >
        {safe(v)}
      </div>
      <div className="text-[clamp(9px,1.3vw,10px)] font-semibold text-black/85">{l}</div>
    </div>
  );

  return (
    <section className="relative isolate">
      {/* Fondo del héroe */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition: "center 35%" }}
          />
        ))}
        {/* Gradiente para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/10" />
      </div>

      {/* Títulos tipográficos */}
      <motion.div
        className="relative z-20 mx-auto max-w-7xl px-4
                   pt-[clamp(28px,6vh,80px)]
                   pb-[clamp(14px,3.5vh,36px)]
                   text-white"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={STAGGER}
      >
        <motion.div
          className="text-center text-[12px] uppercase tracking-[0.18em] text-white/80"
          variants={REVEAL_UP}
        >
          Nuestra boda <span className="ornament text-base text-white/70">❦</span>
        </motion.div>

        <motion.h1
          className="mt-2 text-center leading-none text-balance"
          variants={REVEAL_UP}
        >
          <span className="font-script text-[clamp(52px,8vw,102px)] [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">
            {BRIDE}
          </span>
          <span className="mx-[0.35em] align-baseline font-serif text-[clamp(30px,5vw,64px)] font-extrabold [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">
            &
          </span>
          <span className="font-script text-[clamp(52px,8vw,102px)] [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">
            {GROOM}
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-3 max-w-3xl text-center text-white/95 leading-snug text-[clamp(13px,1.8vw,17px)]"
          variants={REVEAL_UP}
        >
          ¡Nos casamos! Acompáñanos a celebrar este día especial.
        </motion.p>
      </motion.div>

      {/* DOCK EN-FLUJO (contador + fecha + botones) */}
      <motion.div
        className="relative z-30 mx-auto w-[min(100%,60rem)] px-4 mb-[clamp(12px,2vh,20px)]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={REVEAL_UP}
      >
        <div className="rounded-2xl border border-transparent bg-transparent">
          <div className="flex flex-wrap items-center justify-center gap-[clamp(8px,1vw,12px)] p-[clamp(8px,1.2vw,12px)]">
            {/* Contador */}
            <div className="flex flex-wrap items-center justify-center gap-[clamp(6px,0.9vw,10px)]">
              <TimerChip v={days} l="D" />
              <TimerChip v={hours} l="H" />
              <TimerChip v={minutes} l="M" />
              <TimerChip v={seconds} l="S" />
            </div>

            {/* Separador fino */}
            <div className="hidden md:block md:h-6 md:w-px bg-white/20 mx-1 md:mx-2" />

            {/* Fecha */}
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/70 px-3 py-2 text-[clamp(11px,1.5vw,13px)] text-black">
              <Calendar className="h-4 w-4" />
              {CEREMONY.datePretty}
            </div>

            {/* Botones */}
            <div className="w-full flex items-center justify-center gap-2 sm:gap-3 mt-[clamp(4px,0.8vw,8px)]">
              <a href="#regalo">
                <Button className="h-10 rounded-xl px-4 min-w-[clamp(7.5rem,15vw,11rem)]">
                  <Gift className="mr-2 h-4 w-4" />
                  Hacer Regalo
                </Button>
              </a>
              <a href="#rsvp">
                <Button
                  variant="secondary"
                  className="h-10 rounded-xl px-4 min-w-[clamp(7.5rem,15vw,11rem)] bg-white text-foreground hover:bg-white/90"
                >
                  Confirmar Asistencia
                </Button>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const Schedule = () => (
  <motion.div
    className="grid gap-6 md:grid-cols-3"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    variants={STAGGER}
  >
    {[
      {
        title: "Ceremonia",
        time: CEREMONY.timePretty,
        place: "Iglesia Santa Ursula de Vitacura",
        address: "Vitacura, Chile",
        link: CEREMONY.mapsUrl,
        image: "/hero/iglesia.png",
        icon: <Stars className="h-5 w-5" />,
      },
      {
        title: "Recepción",
        time: RECEPTION.startTime + " aproximadamente",
        place: RECEPTION.venue,
        address: RECEPTION.venueAddress,
        link: RECEPTION.mapsUrl,
        image: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrep9PlTGymrB71ciNzIX4DS3SvCNan1Bvvboch9myletQiBC1zRG6HAxHE4JdSdLqtPjaZ080bCSQCckLE_jKMBCEKtAifugERg9UnHqGjXhMhPB4tglC_4C7QDpgsjzoGdIlrmA=w289-h312-n-k-no",
        icon: <PartyPopper className="h-5 w-5" />,
      },
      {
        title: "Dress Code",
        time: "",
        place: "Elegante / Formal",
        address: "Ellas NO deben usar blanco ni tonos muy claros, eso déjenlo para la novia 😉",
        link: "#",
        image: "/hero/dress_code.png",
        icon: <Users className="h-5 w-5" />,
      },
    ].map((i, idx) => {
      const hasLink = i.link && i.link !== "#";
      const Wrapper: any = hasLink ? "a" : "div";
      const wrapperProps = hasLink
        ? {
            href: i.link,
            target: "_blank",
            rel: "noopener noreferrer",
            "aria-label": `Abrir en Google Maps: ${i.place}`,
            title: `Abrir en Google Maps: ${i.place}`,
          }
        : {};

      return (
        <motion.div key={i.title} variants={REVEAL_UP}>
          <Wrapper
            {...wrapperProps}
            className={`group block rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary ${
              hasLink ? "cursor-pointer" : ""
            }`}
          >
            <Card className="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
              {/* Imagen superior 16:9 con overlay */}
              <div className="relative overflow-hidden rounded-t-2xl">
                <div className="aspect-[16/9] w-full">
                  <img
                    src={i.image}
                    alt={`Imagen ${i.title}`}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0" />
                <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-foreground shadow">
                  {i.icon}
                  {i.title}
                </div>
              </div>

              {/* Contenido */}
              <CardContent className="space-y-2 pt-4">
                {i.time && (
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-1 inline h-4 w-4" />
                    {i.time}
                  </p>
                )}

                {/* Lugar y dirección: cuando la tarjeta es <a>, NO anidamos <a> */}
                {hasLink ? (
                  <>
                    <span className="font-medium inline-flex items-center gap-1 hover:underline underline-offset-4">
                      {i.place}
                      <ExternalLink className="h-4 w-4" />
                    </span>
                    <span className="block text-sm text-muted-foreground hover:underline underline-offset-4">
                      {i.address}
                    </span>
                  </>
                ) : (
                  <>
                    <p className="font-medium">{i.place}</p>
                    <p className="text-sm text-muted-foreground">{i.address}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </Wrapper>
        </motion.div>
      );
    })}
  </motion.div>
);

// 👉 FAQ (bloque completo: items + helper + componente + JSON-LD)

type FaqItem = { q: string; a: string }
type FaqSeoItem = { question: string; answer: string }

// JSON-LD: FAQPage
function SeoFaq({ items }: { items: FaqSeoItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: { '@type': 'Answer', text: it.answer },
    })),
  }

  return (
    <script
      type="application/ld+json"
      // Importante: el contenido debe coincidir con lo que se muestra en pantalla
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// 👉 Items del FAQ (usa exactamente los textos que muestras en la UI)
const FAQ_ITEMS: FaqItem[] = [
  {
    q: "👗 ¿Cuál es el código de vestimenta?",
    a: "Elegante/Formal. Por favor, evita el blanco o tonos muy claros. Eso se lo dejamos a la novia. Sugerimos un abrigo liviano para la tarde/noche."
  },
  {
    q: "📅 ¿Hasta cuándo puedo confirmar mi asistencia?",
    a: "Hasta el 22 de septiembre de 2026 (60 días antes) o lo antes posible para cerrar banquete y logística. Si necesitas más tiempo, cuéntanos y vemos cómo ayudarte. Puedes confirmar en la sección RSVP."
  },
  {
    q: "🅿️ ¿Hay estacionamientos disponibles?",
    a: "Sí, habrá estacionamientos en el lugar. Tanto en la iglesia como en el centro de eventos. Recomendamos compartir auto o usar apps de transporte para mayor comodidad."
  },
  {
    q: "🎁 ¿Cómo puedo hacer el regalo?",
    a: "En la sección “Regalo” podrás elegir un mensaje con Mercado Pago o usar los datos de transferencia. ¡El mejor regalo es que estés con nosotros!"
  },
  {
    q: "💳 ¿Puedo pagar en cuotas con tarjeta?",
    a: "Sí. Al pagar por Mercado Pago podrás seleccionar cuotas según tu banco y tarjeta, incluso podrás elegir cuotas sin interes dependiendo del banco (sujeto a condiciones de cada emisor)."
  },
  {
    q: "🥗 Tengo restricciones alimentarias",
    a: "¡Perfecto! Indícalas en el formulario RSVP (vegetariano, vegano, sin gluten o alergias) y lo coordinamos con el banquete."
  },
  {
    q: "📸 ¿Habrá fotógrafo? ¿Puedo llevar cámara?",
    a: "Sí, contaremos con fotógrafo y video. Puedes tomar fotos, solo te pedimos evitar flash durante la ceremonia y no bloquear el pasillo."
  },
  {
    q: "📤 ¿Cómo comparto mis fotos con ustedes?",
    a: "Usa el hashtag #BodaPieroDebby. Usaremos un codigo QR para que puedas compartir todas tus imagenes. ¡Nos encantará verlas!"
  },
]

// util para dividir en dos columnas equilibradas
const splitInTwo = <T,>(arr: T[]) => {
  const mid = Math.ceil(arr.length / 2)
  return [arr.slice(0, mid), arr.slice(mid)]
}

const FAQ = () => {
  const [left, right] = splitInTwo(FAQ_ITEMS)

  // Normaliza para el JSON-LD (debe coincidir con lo visible)
  const FAQ_FOR_SEO: FaqSeoItem[] = FAQ_ITEMS.map((it) => ({
    question: it.q,
    answer: it.a,
  }))

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-4 md:grid-cols-2">
        {[left, right].map((col, idx) => (
          <Accordion key={idx} type="multiple" className="w-full">
            {col.map((f, i) => (
              <AccordionItem
                key={i}
                value={`c${idx}-item-${i}`}
                className="mb-4 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm"
              >
                <AccordionTrigger className="px-5 py-4 text-left text-base md:text-lg font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 text-[15px] md:text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
      </div>

      {/* JSON-LD de FAQ: una sola vez por página/sección */}
      <SeoFaq items={FAQ_FOR_SEO} />
    </div>
  )
}


// ==============================
// MUSIC PLAYER — mini, derecha, autoplay 70% + ping al pausar
// ==============================
type MusicPlayerProps = { src: string; className?: string };

const MusicPlayer = ({ src, className = "" }: MusicPlayerProps) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false); // SSR seguro (inicia en false)

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.volume = 0.7; // 70%
    a.muted = false;
    a.preload = "auto";
    a.loop = true;
    (a as any).playsInline = true;


    // Intento de autoplay
    const tryPlay = () => a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    tryPlay();

    // Fallback: primer gesto del usuario
    const onFirstInteraction = () => {
      tryPlay();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      a.pause();
    };
  }, []);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  };

  return (
    <div
      className={[
        "fixed right-3 bottom-3 z-50", // 👈 esquina inferior derecha
        className,
      ].join(" ")}
    >
      <div className="relative isolate">
        {/* Ping sutil cuando está pausado */}
        {!playing && (
          <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/30 animate-ping" />
        )}

        <motion.button
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md ring-1 ring-border flex items-center justify-center"
          aria-label={playing ? "Pausar música" : "Reproducir música"}
          title={playing ? "Pausar" : "Reproducir"}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* audio real (oculto) */}
      <audio ref={audioRef} src={src} className="hidden" />
    </div>
  );
};

const Footer = () => (
  <footer className="mt-12 border-t py-10">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 md:flex-row">
      <div className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} {BRIDE} & {GROOM}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <a
          href="mailto:pierocr@gmail.com"
          className="inline-flex items-center gap-1 hover:underline"
        >
          <Mail className="h-4 w-4" />
          Contacto
        </a>
{/*         <a
          href="tel:+56912345678"
          className="inline-flex items-center gap-1 hover:underline"
        >
          <Phone className="h-4 w-4" />
          +56 9 1234 5678
        </a> */}
      </div>
    </div>
  </footer>
);

/* ==============================
   PAGE
============================== */
export default function WeddingSite() {
  return (
    <div className="min-h-screen">
      <Nav />
      {/* Mantener desactivado para evitar doble audio con Spotify */}
      <MusicPlayer src="/music/Sonreir.mp3" />
      {/* <MiniCountdownBar />   <= countdown fuera del Hero */}
      <div id="inicio">
        <Hero />
      </div>

      <Section id="agenda" title="Agenda" icon={Calendar} animation="up">
        <Schedule />
      </Section>

      {/* Banda color arena */}
      <div className="bg-secondary/40">
        <Section id="historia" title="Nuestra Historia" icon={Heart} animation="left">
          <Story />
        </Section>
      </div>

      <Section id="galeria" title="Galería" icon={ImageIcon}>
        <Gallery />
      </Section>

      {/* Banda con acento muy tenue para Regalo */}
      <div className="bg-accent/20">
        <Section id="regalo" title="Regalo" icon={Gift}>
          <GiftSection />
        </Section>
      </div>

      {/* RSVP en su propia sección */}
      <Section id="rsvp" title="Confirmar asistencia" icon={Heart}>
        <RSVPSection />
      </Section>
      
      <Section id="agenda" title="Programación" icon={Calendar} animation="up">
        <Timeline />
      </Section>

      <Section id="faq" title="Preguntas frecuentes" icon={Stars}>
        <FAQ />
      </Section>

      <Footer />
    </div>
  );
}
