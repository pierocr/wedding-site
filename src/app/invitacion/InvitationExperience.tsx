"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Calendar,
  ExternalLink,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Send,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BRIDE, CEREMONY, GROOM, RECEPTION, SITE_URL, WEDDING_DATE_ISO } from "@/data/site";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const RSVP_URL = `${SITE_URL}/#rsvp`;
const GIFT_URL = `${SITE_URL}/#regalo`;
const DETAILS_URL = `${SITE_URL}/`;
const WHATSAPP_GROOM = "https://wa.me/56911111111";
const WHATSAPP_BRIDE = "https://wa.me/56922222222";
const VIDEO_ID = "CisTs-tueAU";
const VIDEO_EMBED_URL = `https://www.youtube.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`;
const VIDEO_THUMB_URL = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

function useCountdown(targetISO: string) {
  const target = React.useMemo(() => new Date(`${targetISO}T00:00:00-03:00`), [targetISO]);
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function FloatingPetal({
  className,
  delay = 0,
  duration = 12,
}: {
  className: string;
  delay?: number;
  duration?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              y: [0, -20, 0],
              x: [0, 12, 0],
              rotate: [0, 5, -4, 0],
            }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    />
  );
}

function MusicPlayer() {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.65;
    audio.loop = true;

    const tryPlay = async () => {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    };

    tryPlay();

    const unlock = () => {
      tryPlay();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audio.pause();
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/55 bg-white/88 text-foreground shadow-[0_12px_32px_rgba(70,53,31,0.16)] backdrop-blur"
        aria-label={playing ? "Pausar musica" : "Reproducir musica"}
      >
        {!playing ? <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" aria-hidden="true" /> : null}
        {playing ? <Pause className="relative h-4 w-4" /> : <Play className="relative ml-0.5 h-4 w-4" />}
      </button>
      <audio ref={audioRef} src="/music/Sonreir.mp3" className="hidden" />
    </div>
  );
}

function EnvelopeIntro({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  return (
    <motion.section
      className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative w-full max-w-[22rem] sm:max-w-[28rem]">
        <motion.div
          className="absolute -top-10 left-1/2 h-20 w-28 -translate-x-1/2 rounded-full bg-[#c4cfb2]/55 blur-2xl"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative aspect-[0.88]">
          <motion.div
            className="absolute inset-x-0 bottom-0 h-[66%] rounded-[2rem] bg-[linear-gradient(180deg,#dde3cd_0%,#e9edd9_48%,#d8deca_100%)] shadow-[0_28px_80px_rgba(79,68,47,0.16)]"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <div
              className="absolute inset-x-0 bottom-0 h-full rounded-[2rem]"
              style={{ clipPath: "polygon(0 100%, 0 44%, 50% 72%, 100% 44%, 100% 100%)" }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-x-[4%] top-[3%] z-10 h-[60%] rounded-[1.8rem] border border-[#efe4d2] bg-[radial-gradient(circle_at_top,#fffefb_0%,#fbf6ef_60%,#f5eee3_100%)] px-7 py-8 text-center shadow-[0_16px_40px_rgba(90,73,49,0.1)] sm:py-9"
            initial={{ y: 120, opacity: 0.92, scale: 0.98 }}
            animate={opened ? { y: -24, rotateX: 2, opacity: 1, scale: 1 } : { y: 34, opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7 }}
            >
              <p className="text-sm tracking-[0.12em] text-[#a47d3b] sm:text-base">Estas invitado/a a la boda de</p>
              <h1 className="mt-4 text-4xl leading-tight text-[#a47d3b] sm:text-5xl">
                <span className="font-script">{GROOM}</span>
                <span className="mx-2 text-2xl align-middle sm:text-3xl">&</span>
                <span className="font-script">{BRIDE}</span>
              </h1>
              <p className="mt-5 text-sm leading-relaxed text-[#8e7a5b]">
                Una invitacion breve, elegante y pensada para abrir perfecto desde WhatsApp.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[16%] left-0 right-0 z-30 h-[22%] rounded-b-[2rem] bg-[linear-gradient(180deg,#e9eddc_0%,#dde3cf_100%)]"
            style={{ clipPath: "polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)" }}
            initial={{ opacity: 0.92 }}
            animate={{ opacity: 1 }}
          />

          <motion.div
            className="absolute inset-x-[10%] bottom-[28.5%] z-[25] h-[2.2rem] rounded-b-[1.4rem] bg-[linear-gradient(180deg,rgba(245,238,227,0)_0%,rgba(238,242,225,0.55)_82%,rgba(233,237,220,0.82)_100%)]"
            initial={{ opacity: 0.75 }}
            animate={{ opacity: 1 }}
          />

          <motion.div
            className="absolute inset-x-0 bottom-[6%] z-40 flex justify-center px-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
          >
            <Button
              type="button"
              onClick={onOpen}
              className="h-12 w-full max-w-[15rem] rounded-full bg-[#a88443] px-8 text-base text-white shadow-[0_14px_24px_rgba(168,132,67,0.28)] hover:bg-[#95753b]"
            >
              {opened ? "Ver resumen" : "Abrir invitacion"}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

function CountdownStrip() {
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_DATE_ISO);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const values = [
    { label: "Dias", value: hydrated ? days : 0 },
    { label: "Horas", value: hydrated ? hours : 0 },
    { label: "Min", value: hydrated ? minutes : 0 },
    { label: "Seg", value: hydrated ? seconds : 0 },
  ];

  return (
    <Card className="rounded-[1.8rem] border-white/60 bg-white/80 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
          <TimerReset className="h-4 w-4" />
          Cuenta regresiva
        </div>
        <div className="grid grid-cols-4 gap-2">
          {values.map((item) => (
            <div key={item.label} className="rounded-[1.25rem] bg-[#fcf8f0] px-2 py-3 text-center">
              <div className="tnum text-xl font-extrabold text-foreground sm:text-2xl" suppressHydrationWarning>
                {item.value}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryPanel() {
  const [videoOpen, setVideoOpen] = React.useState(false);

  return (
    <motion.section
      className="mx-auto max-w-5xl px-4 pb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8, ease: EASE }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Nos casamos</p>
        <h2 className="mt-4 text-5xl leading-[0.95] text-foreground sm:text-6xl">
          <span className="font-script">{GROOM}</span>
          <span className="mx-3 text-3xl align-middle sm:text-4xl">&</span>
          <span className="font-script">{BRIDE}</span>
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-foreground/72">
          Esta pagina es solo un resumen. Para confirmar asistencia o hacer un regalo, te llevamos a la pagina principal.
        </p>
      </motion.div>

      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
          <div className="grid md:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[20rem]">
              <Image
                src="/hero/1.jpg"
                alt={`Fotografia de ${GROOM} y ${BRIDE}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-white/75">Nuestra boda</p>
                <p className="mt-2 text-3xl font-semibold">Un dia para celebrar con ustedes</p>
              </div>
            </div>

            <CardContent className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Invitacion</p>
              <h3 className="mt-3 text-3xl">Un vistazo rapido al gran dia</h3>
              <p className="mt-4 text-base leading-relaxed text-foreground/72">
                Preparamos esta version para compartir facil por WhatsApp, con lo esencial del matrimonio y accesos directos a la pagina principal.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[1.25rem] bg-[#fcf8f0] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Fecha</p>
                  <p className="mt-2 font-semibold">21 Nov 2026</p>
                </div>
                <div className="rounded-[1.25rem] bg-[#fcf8f0] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Ciudad</p>
                  <p className="mt-2 font-semibold">Santiago</p>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
            <div className="relative aspect-[4/5]">
              {videoOpen ? (
                <iframe
                  src={VIDEO_EMBED_URL}
                  title="Video de nuestra historia"
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="group absolute inset-0 block h-full w-full"
                  aria-label="Reproducir video de nuestra historia"
                >
                  <Image
                    src={VIDEO_THUMB_URL}
                    alt={`Video de ${GROOM} y ${BRIDE}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent transition group-hover:from-black/65" />
                  <div className="absolute inset-x-4 bottom-4 text-left text-white">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/75">Nuestra historia</p>
                    <p className="mt-2 text-2xl font-semibold">Mira un momento especial de nosotros</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/88 text-primary shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
                      <Play className="ml-1 h-6 w-6" />
                    </span>
                  </div>
                </button>
              )}
            </div>
          </Card>

          <Card className="rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
            <CardContent className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Nuestra historia</p>
              <h3 className="mt-3 text-3xl">Todo empezo de forma inesperada</h3>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/74 sm:text-base">
                <p>
                  Nos conocimos trabajando, entre encuentros cotidianos y miradas que poco a poco fueron
                  convirtiendose en algo mucho mas grande.
                </p>
                <p>
                  Con el tiempo llegaron los viajes, los planes compartidos, la construccion de un hogar y la certeza
                  de que queriamos seguir el camino juntos.
                </p>
                <p>
                  Hoy queremos invitarte a ser parte de este momento y a celebrar con nosotros uno de los dias mas
                  importantes de nuestra vida.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <CountdownStrip />

        <Card className="rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
          <CardContent className="space-y-5 p-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Sabado 21 de noviembre de 2026</p>
              <p className="mt-3 text-2xl">Santiago, Chile</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-[#fcf8f0] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Calendar className="h-4 w-4" />
                  Ceremonia
                </div>
                <p className="font-medium">{CEREMONY.venue}</p>
                <p className="mt-1 text-sm text-muted-foreground">{CEREMONY.timePretty}</p>
              </div>

              <div className="rounded-[1.4rem] bg-[#fcf8f0] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Celebracion
                </div>
                <p className="font-medium">{RECEPTION.venue}</p>
                <p className="mt-1 text-sm text-muted-foreground">{RECEPTION.startTime}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={CEREMONY.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/15 bg-[#fcf8f0] px-4 py-3 text-sm font-semibold text-primary no-underline transition hover:bg-[#f8f1e3]"
              >
                <MapPin className="h-4 w-4" />
                Ver mapa
                <ExternalLink className="h-4 w-4" />
              </a>

              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/15 bg-[#fcf8f0] px-4 py-3 text-sm font-semibold text-primary">
                <Music2 className="h-4 w-4" />
                Dress code elegante / formal
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
            <div className="relative aspect-[4/5]">
              <Image
                src="/hero/iglesia.png"
                alt="Ceremonia"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-xs uppercase tracking-[0.28em] text-white/75">Ceremonia</p>
                <p className="mt-2 text-xl font-semibold">{CEREMONY.venue}</p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
            <div className="relative aspect-[4/5]">
              <Image
                src="/hero/centrodeeventos.jpg"
                alt="Celebracion"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-xs uppercase tracking-[0.28em] text-white/75">Celebracion</p>
                <p className="mt-2 text-xl font-semibold">{RECEPTION.venue}</p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
            <div className="relative aspect-[4/5]">
              <Image
                src="/hero/dress_code.jpg"
                alt="Dress code"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-xs uppercase tracking-[0.28em] text-white/75">Dress code</p>
                <p className="mt-2 text-xl font-semibold">Elegante / Formal</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="overflow-hidden rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
            <div className="relative aspect-[5/4]">
              <Image
                src="/gallery/4.jpg"
                alt={`${GROOM} y ${BRIDE} compartiendo un momento juntos`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent" />
            </div>
          </Card>

          <Card className="overflow-hidden rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
            <div className="relative aspect-[5/4]">
              <Image
                src="/gallery/7.jpg"
                alt={`Otro recuerdo especial de ${GROOM} y ${BRIDE}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent" />
            </div>
          </Card>
        </div>

        <Card className="rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Una nota para ti</p>
              <h3 className="mt-3 text-2xl">Gracias por acompanarnos</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Nos haria muy felices contar contigo en este momento. Si quieres ver mas detalles, confirmar asistencia o revisar regalos, todo esta listo en la pagina principal.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <a href={RSVP_URL} className="no-underline">
            <Button className="h-12 w-full rounded-full text-base">
              <Send className="mr-2 h-4 w-4" />
              Confirmar asistencia
            </Button>
          </a>
          <a href={GIFT_URL} className="no-underline">
            <Button variant="secondary" className="h-12 w-full rounded-full text-base">
              <Gift className="mr-2 h-4 w-4" />
              Ver regalos
            </Button>
          </a>
        </div>

        <a href={DETAILS_URL} className="block no-underline">
          <Card className="rounded-[1.8rem] border-primary/10 bg-[linear-gradient(180deg,#fffdf9_0%,#f6eddf_100%)] transition hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/70">Ver mas</p>
                <p className="mt-1 text-lg">Abrir pagina principal completa</p>
              </div>
              <ExternalLink className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </a>

        <Card className="rounded-[1.8rem] border-white/60 bg-white/82 shadow-[0_20px_55px_rgba(70,53,31,0.08)]">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Dudas</p>
              <h3 className="mt-3 text-2xl">Habla con los novios</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Si necesitas ayuda con ubicacion, horarios o cualquier detalle, escribenos directo por WhatsApp.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href={WHATSAPP_GROOM}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e8f5eb] px-4 py-3 text-sm font-semibold text-[#1b6e39] no-underline transition hover:bg-[#dff0e4]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp {GROOM}
              </a>
              <a
                href={WHATSAPP_BRIDE}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e8f5eb] px-4 py-3 text-sm font-semibold text-[#1b6e39] no-underline transition hover:bg-[#dff0e4]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp {BRIDE}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}

export default function InvitationExperience() {
  const [opened, setOpened] = React.useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#f7f0e6_0%,#f3eadf_40%,#eee3d7_100%)]">
      <MusicPlayer />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FloatingPetal className="absolute left-[-2rem] top-20 h-32 w-32 rounded-full bg-[#d1c89d]/35 blur-3xl" />
        <FloatingPetal className="absolute right-[-2rem] top-48 h-40 w-40 rounded-full bg-[#cdd6bd]/40 blur-3xl" delay={0.7} />
        <FloatingPetal className="absolute left-1/4 top-[42rem] h-36 w-36 rounded-full bg-white/30 blur-3xl" delay={1.2} duration={14} />
        <FloatingPetal className="absolute bottom-20 right-8 h-40 w-40 rounded-full bg-[#dbc092]/24 blur-3xl" delay={0.9} duration={15} />
      </div>

      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.div key="intro" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
            <EnvelopeIntro opened={opened} onOpen={() => setOpened(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <SummaryPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
