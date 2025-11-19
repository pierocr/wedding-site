"use client";
import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play } from "lucide-react";
import { useInViewOnce } from "@/hooks/useInViewOnce";

export default function Story() {
  const VIDEO_ID = "CisTs-tueAU";
  const YT_EMBED = `https://www.youtube.com/embed/${VIDEO_ID}`;
  const YT_THUMB = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

  const { ref: videoRef, visible } = useInViewOnce<HTMLDivElement>({ rootMargin: "240px" });
  const [activated, setActivated] = React.useState(false);

  React.useEffect(() => {
    if (visible) setActivated(true);
  }, [visible]);

  // Variants locales (animaciones)
  const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const REVEAL_LEFT = {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
  };
  const REVEAL_UP = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };
  const STAGGER = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
  };

  return (
    <motion.div
      className="grid items-start gap-6 md:grid-cols-2"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={STAGGER}
    >
      {/* Texto */}
      <motion.div className="space-y-4 leading-relaxed text-foreground/90" variants={REVEAL_LEFT}>
        <motion.p variants={REVEAL_UP}>
          Queremos compartir la historia de cómo comenzó todo con Piero.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Nos conocimos trabajando, algo que ninguno de los dos esperaba. Cada cruce en los pasillos bastaba
          para sonrojarnos con solo mirarnos… hasta que un día dijimos “sí” a salir juntos, y desde entonces
          nuestras vidas cambiaron para siempre.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          El <span className="font-medium">16 de agosto de 2025</span>, en medio de la magia de{" "}
          <span className="font-medium">Bariloche</span>, Piero me pidió matrimonio. Un “sí” lleno de amor y
          emoción que hoy nos lleva a dar el paso más importante de nuestras vidas.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Han sido años maravillosos: viajes, aventuras, experiencias inolvidables, la creación de un hogar y
          momentos que atesoramos con el corazón.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Ahora queremos invitarte a compartir esta felicidad con nosotros y a acompañarnos en este gran día.{" "}
          <span className="font-medium">¡Nos vemos el 21 de noviembre de 2026!</span>
        </motion.p>
      </motion.div>

      {/* Video */}
      <motion.div className="space-y-3" variants={REVEAL_UP}>
        <div ref={videoRef} className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-sm">
          {activated ? (
            <iframe
              src={`${YT_EMBED}?rel=0&modestbranding=1`}
              title="Nuestra historia"
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setActivated(true)}
              aria-label={'Reproducir video "Nuestra historia"'}
              className="group relative flex h-full w-full items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Image
                src={YT_THUMB}
                alt="Miniatura del video de nuestra historia"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70 transition-colors duration-300 group-hover:from-black/40 group-hover:via-black/60 group-hover:to-black/80" />
              <div className="relative z-10 flex flex-col items-center gap-3 text-center text-white">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl shadow-black/30 transition group-hover:scale-105">
                  <Play className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.3em]">Ver video</span>
                <span className="text-xs text-white/80">El video se cargará al acercarte o tocar el botón.</span>
              </div>
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Sugerencia: usa un video horizontal (16:9) para que luzca perfecto.
        </p>
      </motion.div>
    </motion.div>
  );
}
