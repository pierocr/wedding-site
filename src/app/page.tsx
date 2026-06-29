"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Calendar,
  Clock,
  Gift,
  Mail,
  Heart,
  ExternalLink,
  Stars,
  PartyPopper,
  Users,
  Image as ImageIcon,
  Menu,
  X,
  CalendarCheck,
  Play,
  Pause,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { createPortal } from "react-dom";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Story from "@/components/sections/Story";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import {
  BRIDE,
  GROOM,
  CEREMONY,
  RECEPTION,
  WEDDING_DATE_ISO,
  BANK_TRANSFER,
  FEATURE_FLAGS,
} from "@/data/site";
import { LockedOverlay } from "@/components/ui/LockedOverlay";
import { trackEvent, trackPageView } from "@/lib/analytics";

/* ==============================
   ANIMATION PRESETS (Framer Motion)
============================== */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Fade + up
const REVEAL_UP = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Fade + desde la izquierda
const REVEAL_LEFT = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

// Fade + desde la derecha
const REVEAL_RIGHT = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
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
  {
    animate: any;
    transition: {
      duration: number;
      repeat: number;
      repeatType?: "loop" | "mirror";
      ease?: string;
    };
  }
> = {
  agenda: {
    animate: { rotate: [0, 6, -6, 0] },
    transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
  },
  historia: {
    animate: { scale: [1, 1.08, 1] },
    transition: { duration: 2.2, repeat: Infinity, repeatType: "mirror" },
  },
  galeria: {
    animate: { y: [0, -3, 0] },
    transition: { duration: 2.0, repeat: Infinity, repeatType: "mirror" },
  },
  regalo: {
    animate: { y: [0, -5, 0], rotate: [0, -8, 8, 0] },
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
  rsvp: {
    animate: { scale: [1, 1.12, 1] },
    transition: { duration: 2.0, repeat: Infinity, repeatType: "mirror" },
  },
  faq: {
    animate: { rotate: [0, 10, -10, 0] },
    transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
  },
};

// Fallback para secciones sin animación específica
const ICON_DEFAULT = {
  animate: { y: [0, -2, 0] },
  transition: { duration: 2.2, repeat: Infinity, repeatType: "mirror" },
};

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
  const MIcon = React.useMemo(
    () => motion.create(Icon as React.ComponentType<any>),
    [Icon],
  );
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
      className="scroll-mt-6 py-8 md:scroll-mt-24"
      aria-labelledby={`${id}-title`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={STAGGER}
    >
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="mb-4 flex items-center gap-3"
          variants={chosenVariant}
        >
          <MIcon
            className="h-6 w-6 text-primary"
            {...(!prefersReducedMotion
              ? { animate: iconAnim.animate, transition: iconAnim.transition }
              : {})}
          />
          <h2 id={`${id}-title`} className="text-2xl font-semibold md:text-3xl">
            {title}
          </h2>
        </motion.div>

        <motion.div variants={chosenVariant}>{children}</motion.div>
      </div>
    </motion.section>
  );
};

const SectionSkeleton = ({
  label,
  rows = 3,
}: {
  label: string;
  rows?: number;
}) => (
  <div
    className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm"
    role="status"
    aria-live="polite"
  >
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-3.5 w-full animate-pulse rounded-full bg-muted/70"
          style={{ opacity: 1 - idx * 0.15 }}
        />
      ))}
    </div>
  </div>
);

const LazySectionBoundary = ({
  children,
  fallback,
  rootMargin = "320px",
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  rootMargin?: string;
}) => {
  const { ref, visible } = useInViewOnce<HTMLDivElement>({
    rootMargin,
    threshold: 0.2,
  });
  return <div ref={ref}>{visible ? children : fallback}</div>;
};

const LazyGallery = dynamic(() => import("@/components/sections/Gallery"), {
  loading: () => <SectionSkeleton label="Cargando galería…" rows={6} />,
});

const LazyGiftSection = dynamic(
  () => import("@/components/sections/GiftSection"),
  {
    loading: () => (
      <SectionSkeleton label="Cargando formulario de regalos…" rows={5} />
    ),
  },
);

const LazyRSVPSection = dynamic(
  () => import("@/components/sections/RSVPSection"),
  {
    loading: () => (
      <SectionSkeleton label="Preparando formulario de confirmación de asistencia…" rows={5} />
    ),
  },
);

