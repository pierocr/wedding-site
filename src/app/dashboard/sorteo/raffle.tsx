"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { drawWinner } from "./actions";
import styles from "./sorteo.module.css";

type Winner = { name: string; number: string };
const balls = ["✦", "♥", "✧", "♥", "✦", "✧", "♥", "✦", "✧", "♥", "✦", "✧"];

export default function Raffle() {
  const [phase, setPhase] = useState<"ready" | "spinning" | "winner">("ready");
  const [winner, setWinner] = useState<Winner | null>(null);
  const [digits, setDigits] = useState("000000");
  const [error, setError] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const busy = useRef(false);
  const globe = useRef<HTMLDivElement>(null);
  useEffect(() => () => { timers.current.forEach(clearTimeout); if (interval.current) clearInterval(interval.current); }, []);

  useEffect(() => {
    if (phase !== "spinning" || !globe.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = globe.current;
    const elements = Array.from(container.querySelectorAll<HTMLSpanElement>("[data-ball]"));
    const radius = container.clientWidth / 2 - 17;
    const center = container.clientWidth / 2;
    const particles = elements.map((element, index) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 85 + Math.random() * 85;
      const ring = index < 4 ? 23 : 58;
      const positionAngle = index < 4 ? index * Math.PI / 2 : (index - 4) * Math.PI / 4;
      return { element, x: Math.cos(positionAngle) * ring, y: Math.sin(positionAngle) * ring, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
    });
    let frame = 0;
    let previous = 0;
    const tick = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.03) : 0;
      previous = time;
      for (const particle of particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        const distance = Math.hypot(particle.x, particle.y);
        if (distance > radius) {
          const nx = particle.x / distance, ny = particle.y / distance;
          particle.x = nx * radius; particle.y = ny * radius;
          const outward = particle.vx * nx + particle.vy * ny;
          if (outward > 0) { particle.vx -= 2 * outward * nx; particle.vy -= 2 * outward * ny; }
        }
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 30) {
            const nx = dx / distance, ny = dy / distance;
            const overlap = (30 - distance) / 2;
            a.x -= nx * overlap; a.y -= ny * overlap;
            b.x += nx * overlap; b.y += ny * overlap;
            const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (relative < 0) { a.vx += relative * nx; a.vy += relative * ny; b.vx -= relative * nx; b.vy -= relative * ny; }
          }
        }
      }
      for (const particle of particles) {
        // Keep each ball inside the glass even after a collision near its edge.
        const distance = Math.hypot(particle.x, particle.y);
        if (distance > radius) { particle.x *= radius / distance; particle.y *= radius / distance; }
        particle.element.style.left = `${center + particle.x}px`;
        particle.element.style.top = `${center + particle.y}px`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  async function spin() {
    if (busy.current) return;
    busy.current = true;
    setError(""); setWinner(null); setPhase("spinning");
    interval.current = setInterval(() => setDigits(String(Math.floor(Math.random() * 1000000)).padStart(6, "0")), 80);
    const start = Date.now();
    const result: { error?: string; winner?: Winner; count?: number } = await drawWinner().catch(() => ({ error: "No pudimos realizar el sorteo. Inténtalo nuevamente." }));
    timers.current.push(setTimeout(() => {
      if (interval.current) clearInterval(interval.current);
      if (result.error || !result.winner) {
        setError(result.error || "No pudimos realizar el sorteo."); setDigits("000000"); setPhase("ready");
      } else {
        setDigits(result.winner.number); setWinner(result.winner); setPhase("winner");
      }
      busy.current = false;
    }, Math.max(0, 5200 - (Date.now() - start))));
  }

  return <div className={styles.page}>
    <div className={styles.grain} aria-hidden="true" />
    {phase === "winner" && <div className={styles.celebration} aria-hidden="true">
      {Array.from({ length: 42 }, (_, i) => <i key={i} style={{ "--i": i, "--duration": `${2.7 + (i % 5) * 0.4}s`, "--delay": `${(i % 8) * -0.4}s` } as React.CSSProperties} />)}
      <div className={`${styles.firework} ${styles.fireworkOne}`}>✺</div><div className={`${styles.firework} ${styles.fireworkTwo}`}>✺</div><div className={`${styles.firework} ${styles.fireworkThree}`}>✺</div>
    </div>}
    <header className={styles.header}><Link href="/dashboard" className={styles.back}><ArrowLeft size={16} /> Volver al panel</Link><span>PIERO <em>&</em> DEBBY</span><span className={styles.headerRight}>UNA NOCHE PARA RECORDAR ✦</span></header>
    <main className={styles.content}>
      <div className={styles.intro}><div className={styles.eyebrow}><span /> EL MOMENTO HA LLEGADO <span /></div><h1>El gran <em>sorteo</em></h1><p>Un poquito de suerte, muchísimo amor.</p></div>
      <div className={styles.stage}>
        <div className={styles.sideNote}><span>✦</span> HECHO CON AMOR<br />PARA CELEBRAR JUNTOS</div>
        <div className={styles.machine}>
          <div className={styles.topOrnament}>✧</div><div className={styles.globe} ref={globe}>
            <div className={styles.globeShine} />
            <div className={styles.balls}>{balls.map((ball, i) => <span data-ball key={i} style={{ left: `calc(50% + ${Math.cos(i < 4 ? i * Math.PI / 2 : (i - 4) * Math.PI / 4) * (i < 4 ? 23 : 58)}px)`, top: `calc(50% + ${Math.sin(i < 4 ? i * Math.PI / 2 : (i - 4) * Math.PI / 4) * (i < 4 ? 23 : 58)}px)` }}>{ball}</span>)}</div>
          </div><div className={styles.neck} /><div className={styles.base}><span>✦</span> P & D <span>✦</span></div>
        </div>
        <div className={styles.sideNoteRight}><span>✧</span> QUE COMIENCE<br />LA MAGIA</div>
      </div>
      <section className={styles.draw} aria-live="polite">
        <p className={styles.drawLabel}>{phase === "winner" ? "✦ NÚMERO GANADOR ✦" : phase === "spinning" ? "LA TÓMBOLA ESTÁ GIRANDO..." : "¿QUIÉN SERÁ EL AFORTUNADO?"}</p>
        <div className={styles.digits} aria-label={`Número ${digits.split("").join(" ")}`}>{digits.split("").map((digit, i) => <span key={i}>{phase === "ready" ? "–" : digit}</span>)}</div>
        {phase === "winner" && winner ? <div className={styles.winner}><p>¡Tenemos ganador!</p><h2>{winner.name}</h2><span>¡Felicidades! Gracias por ser parte de nuestra historia. ♡</span></div> : <p className={styles.hint}>{phase === "spinning" ? "¡Crucen los dedos!" : "La suerte está a punto de hacer lo suyo."}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.button} onClick={spin} disabled={phase === "spinning"}>{phase === "winner" ? <><RotateCcw size={17} /> VOLVER A SORTEAR</> : <><Sparkles size={18} /> {phase === "spinning" ? "GIRANDO..." : "COMENZAR EL SORTEO"}</>}</button>
        <p className={styles.caption}>CADA SORTEO ES INDEPENDIENTE</p>
      </section>
    </main>
    <footer className={styles.footer}><span>PIERO & DEBBY</span><span>CON AMOR, SIEMPRE ♡</span></footer>
  </div>;
}
