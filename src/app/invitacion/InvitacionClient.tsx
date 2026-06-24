"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import styles from "./invitacion.module.css";

function BotanicalCorner({ position }: { position: "topRight" | "bottomLeft" }) {
  return (
    <div className={`${styles.botanical} ${styles[position]}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function EnvelopeBranch({ position }: { position: "topRight" | "bottomLeft" }) {
  return (
    <Image
      className={`${styles.envelopeBranch} ${styles[position]}`}
      src="/images/wedding/Ramita_fondo.png"
      alt=""
      width={1254}
      height={1254}
      priority
      aria-hidden="true"
    />
  );
}

function Envelope({
  isOpen,
  isReady,
  isSettled,
  onOpen,
}: {
  isOpen: boolean;
  isReady: boolean;
  isSettled: boolean;
  onOpen: () => void;
}) {
  return (
    <section
      className={`${styles.envelopeStage} ${isReady ? styles.envelopeReady : ""} ${
        isOpen ? styles.envelopeLeaving : ""
      } ${isSettled ? styles.envelopeGone : ""}`}
      aria-label="Sobre cerrado"
    >
      <div className={styles.envelope} role="group" aria-labelledby="envelope-title">
        <div className={styles.envelopePanelLeft} aria-hidden="true" />
        <div className={styles.envelopePanelRight} aria-hidden="true" />
        <div className={styles.goldFrame} aria-hidden="true" />
        <EnvelopeBranch position="topRight" />
        <EnvelopeBranch position="bottomLeft" />

        <div className={styles.envelopeCopy}>
          <p id="envelope-title" className={styles.kicker}>
            Nuestro matrimonio
          </p>
          <h1 className={styles.names}>Debby &amp; Piero</h1>
          <p className={styles.dateLine}>21.11.2026</p>
        </div>

        <button className={styles.waxSealButton} type="button" onClick={onOpen} aria-label="Abrir invitación">
          <Image
            className={styles.waxSeal}
            src="/images/wedding/Sello_invitacion.png"
            alt=""
            width={1254}
            height={1254}
            priority
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
}

function DetailBlock({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <article className={styles.detailBlock}>
      <div className={styles.detailIcon} aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <div>{children}</div>
    </article>
  );
}

function ChurchIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M12 54h40M18 54V27l14-11 14 11v27M32 16V7M27 11h10M28 54V39a4 4 0 0 1 8 0v15M24 32h-6M46 32h-6" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 54h44M16 54V25l16-10 16 10v29M24 54V36h16v18M22 30h8M34 30h8M20 22V12h9v5" />
    </svg>
  );
}

function OpenInvitation({ isOpen, isSettled }: { isOpen: boolean; isSettled: boolean }) {
  return (
    <section
      className={`${styles.openStage} ${isOpen ? styles.openVisible : ""} ${isSettled ? styles.openSettled : ""}`}
      aria-label="Invitación abierta"
    >
      <div className={styles.invitationCard}>
        <div className={styles.goldFrame} aria-hidden="true" />
        <BotanicalCorner position="topRight" />
        <BotanicalCorner position="bottomLeft" />

        <div className={styles.invitationIntro}>
          <p>
            Con mucha alegría queremos invitarte
            <br />
            a acompañarnos a celebrar
            <br />
            este día tan especial.
          </p>
          <div className={styles.divider} aria-hidden="true">
            <span />
          </div>
        </div>

        <div className={styles.dateGrid}>
          <DetailBlock title="Ceremonia" icon={<ChurchIcon />}>
            <p>
              Iglesia Santa Úrsula
              <br />
              de Vitacura
            </p>
            <strong>16:30 hrs</strong>
          </DetailBlock>

          <div className={styles.mainDate} aria-label="Sábado 21 de noviembre de 2026">
            <span>SÁBADO</span>
            <strong>21</strong>
            <span>NOVIEMBRE</span>
            <em>2026</em>
          </div>

          <DetailBlock title="Celebración" icon={<HouseIcon />}>
            <p>
              Casona Santa Luz
              <br />
              de Chicureo
            </p>
          </DetailBlock>
        </div>

        <figure className={styles.photoFrame}>
          <Image
            src="/images/wedding/moon-photo.jpg"
            alt="Debby y Piero sentados en una luna iluminada"
            width={1280}
            height={960}
            priority
            sizes="(min-width: 900px) 760px, calc(100vw - 48px)"
          />
        </figure>

        <div className={styles.confirmation}>
          <p>Estamos felices de compartir este día contigo 🤍</p>
          <a href="https://pieroydebby.cl">Confirmar asistencia y regalo</a>
        </div>
      </div>
    </section>
  );
}

export default function InvitacionClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    const readyFrame = requestAnimationFrame(() => setIsReady(true));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsOpen(true);
    }

    return () => cancelAnimationFrame(readyFrame);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsSettled(false);
      return;
    }

    const settleTimer = window.setTimeout(() => {
      setIsSettled(true);
    }, 1200);
    return () => window.clearTimeout(settleTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isSettled) return;

    const resetScroll = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    const scrollTimers = [0, 80, 220, 500].map((delay) => window.setTimeout(resetScroll, delay));

    return () => scrollTimers.forEach((timer) => window.clearTimeout(timer));
  }, [isSettled]);

  return (
    <main className={`${styles.page} ${!isSettled ? styles.pageLocked : ""}`}>
      <Envelope isOpen={isOpen} isReady={isReady} isSettled={isSettled} onOpen={() => setIsOpen(true)} />
      <OpenInvitation isOpen={isOpen} isSettled={isSettled} />
    </main>
  );
}