const LazyTimeline = dynamic(() => import("@/components/sections/Timeline"), {
  loading: () => <SectionSkeleton label="Cargando timeline…" rows={4} />,
});

/* ==============================
   UI SECTIONS
============================== */
// import { Menu, X } from "lucide-react";
// === NAV solo con íconos neutros (sin emojis) ===
const Nav = () => {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Estado del carrito para el badge
  const [cartQty, setCartQty] = React.useState(0);
  const [cartTotal, setCartTotal] = React.useState(0);
  const scrollCorrectionTimersRef = React.useRef<number[]>([]);
  const CART_KEY = "gift_cart";

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  const refreshFromStorage = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return (setCartQty(0), setCartTotal(0));
      const arr = JSON.parse(raw) as Array<{ qty: number; unitPrice: number }>;
      const qty = Array.isArray(arr)
        ? arr.reduce((a, l) => a + (l?.qty || 0), 0)
        : 0;
      const total = Array.isArray(arr)
        ? arr.reduce((a, l) => a + (l?.qty || 0) * (l?.unitPrice || 0), 0)
        : 0;
      setCartQty(qty);
      setCartTotal(total);
    } catch {
      setCartQty(0);
      setCartTotal(0);
    }
  }, []);

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
    const onStorage = (e: StorageEvent) =>
      e.key === CART_KEY && refreshFromStorage();
    window.addEventListener("gift:cart-changed", onCart as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshFromStorage);
    return () => {
      window.removeEventListener("gift:cart-changed", onCart as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshFromStorage);
    };
  }, [refreshFromStorage]);

  // Ítems del menú (solo íconos lucide, sin emojis)
  const links: Array<{
    href: string;
    label: string;
    Icon: React.ComponentType<any>;
  }> = [
    { href: "#agenda", label: "Agenda", Icon: Calendar },
    { href: "#historia", label: "Historia", Icon: Heart },
    { href: "#galeria", label: "Galería", Icon: ImageIcon },
    { href: "#regalo", label: "Regalo", Icon: Gift },
    { href: "#rsvp", label: "Confirmar asistencia", Icon: CalendarCheck },
    { href: "#programacion", label: "Programación", Icon: Clock },
    { href: "#faq", label: "Preguntas frecuentes", Icon: HelpCircle },
  ];

  const scrollToSection = React.useCallback(
    (href: string, behavior: ScrollBehavior = "smooth") => {
      if (typeof window === "undefined") return;

      const id = href.replace("#", "");
      const target = document.getElementById(id);
      if (!target) return;

      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      const headerHeight = isDesktop
        ? (document.querySelector("header")?.getBoundingClientRect().height ??
          0)
        : 0;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;

      window.scrollTo({ top: Math.max(0, targetTop), behavior });
    },
    [],
  );

  const clearScrollCorrections = React.useCallback(() => {
    scrollCorrectionTimersRef.current.forEach((timer) =>
      window.clearTimeout(timer),
    );
    scrollCorrectionTimersRef.current = [];
  }, []);

  const handleAnchorClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      event.preventDefault();
      setOpen(false);
      clearScrollCorrections();

      window.history.pushState(null, "", href);
      trackPageView(`${window.location.pathname}${window.location.search}${href}`);
      requestAnimationFrame(() => scrollToSection(href, "auto"));

      const cancelOnUserScroll = () => clearScrollCorrections();
      window.addEventListener("wheel", cancelOnUserScroll, {
        once: true,
        passive: true,
      });
      window.addEventListener("touchmove", cancelOnUserScroll, {
        once: true,
        passive: true,
      });
      window.addEventListener("keydown", cancelOnUserScroll, { once: true });
      window.addEventListener("pointerdown", cancelOnUserScroll, {
        once: true,
        passive: true,
      });
      window.setTimeout(() => {
        window.addEventListener("scroll", cancelOnUserScroll, {
          once: true,
          passive: true,
        });
      }, 250);

      // Las secciones lazy pueden cambiar la altura de la página al cargar.
      scrollCorrectionTimersRef.current = [400, 1000, 1800, 2800].map((delay) =>
        window.setTimeout(() => scrollToSection(href, "auto"), delay),
      );
    },
    [clearScrollCorrections, scrollToSection],
  );

  const GiftButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    const hasItems = cartQty > 0;
    return (
      <a
        href="#regalo"
        aria-label={hasItems ? `Regalo (${cartQty} ítems)` : "Haz tu regalo"}
        onClick={(event) => {
          trackEvent("gift_info_click", {
            location: fullWidth ? "mobile_nav" : "desktop_nav",
            destination: "#regalo",
          });
          handleAnchorClick(event, "#regalo");
        }}
      >
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
          {hasItems ? "Regalo" : "Haz tu regalo"}
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
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a
          href="#inicio"
          className="shrink-0 text-lg font-semibold"
          onClick={(event) => handleAnchorClick(event, "#inicio")}
        >
          {GROOM} & {BRIDE}
        </a>

        {/* Desktop */}
        <nav
          aria-label="Secciones principales"
          className="hidden items-center gap-4 text-[13px] lg:gap-6 lg:text-sm md:flex"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:underline"
              onClick={(event) => handleAnchorClick(event, l.href)}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <GiftButton />
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-foreground/10 md:hidden"
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
              className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              className={`fixed right-0 inset-y-0 w-[86%] max-w-[22rem]
                          transform transition-transform duration-200 ease-out
                          ${open ? "translate-x-0" : "translate-x-full"}
                          bg-white dark:bg-neutral-950 shadow-2xl border-l border-black/10
                          flex flex-col`}
            >
              <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="font-semibold">
                  {GROOM} & {BRIDE}
                </span>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-foreground/10"
                  aria-label="Cerrar menú"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Contenido scrollable */}
              <div className="grow overflow-y-auto px-2 py-3">
                <nav className="space-y-1" aria-label="Enlaces de sección">
                  {links.map(({ href, label, Icon }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={(event) => handleAnchorClick(event, href)}
                      className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <div className="flex items-center justify-between px-3 py-3 hover:bg-muted rounded-xl">
                        <div className="flex items-center gap-3">
                          {/* pill con icono neutro */}
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                            <Icon className="h-4 w-4 text-foreground/70" />
                          </span>

                          {/* etiqueta */}
                          <span className="text-base font-medium">
                            {label}
                            {href === "#regalo" && cartQty > 0 && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                {cartQty}
                              </span>
                            )}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </a>
                  ))}
                </nav>
              </div>

              {/* CTA fijo al pie */}
              <div className="sticky bottom-0 z-10 border-t bg-gradient-to-t from-background via-background to-background/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <GiftButton fullWidth />
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </header>
  );
};

