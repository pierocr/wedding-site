"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Music2, Pause, Play } from "lucide-react";
import type { PlaylistTrack } from "@/data/playlist";
import { trackEvent } from "@/lib/analytics";

type MusicPlayerProps = {
  tracks: PlaylistTrack[];
  className?: string;
};

export const MusicPlayer = ({ tracks, className = "" }: MusicPlayerProps) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const pendingPlayRef = React.useRef(false);
  const didMountRef = React.useRef(false);
  const playingRef = React.useRef(false);
  const userPausedRef = React.useRef(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const currentTrack = tracks[currentIndex];

  const playAudio = React.useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      audio.muted = false;
      await audio.play();
      setPlaying(true);
      return true;
    } catch {
      setPlaying(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.volume = 0.7;
    audio.muted = false;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");

    if (!userPausedRef.current) void playAudio();

    const removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("touchend", onFirstInteraction);
      window.removeEventListener("click", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };

    const onFirstInteraction = async (event: Event) => {
      const started = await playAudio();
      if (started) removeUnlockListeners();
    };

    window.addEventListener("pointerdown", onFirstInteraction);
    window.addEventListener("touchend", onFirstInteraction);
    window.addEventListener("click", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);

    return () => {
      removeUnlockListeners();
      audio.pause();
    };
  }, [currentTrack, playAudio]);

  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.load();
    if (pendingPlayRef.current || playingRef.current) {
      pendingPlayRef.current = false;
      void playAudio();
    }
  }, [currentTrack?.src, playAudio]);

  if (!currentTrack) return null;

  const togglePlay = async () => {
    trackEvent("music_request_click", {
      action: playing ? "pause" : "play",
      source: currentTrack.src,
    });

    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      userPausedRef.current = true;
      audio.pause();
      setPlaying(false);
      return;
    }

    userPausedRef.current = false;
    await playAudio();
  };

  const selectTrack = (index: number) => {
    const nextTrack = tracks[index];
    if (!nextTrack) return;

    trackEvent("music_request_click", {
      action: "select",
      source: nextTrack.src,
    });

    userPausedRef.current = false;
    setOpen(false);

    if (index === currentIndex) {
      void playAudio();
      return;
    }

    pendingPlayRef.current = true;
    setCurrentIndex(index);
  };

  const playNextTrack = () => {
    if (tracks.length <= 1) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      void playAudio();
      return;
    }

    userPausedRef.current = false;
    pendingPlayRef.current = true;
    setCurrentIndex((index) => (index + 1) % tracks.length);
  };

  return (
    <div
      data-music-player
      className={[
        "fixed bottom-3 right-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2",
        className,
      ].join(" ")}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-[min(86vw,280px)] overflow-hidden rounded-xl border bg-background/95 p-2 shadow-xl ring-1 ring-border backdrop-blur"
          >
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Playlist
            </div>
            <div className="grid gap-1">
              {tracks.map((track, index) => {
                const active = index === currentIndex;

                return (
                  <button
                    key={track.src}
                    type="button"
                    onClick={() => selectTrack(index)}
                    className={[
                      "flex min-h-12 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary",
                    ].join(" ")}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary">
                      {track.artworkUrl ? (
                        <img
                          src={track.artworkUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Music2 className="h-4 w-4" />
                      )}
                      {active && (
                        <span className="absolute inset-0 flex items-center justify-center bg-primary/65 text-primary-foreground">
                          {playing ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {track.title}
                      </span>
                      {track.artist && (
                        <span
                          className={[
                            "block truncate text-xs",
                            active
                              ? "text-primary-foreground/75"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {track.artist}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative isolate flex items-center gap-2 rounded-full border bg-background/95 p-1.5 shadow-lg ring-1 ring-border backdrop-blur">
        {!playing && (
          <span className="pointer-events-none absolute left-1.5 top-1.5 -z-10 h-12 w-12 rounded-full bg-primary/30 animate-ping" />
        )}

        <motion.button
          type="button"
          onClick={togglePlay}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
          aria-label={playing ? "Pausar musica" : "Reproducir musica"}
          title={playing ? "Pausar" : "Reproducir"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </motion.button>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-12 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-expanded={open}
          aria-label={open ? "Cerrar playlist" : "Abrir playlist"}
          title={open ? "Cerrar playlist" : "Abrir playlist"}
        >
          <ChevronUp
            className={[
              "h-4 w-4 shrink-0 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.src}
        autoPlay
        preload="auto"
        playsInline
        className="hidden"
        onCanPlay={() => {
          if (!playingRef.current && !userPausedRef.current) {
            void playAudio();
          }
        }}
        onEnded={playNextTrack}
      />
    </div>
  );
};
