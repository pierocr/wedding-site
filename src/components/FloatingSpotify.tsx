"use client";
import * as React from "react";
import { GripVertical, X } from "lucide-react";

type FloatingSpotifyProps = {
  url: string;
  title?: string;
  width?: number;
  height?: number;
  defaultOpen?: boolean;
};

export default function FloatingSpotify({
  url,
  title = "Spotify mini player",
  width = 320,
  height = 80, // compacto
  defaultOpen = true,
}: FloatingSpotifyProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [pos, setPos] = React.useState<{ x: number; y: number }>({
    x: typeof window !== "undefined" ? window.innerWidth - (width + 24) : 20,
    y: typeof window !== "undefined" ? window.innerHeight - (height + 120) : 20,
  });

  const ref = React.useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };

    const onMove = (ev: PointerEvent) => {
      setPos({
        x: startPos.x + (ev.clientX - startX),
        y: startPos.y + (ev.clientY - startY),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const toEmbed = (raw: string) => {
    try {
      const u = new URL(raw);
      if (!u.pathname.includes("/embed/")) {
        u.pathname = "/embed" + u.pathname;
      }
      return u.toString();
    } catch {
      return raw;
    }
  };

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[9999]"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="rounded-xl shadow-2xl backdrop-blur bg-black/70 border border-white/10 overflow-hidden">
        <div
          onPointerDown={onPointerDown}
          className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs cursor-grab active:cursor-grabbing text-white"
        >
          <span className="inline-flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5" />
            Música
          </span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <iframe
          title={title}
          src={toEmbed(url)}
          width={width}
          height={height}
          style={{ borderRadius: 8 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}
