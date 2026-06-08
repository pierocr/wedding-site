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
          Queremos compartir con ustedes un poco de nuestra historia.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Todo comenzó en un lugar inesperado: el trabajo. Cada encuentro en los pasillos bastaba para
          sonrojarnos con solo mirarnos. Entre sonrisas que aparecían sin querer y una conexión que crecía
          día a día, fuimos descubriendo que había algo especial entre nosotros. Lo que al principio eran
          nervios y emoción se transformó en una primera cita que cambiaría nuestras vidas para siempre.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Desde entonces, hemos recorrido un hermoso camino juntos. Hemos vivido aventuras inolvidables,
          viajando, aprendiendo el uno del otro, construyendo nuestro hogar y creando recuerdos que
          llevaremos siempre en el corazón.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          El <span className="font-medium">16 de agosto de 2025</span>, en medio de la magia de{" "}
          <span className="font-medium">Bariloche</span>, en el <span className="font-medium">Cerro Catedral</span>,
          nuestra historia escribió uno de sus capítulos más importantes. Allí nos comprometimos y dijimos
          “sí” a seguir construyendo nuestro futuro juntos.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Hoy, después de tantos momentos compartidos y con una enorme ilusión por todo lo que está por
          venir, queremos celebrar el comienzo de una nueva etapa rodeados de las personas que más queremos.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Será una inmensa alegría compartir este día tan especial con ustedes.
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          <span className="font-medium">¡Los esperamos el 21 de noviembre de 2026!</span>
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Con cariño,
        </motion.p>

        <motion.p variants={REVEAL_UP}>
          Piero &amp; Debby ❤️
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
          Un recuerdo especial de nuestra historia, para verlo con calma antes del gran día.
        </p>
      </motion.div>
    </motion.div>
  );
}
