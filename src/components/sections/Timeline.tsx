'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { FEATURE_FLAGS } from '@/data/site';
import { LockedOverlay } from '@/components/ui/LockedOverlay';

type EventItem = {
  id: string;
  time: string;
  title: string;
  iconSrc?: string; // /public/imgs/timeline/*
  emoji?: string;   // fallback si no hay icono
};

const EVENTS: EventItem[] = [
  { id: 'citacion',  time: '16:30', title: 'Iglesia',   iconSrc: '/imgs/timeline/arch_gold.svg' },
  { id: 'ceremonia', time: '17:30', title: 'Sí, acepto', iconSrc: '/imgs/timeline/couple_gold.svg' },
  { id: 'coctel',    time: '18:30', title: 'Cóctel',     iconSrc: '/imgs/timeline/champagne_gold.svg' },
  { id: 'cena',      time: '20:30', title: 'Cena',       iconSrc: '/imgs/timeline/dinner_gold.svg' },
  { id: 'fiesta',    time: '22:00', title: 'Fiesta',     iconSrc: '/imgs/timeline/party_gold.svg' },
];

const Item = ({ idx, title, time, iconSrc, emoji }: { idx: number } & EventItem) => {
  const prefersReduce = useReducedMotion();

  return (
    <motion.div
      aria-label={`${title} a las ${time}`}
      className="group relative flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ delay: idx * 0.08, duration: 0.5, ease: 'easeOut' }}
    >
      {/* Icono */}
      <motion.div
        className="relative grid h-24 w-24 place-items-center rounded-full bg-white/90 shadow-xl ring-1 ring-black/5 md:h-28 md:w-28"
        animate={prefersReduce ? {} : { y: [0, -6, 0] }}
        transition={prefersReduce ? {} : { repeat: Infinity, repeatType: 'mirror', duration: 5 + idx }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/60 to-white/0" />
        {iconSrc ? (
          <Image
            src={iconSrc}
            alt={title}
            width={100}
            height={100}
            className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-[1.04] md:h-16 md:w-16"
            priority={idx < 2}
          />
        ) : (
          <span className="text-3xl md:text-4xl">{emoji ?? '✨'}</span>
        )}
      </motion.div>

      {/* Hora */}
      <div className="tnum rounded-full bg-amber-500/95 px-3 py-1 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-700/10 md:text-base">
        {time}
      </div>

      {/* Título */}
      <div className="font-medium text-sm text-muted-foreground md:text-base">{title}</div>
    </motion.div>
  );
};

/** Genera un path SVG en zig-zag para MOBILE en dos columnas.
 *  leftX/rightX: posiciones X (porcentaje de ancho del viewBox)
 *  stepY: separación vertical por item
 */
function buildMobileZigZagPath(len: number, leftX = 80, rightX = 240, startY = 20, stepY = 170) {
  if (len <= 0) return '';
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < len; i++) {
    const isLeft = i % 2 === 0;
    points.push({ x: isLeft ? leftX : rightX, y: startY + i * stepY });
  }
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = prev.y + (curr.y - prev.y) / 2;
    // Curva suave que controla en el centro para ambos nodos
    d += ` C ${prev.x},${midY} ${curr.x},${midY} ${curr.x},${curr.y}`;
  }
  return d;
}

export default function Timeline() {
  const dotted = '4 10';

  // === PATH MOBILE (2 columnas) ===
  const mobileStep = 175; // separa verticalmente los ítems en mobile
  const mobileHeight = EVENTS.length * mobileStep + 60; // altura suficiente para el SVG
  const mobilePath = buildMobileZigZagPath(EVENTS.length, 76, 244, 20, mobileStep);

  return (
    <LockedOverlay
      isLocked={!FEATURE_FLAGS.eventDetailsVisible}
      title="Próximamente"
      description="La programación detallada del día se compartirá pronto"
    >
      <section className="relative mx-auto w-full max-w-6xl px-4 py-0 sm:py-14">
      {/* Header */}
      <div className="mb-8 text-center">
{/*         <h2 className="font-medium text-3xl leading-tight tracking-[0.02em] text-primary md:text-4xl">
          Programación
        </h2> */}
        <p className="mx-auto mt-3 max-w-2xl font-medium text-sm text-muted-foreground md:text-base">
          Por favor sé puntual a la hora de citación para que no te pierdas de nada.
        </p>
      </div>

      {/* DESKTOP (igual que antes) */}
      <div className="relative hidden md:block">
        <svg
          viewBox="0 0 1200 360"
          className="pointer-events-none absolute inset-0 h-[320px] w-full -translate-y-2 select-none"
          aria-hidden="true"
        >
          <motion.path
            d="M60,300 C220,120 340,120 460,260 S760,340 920,180 S1060,100 1140,220"
            fill="none"
            strokeWidth="6"
            className="stroke-teal-400/80"
            strokeDasharray={dotted}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
        </svg>

        <div className="relative grid grid-cols-5 place-items-center gap-6">
          {EVENTS.map((e, i) => (
            <Item key={e.id} idx={i} {...e} />
          ))}
        </div>
      </div>

      {/* MOBILE: 2 columnas en zig-zag */}
      <div className="relative mx-auto max-w-md md:hidden">
        <div className="absolute bottom-4 left-5 top-4 w-px bg-border" aria-hidden="true" />
        <div className="space-y-3">
          {EVENTS.map((event) => (
            <div key={event.id} className="relative flex items-center gap-4 rounded-xl border bg-card p-3">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
                {event.time}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{event.title}</p>
              </div>
              {event.iconSrc ? (
                <Image
                  src={event.iconSrc}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 object-contain"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden">
        {/* Línea serpenteante animada */}
        <svg
          viewBox="0 0 320 1000"
          className="pointer-events-none absolute inset-0 w-full select-none"
          style={{ height: `${mobileHeight}px` }}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            d={mobilePath}
            fill="none"
            strokeWidth="6"
            className="stroke-teal-400/80"
            strokeDasharray={dotted}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Grid 2 columnas */}
        <div className="relative z-10 mx-auto grid max-w-md grid-cols-2 gap-y-10 pt-2">
          {EVENTS.map((e, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={e.id}
                className={`flex ${isLeft ? 'justify-start pr-3' : 'justify-end pl-3'}`}
              >
                <Item idx={i} {...e} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Glows sutiles */}
      <div className="hidden" />
      <div className="hidden" />
      </section>
    </LockedOverlay>
  );
}
