"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
// Usas estos nombres en tu código, así que alias con lucide:
import {
  Camera,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  X as XIcon,
} from "lucide-react";

// Si tu array estaba dentro de page.tsx, muévelo a un data file e impórtalo:
import { GALLERY } from "@/data/gallery";

const Gallery = () => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number>(0);

  const total = GALLERY.length;
  const current = GALLERY[index] ?? GALLERY[0];
  const src = current?.src ?? "";
  const alt = current?.alt ?? "Recuerdo de Piero y Debby";

  // Navegación
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  // ====== ZOOM & PAN ======
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ dragging: boolean; startX: number; startY: number; origX: number; origY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // Reset zoom al abrir/cambiar foto/cerrar
  useEffect(() => {
    if (!open) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [open, index]);

  // Teclas
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Util: limita el arrastre para que no se salga “demasiado”
  const clampOffset = (nx: number, ny: number, s: number) => {
    const el = containerRef.current;
    if (!el) return { x: nx, y: ny };
    const { clientWidth: cw, clientHeight: ch } = el;
    // margen visible cuando haces pan (aprox)
    const maxX = (cw * (s - 1)) / 2;
    const maxY = (ch * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  };

  // Click / tap para alternar zoom
  const toggleZoom = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    if (scale === 1) {
      // calcula centro relativo para que el zoom se enfoque donde clicaste
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const newScale = 2.5;
      const nx = (-cx * (newScale - 1)) / newScale;
      const ny = (-cy * (newScale - 1)) / newScale;
      const lim = clampOffset(nx, ny, newScale);
      setScale(newScale);
      setOffset(lim);
    } else {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  // Rueda para zoom incremental
  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;

    const delta = -e.deltaY; // arriba = zoom in
    const factor = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.max(1, Math.min(4, scale * factor));

    // ajustar offset para “acercar hacia el cursor”
    const nx = (offset.x - mx) * (newScale / scale) + mx;
    const ny = (offset.y - my) * (newScale / scale) + my;
    const lim = clampOffset(nx, ny, newScale);

    setScale(newScale);
    setOffset(lim);
  };

  // Arrastrar cuando esté con zoom
  const onPointerDown: React.PointerEventHandler = (e) => {
    if (scale === 1) return;
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.origX = offset.x;
    dragRef.current.origY = offset.y;
  };
  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const lim = clampOffset(dragRef.current.origX + dx, dragRef.current.origY + dy, scale);
    setOffset(lim);
  };
  const onPointerUp: React.PointerEventHandler = (e) => {
    if (!dragRef.current.dragging) return;
    const el = e.currentTarget as HTMLDivElement;
    el.releasePointerCapture(e.pointerId);
    dragRef.current.dragging = false;
  };

  return (
    <>
      {/* Grid de miniaturas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {GALLERY.map(({ src, alt }, i) => (
          <button
            key={`${src}-${i}`}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={src}
              alt={alt}
              loading="lazy"
              width={640}
              height={800}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            <div className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-xs text-foreground shadow">
              <Camera className="h-4 w-4" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[92vw] border-0 bg-black/90 p-2 sm:max-w-5xl [&>button]:hidden">
          {/* Requisito de accesibilidad de Radix: título (oculto visualmente) */}
          <VisuallyHidden>
            <DialogTitle>Visor de fotos</DialogTitle>
          </VisuallyHidden>

          <div className="relative">
            <div
              ref={containerRef}
              className={`mx-auto flex max-h-[80vh] w-full select-none items-center justify-center overflow-hidden rounded-lg bg-black/20 ${
                scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
              }`}
              onDoubleClick={toggleZoom}
              onClick={(e) => {
                // en móvil, un solo tap alterna zoom
                if (window.matchMedia("(hover: none)").matches) toggleZoom(e as any);
              }}
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <img
                src={src}
                alt={alt}
                className="pointer-events-none max-h-[80vh] w-auto select-none"
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                  transition: dragRef.current.dragging ? "none" : "transform 150ms ease-out",
                  willChange: "transform",
                }}
                draggable={false}
              />
            </div>

            {/* Cerrar */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
              aria-label="Cerrar"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {/* Controles izq/der */}
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
                  aria-label="Anterior"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
                  aria-label="Siguiente"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Indicador */}
            <div className="mt-3 text-center text-xs text-white/80">
              {index + 1} / {total}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gallery;
