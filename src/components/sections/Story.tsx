"use client";
import * as React from "react";
import { motion } from "framer-motion";

export default function Story() {
  // Video YouTube embebido
  const YT_EMBED = "https://www.youtube.com/embed/CisTs-tueAU";

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
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-sm">
          <iframe
            src={YT_EMBED}
            title="Nuestra historia"
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Sugerencia: usa un video horizontal (16:9) para que luzca perfecto.
        </p>
      </motion.div>
    </motion.div>
  );
}