const MiniCountdownBar = () => {
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_DATE_ISO);

  const targetDate = React.useMemo(
    () => new Date(`${WEDDING_DATE_ISO}T00:00:00`),
    [],
  );
  const today = new Date();
  const isEventDay =
    today.getFullYear() === targetDate.getFullYear() &&
    today.getMonth() === targetDate.getMonth() &&
    today.getDate() === targetDate.getDate();

  const isOver = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  const Micro = ({ v, l }: { v: number; l: string }) => (
    <div className="flex items-baseline justify-center gap-1 rounded-md border border-white/60 bg-white/85 px-3 py-2 shadow-sm">
      <span className="text-[15px] md:text-lg font-extrabold text-foreground">
        {v}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {l}
      </span>
    </div>
  );

  return (
    <div className="sticky top-16 z-40 hidden md:block">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-2 rounded-xl border border-black/5 bg-white/80 px-3 py-2 backdrop-blur-md shadow-sm">
          {isEventDay && !isOver ? (
            <div className="text-center text-sm font-medium text-foreground">
              🎉 <span className="font-semibold">¡Hoy es el gran día!</span> Nos
              vemos a las {CEREMONY.timePretty}.
            </div>
          ) : isOver ? (
            <div className="text-center text-sm font-medium text-foreground">
              💖{" "}
              <span className="font-semibold">¡Gracias por acompañarnos!</span>{" "}
              Fue un día inolvidable.
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

const HERO_IMAGES = ["/hero/1.webp"];
// Estas fotos deben exportarse manualmente como WebP/AVIF (<200KB) antes de cada despliegue para sostener un LCP rápido.

// === HERO (versión centrada, sin solaparse y sin altura excesiva en desktop) ===
const Hero = () => {
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_DATE_ISO);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % HERO_IMAGES.length),
      6000,
    );
    return () => clearInterval(t);
  }, []);

  // Evita hydration mismatch del contador
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const TimerChip = ({ v, l }: { v: number; l: string }) => (
    <div className="flex items-baseline gap-1 rounded-2xl border border-white/20 bg-white/70 px-[clamp(8px,0.9vw,12px)] py-[clamp(5px,0.7vw,7px)] shadow-sm">
      <div
        className="tabular-nums font-extrabold leading-none tracking-tight text-[clamp(16px,2.1vw,20px)] text-black"
        suppressHydrationWarning
      >
        {hydrated ? v : "--"}
      </div>
      <div className="text-[clamp(9px,1.3vw,10px)] font-semibold text-black/85">
        {l}
      </div>
    </div>
  );

  return (
    <section className="relative isolate">
      {/* Fondo del héroe */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`Fotografía de ${GROOM} y ${BRIDE}`}
            fill
            priority={i === 0}
            className={`object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition: "center 35%" }}
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        ))}
        {/* Gradiente para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/25" />
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
          Nuestra boda
        </motion.div>

        <motion.h1
          className="mt-2 text-center leading-none text-balance"
          variants={REVEAL_UP}
        >
          <span className="font-script text-[clamp(52px,8vw,102px)] [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">
            {GROOM}
          </span>
          <span className="mx-[0.35em] align-baseline font-sans text-[clamp(30px,5vw,64px)] font-extrabold [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">
            &
          </span>
          <span className="font-script text-[clamp(52px,8vw,102px)] [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">
            {BRIDE}
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
          <LockedOverlay
            isLocked={!FEATURE_FLAGS.eventDetailsVisible}
            title="Próximamente"
            description="La fecha y hora exactas se revelarán pronto"
          >
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
              <div className="mt-[clamp(4px,0.8vw,8px)] flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
                <Button
                  asChild
                  className="h-12 w-full rounded-xl bg-[#315640] px-5 font-bold text-white shadow-[0_12px_30px_rgba(31,74,56,0.35)] hover:bg-[#284835] sm:w-auto sm:min-w-[clamp(13rem,24vw,15rem)]"
                >
                  <a
                    href="#rsvp"
                    className="text-center no-underline hover:no-underline"
                    onClick={() =>
                      trackEvent("rsvp_click", {
                        location: "hero",
                        destination: "#rsvp",
                      })
                    }
                  >
                    Confirmar Asistencia
                  </a>
                </Button>
                <Button
                  asChild
                  className="h-12 w-full rounded-xl border border-white/70 bg-[#f4efe6] px-5 font-bold text-[#241f18] shadow-[0_14px_34px_rgba(244,239,230,0.3)] ring-1 ring-black/10 hover:bg-[#fffaf1] sm:w-auto sm:min-w-[clamp(12rem,20vw,14rem)]"
                >
                  <a
                    href="#regalo"
                    className="text-center no-underline hover:no-underline"
                    onClick={() =>
                      trackEvent("gift_info_click", {
                        location: "hero",
                        destination: "#regalo",
                      })
                    }
                  >
                    <Gift className="h-4 w-4" />
                    Haz tu regalo
                  </a>
                </Button>
              </div>
            </div>
          </LockedOverlay>
        </div>
      </motion.div>
    </section>
  );
};

const Schedule = () => {
  return (
    <LockedOverlay
      isLocked={!FEATURE_FLAGS.eventDetailsVisible}
      title="Próximamente"
      description="Los detalles de ceremonia y recepción se compartirán pronto"
    >
      <motion.div
        className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={STAGGER}
      >
        {[
          // Nota: las imágenes /hero/* deben mantenerse comprimidas manualmente (<200KB, WebP/AVIF) para evitar penalizar el LCP real.
          {
            title: "Ceremonia",
            time: CEREMONY.timePretty,
            place: CEREMONY.venue,
            address: CEREMONY.venueAddress,
            link: CEREMONY.mapsUrl,
            image: "/hero/iglesia.webp",
            icon: <Stars className="h-5 w-5" />,
          },
          {
            title: "Recepción",
            time: RECEPTION.startTime,
            place: RECEPTION.venue,
            address: RECEPTION.venueAddress,
            link: RECEPTION.mapsUrl,
            image: "/hero/centrodeeventos.webp",
            icon: <PartyPopper className="h-5 w-5" />,
          },
          {
            title: "Dress Code",
            time: "",
            place: "Elegante / Formal",
            address:
              "Ellas NO deben usar blanco ni tonos muy claros, eso déjenlo para la novia 😉",
            link: "#",
            image: "/dress_code.webp",
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
            <motion.div
              key={i.title}
              variants={REVEAL_UP}
              className={idx === 2 ? "col-span-2 md:col-span-1" : ""}
            >
              <Wrapper
                {...wrapperProps}
                onClick={
                  hasLink
                    ? () =>
                        trackEvent("map_click", {
                          location: "schedule",
                          venue: i.title,
                          destination: i.link,
                        })
                    : undefined
                }
                className={`group block rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${
                  hasLink ? "cursor-pointer" : ""
                }`}
              >
                <Card className="h-full rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.035)] transition hover:shadow-[0_8px_26px_rgba(0,0,0,0.055)]">
                  {/* Imagen superior 16:9 con overlay */}
                  <div className="relative overflow-hidden rounded-t-xl">
                    <div
                      className={
                        idx === 2
                          ? "relative aspect-[5/2] w-full md:aspect-[16/9]"
                          : "relative aspect-[4/3] w-full md:aspect-[16/9]"
                      }
                    >
                      <Image
                        src={i.image}
                        alt={`Imagen ${i.title}`}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 45vw, 50vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0" />
                    <div className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground shadow md:left-3 md:top-3 md:gap-2 md:px-3 md:text-sm">
                      {i.icon}
                      {i.title}
                    </div>
                  </div>

                  {/* Contenido */}
                  <CardContent className="space-y-1.5 p-3 md:space-y-2 md:p-6 md:pt-4">
                    {i.time && (
                      <p className="text-xs text-muted-foreground md:text-sm">
                        <Clock className="mr-1 inline h-3.5 w-3.5 md:h-4 md:w-4" />
                        {i.time}
                      </p>
                    )}

                    {/* Lugar y dirección: cuando la tarjeta es <a>, NO anidamos <a> */}
                    {hasLink ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold leading-tight hover:underline md:text-base">
                          {i.place}
                          <ExternalLink className="hidden h-4 w-4 shrink-0 sm:block" />
                        </span>
                        <span className="line-clamp-2 block text-xs leading-snug text-muted-foreground hover:underline md:text-sm">
                          {i.address}
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold md:text-base">
                          {i.place}
                        </p>
                        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground md:text-sm">
                          {i.address}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Wrapper>
            </motion.div>
          );
        })}
      </motion.div>
    </LockedOverlay>
  );
};

// 👉 FAQ (bloque completo: items + helper + componente + JSON-LD)

type FaqItem = { q: string; a: string };
type FaqSeoItem = { question: string; answer: string };

// JSON-LD: FAQPage
function SeoFaq({ items }: { items: FaqSeoItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Importante: el contenido debe coincidir con lo que se muestra en pantalla
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// 👉 Items del FAQ (usa exactamente los textos que muestras en la UI)
const FAQ_ITEMS: FaqItem[] = [
  {
    q: "👗 ¿Cuál es el código de vestimenta?",
    a: "Elegante/Formal. Por favor, evita el blanco o tonos muy claros. Eso se lo dejamos a la novia. Sugerimos un abrigo liviano para la tarde/noche.",
  },
  {
    q: "📅 ¿Hasta cuándo puedo confirmar mi asistencia?",
    a: "Hasta el 30 de septiembre de 2026 (60 días antes) o lo antes posible para cerrar banquete y logística. Si necesitas más tiempo, cuéntanos y vemos cómo ayudarte. Puedes confirmar tu asistencia más arriba en esta página.",
  },
  {
    q: "🅿️ ¿Hay estacionamientos disponibles?",
    a: "Sí, habrá estacionamientos en el lugar. Tanto en la iglesia como en el centro de eventos. Recomendamos compartir auto o usar apps de transporte para mayor comodidad.",
  },
  {
    q: "🎁 ¿Cómo puedo hacer el regalo?",
    a: "En la sección “Regalo” podrás realizar tu aporte a través de Webpay (plataforma Flow) , eligiendo la modalidad de pago que prefieras: tarjeta de débito, tarjeta de crédito o transferencia bancaria. Una vez confirmado el pago, recibirás un comprobante. Solo debes seguir las instrucciones que aparecen en pantalla para completar el proceso de forma simple, segura y con el registro correcto de tu regalo con sentido.",
  },
  {
    q: "💳 ¿Puedo pagar en cuotas con tarjeta?",
    a: "Sí. Al pagar por Flow (Webpay) podrás seleccionar cuotas según tu banco y tarjeta, incluso podrás elegir cuotas sin interés dependiendo del emisor (sujeto a condiciones de cada banco).",
  },
  {
    q: "🥗 Tengo restricciones alimentarias",
    a: "¡Perfecto! Indícalas en el formulario de confirmación de asistencia (vegetariano, vegano, sin gluten o alergias) y lo coordinamos con el banquete.",
  },
  {
    q: "📸 ¿Habrá fotógrafo? ¿Puedo llevar cámara?",
    a: "Sí, contaremos con fotógrafo y video. Puedes tomar fotos, solo te pedimos evitar flash durante la ceremonia y no bloquear el pasillo.",
  },
  {
    q: "📤 ¿Cómo comparto mis fotos con ustedes?",
    a: "Habilitaremos un código QR para que puedas compartir tus fotos de forma muy simple y rápida. Solo tendrás que escanearlo y subir tus imágenes para que podamos ver y guardar esos recuerdos contigo.",
  },
];

// util para dividir en dos columnas equilibradas
const splitInTwo = <T,>(arr: T[]) => {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
};

const cleanFaqQuestion = (q: string) => {
  const questionStart = q.indexOf("¿");
  if (questionStart >= 0) return q.slice(questionStart);
  const statementStart = q.indexOf("Tengo");
  if (statementStart >= 0) return q.slice(statementStart);
  return q;
};

const FAQ = () => {
  const [left, right] = splitInTwo(FAQ_ITEMS);

  // Normaliza para el JSON-LD (debe coincidir con lo visible)
  const FAQ_FOR_SEO: FaqSeoItem[] = FAQ_ITEMS.map((it) => ({
    question: cleanFaqQuestion(it.q),
    answer: it.a,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-3 md:grid-cols-2">
        {[left, right].map((col, idx) => (
          <Accordion key={idx} type="multiple" className="w-full">
            {col.map((f, i) => (
              <AccordionItem
                key={i}
                value={`c${idx}-item-${i}`}
                className="mb-3 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-[0_4px_18px_rgba(0,0,0,0.035)]"
              >
                <AccordionTrigger className="min-h-12 px-4 py-3 text-left text-[15px] font-semibold leading-snug hover:no-underline md:text-base">
                  {cleanFaqQuestion(f.q)}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
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
  );
};

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
    const tryPlay = () =>
      a
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
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
    trackEvent("music_request_click", {
      action: playing ? "pause" : "play",
      source: src,
    });
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
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-1 ring-border"
          aria-label={playing ? "Pausar música" : "Reproducir música"}
          title={playing ? "Pausar" : "Reproducir"}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          {playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
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
        © {new Date().getFullYear()} {GROOM} & {BRIDE}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <a
          href="mailto:contacto@teilen.cl"
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
      {/* Reproductor MP3 (autoplay) */}
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
        <Section
          id="historia"
          title="Nuestra Historia"
          icon={Heart}
          animation="left"
        >
          <Story />
        </Section>
      </div>

      <Section id="galeria" title="Galería" icon={ImageIcon}>
        <LazySectionBoundary
          fallback={
            <SectionSkeleton
              label="Galería (se carga al desplazarte)"
              rows={6}
            />
          }
          rootMargin="360px"
        >
          <LazyGallery />
        </LazySectionBoundary>
      </Section>

      {/* Banda con acento muy tenue para Regalo */}
      <div className="bg-accent/20">
        <Section id="regalo" title="Regalo" icon={Gift}>
          <LazySectionBoundary
            fallback={
              <SectionSkeleton
                label="Preparando opciones de regalo…"
                rows={6}
              />
            }
            rootMargin="420px"
          >
            <LazyGiftSection />
          </LazySectionBoundary>
        </Section>
      </div>

      {/* RSVP en su propia sección */}
      <Section id="rsvp" title="Confirmar asistencia" icon={Heart}>
        <LazySectionBoundary
          fallback={
            <SectionSkeleton
              label="Formulario de confirmación de asistencia disponible al desplazarte"
              rows={5}
            />
          }
          rootMargin="420px"
        >
          <LazyRSVPSection />
        </LazySectionBoundary>
      </Section>

      <Section
        id="programacion"
        title="Programación"
        icon={Calendar}
        animation="up"
      >
        <LazySectionBoundary
          fallback={
            <SectionSkeleton
              label="Timeline (se cargará automáticamente)"
              rows={4}
            />
          }
          rootMargin="400px"
        >
          <LazyTimeline />
        </LazySectionBoundary>
      </Section>

      <Section id="faq" title="Preguntas frecuentes" icon={Stars}>
        <FAQ />
      </Section>

      <Footer />
    </div>
  );
}
