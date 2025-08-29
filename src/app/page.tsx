"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  Flame, Utensils, Home, Sparkles, CalendarCheck, Video
} from "lucide-react";
import PayWithMPRedirect from "@/components/PayWithMPRedirect";
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
}: {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-24 py-16" aria-labelledby={`${id}-title`}>
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-8 flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <h2 id={`${id}-title`} className="font-serif text-2xl md:text-3xl font-semibold">
          {title}
        </h2>
      </div>
      {children}
    </div>
  </section>
);

/* ==============================
   UI SECTIONS
============================== */
// import { Menu, X } from "lucide-react";

const Nav = () => {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Bloquea el scroll del body cuando el drawer está abierto
  React.useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  const links = [
    { href: "#agenda", label: "Agenda" },
    { href: "#historia", label: "Historia" },
    { href: "#galeria", label: "Galería" },
    { href: "#regalo", label: "Regalo" },
    { href: "#rsvp", label: "Confirmar asistencia" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
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
          {/* Ahora visible también en mobile */}
          <a href="#regalo">
            <Button size="sm" variant="secondary">Hacer regalo</Button>
          </a>

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

      {/* Drawer móvil en PORTAL para salir del stacking del header/hero */}
      {mounted &&
        createPortal(
          <div
            id="mobile-menu"
            className={`fixed inset-0 z-[9999] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            {/* Overlay opaco */}
            <div
              className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity ${
                open ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setOpen(false)}
              aria-hidden
            />

            {/* Drawer derecho, sólido */}
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

                <a href="#regalo" onClick={() => setOpen(false)} className="mt-4 block">
                  <Button className="w-full">🎁 Hacer Regalo</Button>
                </a>
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

  // Medimos alto del dock (solo en XL cuando es absolute) para reservar espacio
  const dockRef = React.useRef<HTMLDivElement | null>(null);
  const [dockH, setDockH] = React.useState(0);
  const [isXL, setIsXL] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsXL("matches" in e ? (e as MediaQueryListEvent).matches : (e as MediaQueryList).matches);
    onChange(mql);
    mql.addEventListener?.("change", onChange as any);
    return () => mql.removeEventListener?.("change", onChange as any);
  }, []);

  React.useEffect(() => {
    if (!dockRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      setDockH(h);
    });
    ro.observe(dockRef.current);
    return () => ro.disconnect();
  }, [isXL]);

  const reservedPB = isXL ? Math.round(dockH + 12) : 0;

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
    <section className="relative isolate" style={isXL ? { paddingBottom: reservedPB } : undefined}>
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
        {/* Gradiente para legibilidad (sin blur) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/10" />
      </div>

      {/* Título / subtítulo (tipografías más contenidas) */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 pt-[clamp(34px,7.5vh,100px)] text-white">
        <h1 className="text-center font-serif font-extrabold leading-tight text-balance text-[clamp(32px,5.6vw,72px)]">
          {BRIDE} <span className="text-accent">&</span> {GROOM}
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-center text-white/95 leading-snug text-[clamp(13px,1.8vw,17px)]">
          ¡Nos casamos! Acompáñanos a celebrar este día especial.
        </p>
      </div>

      {/* DOCK TRANSPARENTE (compacto) */}
      <div
        ref={dockRef}
        className={[
          "relative mx-auto w-[min(100%,60rem)] px-4 mt-4",
          // En XL+: pegado al borde inferior de la foto, centrado
          "xl:absolute xl:left-1/2 xl:bottom-[clamp(10px,1.6vw,10px)] xl:-translate-x-1/2",
          "z-30",
        ].join(" ")}
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

            {/* Separador fino (solo si hay espacio) */}
            <div className="hidden md:block md:h-6 md:w-px bg-white/20 mx-1 md:mx-2" />

            {/* Fecha (pill ligera) */}
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/70 px-3 py-2 text-[clamp(11px,1.5vw,13px)] text-black">
              <Calendar className="h-4 w-4" />
              {CEREMONY.datePretty}
            </div>

{/* Botones – siempre en una fila aparte y centrados */}
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
      </div>
    </section>
  );
};



const Schedule = () => (
  <div className="grid gap-6 md:grid-cols-3">
    {[
      {
        title: "Ceremonia",
        time: CEREMONY.timePretty,
        place: "Iglesia Santa Ursula de Vitacura",
        address: "Vitacura, Chile",
        link: CEREMONY.mapsUrl,
        image:
          "https://comunavitacura.cl/wp-content/uploads/2024/08/colegio_santa_ursula.jpg",
        icon: <Stars className="h-5 w-5" />,
      },
      {
        title: "Recepción",
        time: RECEPTION.startTime + " aproximadamente",
        place: RECEPTION.venue,
        address: RECEPTION.venueAddress,
        link: RECEPTION.mapsUrl,
        image: "/hero/santa_luz.jpg",
        icon: <PartyPopper className="h-5 w-5" />,
      },
      {
        title: "Código de vestimenta",
        time: "",
        place: "Elegante / Formal",
        address: "Mujeres NO utilizar color blanco o muy claros",
        link: "#",
        image:
          "/hero/dress_code.jpg",
        icon: <Users className="h-5 w-5" />,
      },
    ].map((i) => {
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
        <Wrapper
          key={i.title}
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
      );
    })}
  </div>
);

// ===========================
// NUESTRA HISTORIA (simple) + VIDEO
// ===========================
const Story = () => {
  // Video YouTube embebido
  const YT_EMBED = "https://www.youtube.com/embed/CisTs-tueAU";

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      {/* Texto */}
      <div className="space-y-4 leading-relaxed text-foreground/90">
        <p>Queremos compartir la historia de cómo comenzó todo con Piero.</p>

        <p>
          Nos conocimos trabajando, algo que ninguno de los dos esperaba. Cada cruce en los pasillos bastaba
          para sonrojarnos con solo mirarnos… hasta que un día dijimos “sí” a salir juntos, y desde entonces
          nuestras vidas cambiaron para siempre.
        </p>

        <p>
          El <span className="font-medium">16 de agosto de 2025</span>, en medio de la magia de{" "}
          <span className="font-medium">Bariloche</span>, Piero me pidió matrimonio. Un “sí” lleno de amor y
          emoción que hoy nos lleva a dar el paso más importante de nuestras vidas.
        </p>

        <p>
          Han sido años maravillosos: viajes, aventuras, experiencias inolvidables, la creación de un hogar y
          momentos que atesoramos con el corazón.
        </p>

        <p>
          Ahora queremos invitarte a compartir esta felicidad con nosotros y a acompañarnos en este gran día.{" "}
          <span className="font-medium">¡Nos vemos el 21 de noviembre de 2026!</span>
        </p>
      </div>

      {/* Video */}
      <div className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-sm">
          <iframe
            src={YT_EMBED}
            title="Nuestra historia"
            className="absolute inset-0 h-full w-full"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Sugerencia: usa un video horizontal (16:9) para que luzca perfecto.
        </p>
      </div>
    </div>
  );
};

const Gallery = () => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number>(0);

  const total = GALLERY.length;
  const src = GALLERY[index];

  // Navegación
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  // ====== ZOOM & PAN ======
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ dragging: boolean; startX: number; startY: number; origX: number; origY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // Reset zoom al abrir/cambiar foto/cerrar
  useEffect(() => {
    if (!open) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [open, index]);

  // Teclas
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Util: limita el arrastre para que no se salga “demasiado”
  const clampOffset = (nx: number, ny: number, s: number) => {
    const el = containerRef.current;
    if (!el) return { x: nx, y: ny };
    const { clientWidth: cw, clientHeight: ch } = el;
    // margen visible cuando haces pan (aprox)
    const maxX = (cw * (s - 1)) / 2;
    const maxY = (ch * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  };

  // Click / tap para alternar zoom
  const toggleZoom = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    if (scale === 1) {
      // calcula centro relativo para que el zoom se enfoque donde clicaste
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const newScale = 2.5;
      const nx = -cx * (newScale - 1) / newScale;
      const ny = -cy * (newScale - 1) / newScale;
      const lim = clampOffset(nx, ny, newScale);
      setScale(newScale);
      setOffset(lim);
    } else {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  // Rueda para zoom incremental
  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;

    const delta = -e.deltaY; // arriba = zoom in
    const factor = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.max(1, Math.min(4, scale * factor));

    // ajustar offset para “acercar hacia el cursor”
    const nx = (offset.x - mx) * (newScale / scale) + mx;
    const ny = (offset.y - my) * (newScale / scale) + my;
    const lim = clampOffset(nx, ny, newScale);

    setScale(newScale);
    setOffset(lim);
  };

  // Arrastrar cuando esté con zoom
  const onPointerDown: React.PointerEventHandler = (e) => {
    if (scale === 1) return;
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.origX = offset.x;
    dragRef.current.origY = offset.y;
  };
  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const lim = clampOffset(dragRef.current.origX + dx, dragRef.current.origY + dy, scale);
    setOffset(lim);
  };
  const onPointerUp: React.PointerEventHandler = (e) => {
    if (!dragRef.current.dragging) return;
    const el = e.currentTarget as HTMLDivElement;
    el.releasePointerCapture(e.pointerId);
    dragRef.current.dragging = false;
  };

  return (
    <>
      {/* Grid de miniaturas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {GALLERY.map((img, i) => (
          <button
            key={img + i}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={img}
              alt={`Foto ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            <div className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-xs text-foreground shadow">
              <Camera className="h-4 w-4" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[92vw] border-0 bg-black/90 p-2 sm:max-w-5xl">
          <div className="relative">
            <div
              ref={containerRef}
              className={`mx-auto flex max-h-[80vh] w-full select-none items-center justify-center overflow-hidden rounded-lg bg-black/20 ${
                scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
              }`}
              onDoubleClick={toggleZoom}
              onClick={(e) => {
                // en móvil, un solo tap alterna zoom
                if (window.matchMedia("(hover: none)").matches) toggleZoom(e as any);
              }}
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <img
                src={src}
                alt={`Foto grande ${index + 1}`}
                className="pointer-events-none max-h-[80vh] w-auto select-none"
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                  transition: dragRef.current.dragging ? "none" : "transform 150ms ease-out",
                  willChange: "transform",
                }}
                draggable={false}
              />
            </div>

            {/* Cerrar */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
              aria-label="Cerrar"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {/* Controles izq/der */}
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
                  aria-label="Anterior"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
                  aria-label="Siguiente"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Indicador */}
            <div className="mt-3 text-center text-xs text-white/80">
              {index + 1} / {total}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

<Section id="musica" title="Nuestra música" icon={Music2}>
  <div className="grid gap-6 md:grid-cols-2">
    <SpotifyEmbed
      title="Playlist oficial de la boda"
      url="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
    />
    <SpotifyEmbed
      title="Primera danza (demo)"
      url="https://open.spotify.com/track/5nTtCOCds6I0PHMNtqelas"
    />
  </div>
  <p className="mt-4 text-sm text-muted-foreground">
    ¿Tienes una canción que no puede faltar? Déjala en el formulario RSVP o
    envíanosla por WhatsApp 🎵
  </p>
</Section>

// =========================
// REGALO - MENSAJES CON PRECIO + MERCADO PAGO
// =========================
const GiftSection = () => {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
  const CURRENCY = "CLP";

  // Mensajes creativos (mientras más profundo, mayor precio)
  const OPTIONS = [
    { id: "abrazo",    emoji: "🤗", label: "Un abrazo apretado",            price: 30000 },
    { id: "brindis",   emoji: "🥂", label: "Brindis por nuestro siempre",   price: 40000 },
    { id: "desayuno",  emoji: "🥞", label: "Desayuno en la cama",           price: 50000 },
    { id: "picnic",    emoji: "🧺", label: "Tarde de picnic",               price: 60000 },
    { id: "ramo",      emoji: "💐", label: "Mil flores para ti",            price: 70000 },
    { id: "cena",      emoji: "🍽️", label: "Cena romántica",               price: 75000 },
    { id: "spa",       emoji: "💆", label: "Día de spa",                    price: 80000 },
    { id: "aventura",  emoji: "🎢", label: "Aventura sorpresa",             price: 100000 },
    { id: "finde",     emoji: "🏖️", label: "Fin de semana soñado",         price: 130000 },
    { id: "viaje",     emoji: "✈️", label: "Empujoncito para el viaje",     price: 200000 },
    { id: "felicidad", emoji: "💖", label: "Un matrimonio feliz",           price: 350000 },
    { id: "vida",      emoji: "♾️", label: "Una vida entera juntos",        price: 600000 },
  ] as const;

  const [selected, setSelected] = React.useState<typeof OPTIONS[number]["id"] | "custom">("abrazo");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [customMsg, setCustomMsg] = React.useState("");
  const [customAmount, setCustomAmount] = React.useState<number | "">("");
  const [loading, setLoading] = React.useState(false);

  const current = selected === "custom"
    ? { title: customMsg.trim() || "Mensaje personalizado", amount: Number(customAmount || 0) }
    : (() => {
        const o = OPTIONS.find((x) => x.id === selected)!;
        return { title: `${o.emoji} ${o.label}`, amount: o.price };
      })();

const priceFmt = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

  async function pay() {
    // Validaciones mínimas
    if (!name.trim()) {
      alert("Por favor ingresa tu nombre 💌");
      return;
    }
    if (selected === "custom") {
      if (!customMsg.trim()) return alert("Escribe tu mensaje personalizado.");
      if (!customAmount || Number(customAmount) <= 0) return alert("Ingresa un monto válido.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          title: current.title,
          amount: current.amount,
          currency: CURRENCY,
          siteUrl: SITE_URL,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando preferencia");
      // Redirección a Checkout Pro
      window.location.href = data.init_point;
    } catch (e: any) {
      console.error(e);
      alert("No pudimos iniciar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif">
          <Gift className="h-5 w-5" /> Regalos con mensaje
        </CardTitle>
        <CardDescription>
          El mejor regalo es tu presencia. Si quieres dejarnos un detalle, elige un mensaje con sentido
          (o crea el tuyo) y realiza el aporte por Mercado Pago. 💖
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selección de mensajes */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {OPTIONS.map((o) => {
            const active = selected === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o.id)}
                className={`rounded-xl border p-3 text-left transition shadow-sm
                  ${active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "hover:bg-muted/40"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-lg">{o.emoji}</div>
                  <div className="text-sm font-semibold">{priceFmt(o.price)}</div>
                </div>
                <div className="mt-1 font-medium">{o.label}</div>
              </button>
            );
          })}

          {/* Opción personalizada */}
          <div className={`rounded-xl border p-3 shadow-sm ${selected === "custom" ? "border-primary ring-2 ring-primary/30 bg-primary/5" : ""}`}>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="gift-msg"
                checked={selected === "custom"}
                onChange={() => setSelected("custom")}
              />
              <span className="font-medium">Mensaje y monto personalizados</span>
            </label>
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Tu mensaje (ej: Un momento inolvidable)"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                disabled={selected !== "custom"}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Monto</span>
                <Input
                  type="number"
                  className="w-40"
                  min={1000}
                  step={1000}
                  placeholder="10000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={selected !== "custom"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Datos del regalante */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Tu nombre (obligatorio)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Carolina Pérez" />
          </div>
          <div>
            <label className="text-sm font-medium">Email (opcional)</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.cl" />
          </div>
        </div>

        <Separator />

        {/* Resumen + pago */}
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="text-sm">
            <div className="font-medium">Seleccionado:</div>
            <div className="text-muted-foreground">
              {current.title} · <span className="font-semibold">{priceFmt(current.amount)}</span>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-rose-500 text-white hover:bg-rose-600 shadow-lg"
            onClick={pay}
            disabled={loading}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {loading ? "Conectando a Mercado Pago…" : "Pagar con Mercado Pago"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- RSVP (solo esta sección) ---
const RSVPSection = () => {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif">
          <Heart className="h-5 w-5" /> Confirmar asistencia (RSVP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Nombre completo</label>
            <Input placeholder="Ej: Juanita González" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="nombre@correo.cl" />
          </div>
          <div>
            <label className="text-sm font-medium">Teléfono</label>
            <Input type="tel" placeholder="+56 9 1234 5678" />
          </div>
          <div>
            <label className="text-sm font-medium">Asistiré</label>
            <select className="h-10 w-full rounded-md border bg-background px-3">
              <option>Sí, allí estaré</option>
              <option>Lo siento, no podré</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Acompañantes</label>
            <Input type="number" min={0} defaultValue={0} />
          </div>
          <div>
            <label className="text-sm font-medium">Restricciones alimentarias</label>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="cursor-default">
                <Salad className="mr-1 h-3 w-3" />
                Vegetariano
              </Badge>
              <Badge variant="secondary" className="cursor-default">Vegano</Badge>
              <Badge variant="secondary" className="cursor-default">Sin gluten</Badge>
              <Badge variant="secondary" className="cursor-default">Alergias</Badge>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Mensaje para los novios (opcional)</label>
            <Textarea rows={3} placeholder="Escribe un mensajito lindo…" />
          </div>
        </div>
        <Button size="lg" className="w-full md:w-auto">
          <Send className="mr-2 h-4 w-4" />
          Enviar confirmación
        </Button>
        <p className="text-xs text-muted-foreground">
          * En la versión real esto guarda en DB (Supabase) y dispara email de confirmación.
        </p>
      </CardContent>
    </Card>
  );
};

// 👉 Agrega/edita aquí tus preguntas y respuestas
const FAQ_ITEMS = [
  { q: "¿Puedo llevar niños?", a: "¡Claro! Indícanos en el RSVP la edad y si requieren silla o menú infantil para considerarlo en el banquete." },
  { q: "¿Cuál es el código de vestimenta?", a: "Elegante/Formal. Sugerimos colores claros y abrigos livianos para la tarde/noche." },
  { q: "¿Hasta cuándo puedo confirmar mi asistencia?", a: "Idealmente hasta 60 días antes del evento para cerrar banquete y logística. Si necesitas más tiempo, escríbenos." },
  { q: "¿Hay estacionamientos disponibles?", a: "Sí, en el lugar del evento habrá estacionamientos limitados. Recomendamos compartir auto o usar apps de transporte." },
  { q: "¿Habrá transporte de acercamiento?", a: "Si hay suficiente demanda, coordinaremos vans desde puntos clave. Avisaremos por email con horarios y paradas." },
  { q: "¿Cómo puedo hacer el regalo?", a: "En la sección “Regalo” puedes ver datos de transferencia o pagar con tarjeta. También puedes dejar un mensaje para nosotros." },
  { q: "¿Puedo pagar en cuotas con tarjeta?", a: "Sí. Al pagar con Mercado Pago (en la versión final) podrás elegir cuotas disponibles según tu banco/tarjeta." },
  { q: "Tengo restricciones alimentarias", a: "¡Ningún problema! Indícalo en el RSVP (vegetariano, vegano, sin gluten o alergias) para informarlo al banquete." },
  { q: "¿Habrá fotógrafo? ¿Puedo llevar cámara?", a: "Sí, habrá fotógrafo y video. Puedes tomar fotos, solo te pedimos no usar flash durante la ceremonia." },
  { q: "¿Cómo comparto mis fotos con ustedes?", a: "Usa el hashtag #BodaPieroDebby o el link que enviaremos por email después del evento." },
  { q: "¿Habrá transmisión en vivo?", a: "Estamos evaluándolo. Si la hacemos, enviaremos el link unos días antes por email." },
  { q: "Voy desde otra ciudad, ¿alguna recomendación de hotel?", a: "Sí, tenemos un listado de hoteles cercanos. Escríbenos y te lo compartimos con tarifas y distancias." },
];

// util para dividir en dos columnas equilibradas
const splitInTwo = <T,>(arr: T[]) => {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
};

const FAQ = () => {
  const [left, right] = splitInTwo(FAQ_ITEMS);
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-4 md:grid-cols-2">
        {[left, right].map((col, idx) => (
          <Accordion
            key={idx}
            type="multiple"
            className="w-full"
          >
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
          href="mailto:piero@example.cl"
          className="inline-flex items-center gap-1 hover:underline"
        >
          <Mail className="h-4 w-4" />
          Contacto
        </a>
        <a
          href="tel:+56912345678"
          className="inline-flex items-center gap-1 hover:underline"
        >
          <Phone className="h-4 w-4" />
          +56 9 1234 5678
        </a>
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
      {/* <MiniCountdownBar />   <= nuevo: countdown fuera del Hero */}
      <div id="inicio">
        <Hero />
      </div>
      <Section id="agenda" title="Agenda del día" icon={Calendar}>
        <Schedule />
      </Section>
{/* Banda color arena */}
<div className="bg-secondary/40">
  <Section id="historia" title="Nuestra historia" icon={Heart}>
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
<Section id="rsvp" title="Confirmar asistencia (RSVP)" icon={Heart}>
  <RSVPSection />
</Section>
      
      
      <Section id="faq" title="Preguntas frecuentes" icon={Stars}>
        <FAQ />
      </Section>
      <Footer />
    </div>
  );
}
