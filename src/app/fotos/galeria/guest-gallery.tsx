"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Camera, ChevronLeft, ChevronRight, Heart, Images, Minus, Plus, RefreshCw, X } from "lucide-react";

type Photo = { id: string; url: string; createdAt: string };
type PhotoPage = { photos: Photo[]; hasMore: boolean };
type ViewTransform = { scale: number; x: number; y: number };
type TouchGesture =
  | { kind: "drag"; x: number; y: number; initial: ViewTransform }
  | { kind: "pinch"; distance: number; x: number; y: number; initial: ViewTransform };
const INITIAL_TRANSFORM: ViewTransform = { scale: 1, x: 0, y: 0 };

function PhotoTile({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  return <div className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-[#e8eee5] sm:mb-4">
    {failed ? <a href={photo.url} target="_blank" rel="noreferrer" className="flex min-h-44 items-center justify-center px-4 text-center text-xs leading-5 text-[#637866]">Esta foto no se puede previsualizar aquí. Abrir original ↗</a> :
      <button type="button" onClick={onOpen} aria-label="Ampliar foto" className="block w-full overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#365741]">
        {/* Signed URLs are temporary and original images may be HEIC. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt="Recuerdo compartido por un invitado" loading="lazy" onError={() => setFailed(true)} className="h-auto w-full transition duration-500 group-hover:scale-[1.03]" />
      </button>}
  </div>;
}

export function GuestGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pages, setPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const lastUrlRefresh = useRef(0);
  const requestSequence = useRef(0);
  const [view, setView] = useState<ViewTransform>(INITIAL_TRANSFORM);
  const viewRef = useRef<ViewTransform>(INITIAL_TRANSFORM);
  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchGesture = useRef<TouchGesture | null>(null);
  const pendingAdvance = useRef<{ id: string; pageCount: number } | null>(null);
  const load = useCallback(async (pageCount: number) => {
    const sequence = ++requestSequence.current;
    try {
      const results = await Promise.all(Array.from({ length: pageCount }, async (_, index) => {
        const response = await fetch(`/api/fotos/galeria?pagina=${index}`, { cache: "no-store" });
        if (!response.ok) throw new Error("No pudimos actualizar las fotos.");
        return await response.json() as PhotoPage;
      }));
      if (sequence !== requestSequence.current) return;
      const seen = new Set<string>();
      const fresh = results.flatMap(result => result.photos).filter(photo => {
        if (seen.has(photo.id)) return false;
        seen.add(photo.id); return true;
      });
      const refreshUrls = Date.now() - lastUrlRefresh.current > 8 * 60 * 1000;
      if (refreshUrls) lastUrlRefresh.current = Date.now();
      setPhotos(previous => {
        const old = new Map(previous.map(photo => [photo.id, photo]));
        return fresh.map(photo => !refreshUrls && old.has(photo.id) ? old.get(photo.id)! : photo);
      });
      if (pendingAdvance.current && pageCount >= pendingAdvance.current.pageCount) {
        const pending = pendingAdvance.current;
        pendingAdvance.current = null;
        const index = fresh.findIndex(photo => photo.id === pending.id);
        const next = index >= 0 ? fresh[index + 1] : undefined;
        if (next) setSelected(current => current === pending.id ? next.id : current);
      }
      setHasMore(results.at(-1)?.hasMore ?? false);
      setError("");
    } catch {
      if (sequence === requestSequence.current) { pendingAdvance.current = null; setError("No pudimos actualizar las fotos. Volveremos a intentarlo."); }
    } finally {
      if (sequence === requestSequence.current) { setLoading(false); setLoadingMore(false); }
    }
  }, []);

  useEffect(() => {
    const sequenceRef = requestSequence;
    void load(pages);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(pages); }, 10000);
    const onVisible = () => { if (document.visibilityState === "visible") void load(pages); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); ++sequenceRef.current; };
  }, [load, pages]);

  const updateView = useCallback((scale: number, x = 0, y = 0) => {
    const nextScale = Math.min(4, Math.max(1, scale));
    const image = imageRef.current;
    const viewer = viewerRef.current;
    const maxX = image && viewer ? Math.max(0, (image.clientWidth * nextScale - viewer.clientWidth) / 2) : 0;
    const maxY = image && viewer ? Math.max(0, (image.clientHeight * nextScale - viewer.clientHeight) / 2) : 0;
    const next = { scale: nextScale, x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    viewRef.current = next;
    setView(next);
  }, []);
  const closeViewer = useCallback(() => {
    touchGesture.current = null;
    updateView(1);
    setSelected(null);
  }, [updateView]);

  const activeIndex = photos.findIndex(photo => photo.id === selected);
  const activePhoto = activeIndex >= 0 ? photos[activeIndex] : undefined;
  const navigate = useCallback((direction: -1 | 1) => {
    if (!selected || loadingMore) return;
    const index = photos.findIndex(photo => photo.id === selected);
    if (index < 0) return;
    const next = photos[index + direction];
    if (next) {
      updateView(1);
      setSelected(next.id);
    } else if (direction === 1 && hasMore) {
      updateView(1);
      pendingAdvance.current = { id: selected, pageCount: pages + 1 };
      setLoadingMore(true);
      setPages(value => value + 1);
    }
  }, [selected, photos, hasMore, loadingMore, pages, updateView]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, navigate, closeViewer]);

  return <div className="min-h-screen bg-[#f8f6f0] text-[#27382d]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8 sm:py-5">
      <Link href="/fotos" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#52655a] hover:text-[#27382d]"><ArrowLeft size={15} /> Subir fotos</Link>
      <Link href="/" className="font-serif text-lg italic">P & D</Link>
    </header>
    <main className="mx-auto max-w-7xl px-5 pb-20 pt-2 sm:px-8 sm:pt-14">
      <div className="flex flex-col justify-between gap-3 border-b border-[#dfe5da] pb-4 sm:flex-row sm:items-end sm:gap-7 sm:pb-8">
        <div><p className="hidden text-[10px] font-bold uppercase tracking-[.2em] text-[#9a795d] sm:block">Piero & Debby · 21 de noviembre</p><h1 className="!font-serif text-[clamp(1.9rem,7vw,2.5rem)] font-normal leading-tight tracking-[-.04em] sm:mt-4 sm:text-[clamp(2.8rem,6vw,5rem)] sm:leading-none">Un día, <span className="italic text-[#81927c]">mil recuerdos.</span></h1><p className="hidden mt-4 text-sm leading-6 text-[#718072] sm:block">Nuestro día, visto a través de tus ojos.</p></div>
        <Link href="/fotos" className="hidden h-12 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#365741] px-5 text-sm font-semibold text-white transition hover:bg-[#284632] sm:inline-flex"><Camera size={17} /> Compartir mis fotos <ArrowUpRight size={15} /></Link>
      </div>
      <div className="flex items-center justify-between gap-3 py-4 sm:gap-4 sm:py-6"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#788b7a]">Los recuerdos de todos</p><span className="inline-flex items-center gap-2 text-xs text-[#7f9180]"><span className="h-2 w-2 rounded-full bg-[#81a584]" /> Se actualiza automáticamente</span></div>
      {error && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4ece2] p-4 text-sm text-[#7d6249]"><span>{error}</span><button type="button" onClick={() => void load(pages)} className="inline-flex items-center gap-2 font-semibold"><RefreshCw size={15} /> Reintentar</button></div>}
      {loading ? <div className="py-20 text-center text-sm text-[#879588]">Cargando recuerdos...</div> : photos.length === 0 && !error ? <div className="rounded-2xl border border-dashed border-[#cbd9c8] bg-white/60 px-6 py-20 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf3ea] text-[#78917a]"><Images size={25} /></span><h2 className="mt-5 !font-serif text-2xl font-normal">Aquí empieza nuestro álbum</h2><p className="mt-2 text-sm text-[#829083]">Las fotos que compartan aparecerán aquí.</p><Link href="/fotos" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#365741] underline underline-offset-4">Compartir la primera foto <ArrowUpRight size={14} /></Link></div> : <div className="columns-3 gap-2 sm:gap-4">{photos.map(photo => <PhotoTile key={photo.id} photo={photo} onOpen={() => setSelected(photo.id)} />)}</div>}
      {hasMore && <div className="mt-8 text-center"><button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); setPages(value => value + 1); }} className="rounded-xl border border-[#c9d5c7] px-6 py-3 text-sm font-semibold text-[#365741] hover:bg-white disabled:opacity-50">{loadingMore ? "Cargando..." : "Ver más recuerdos"}</button></div>}
      <p className="mt-14 flex items-center justify-center gap-2 text-xs tracking-[.1em] text-[#a0ab9e]"><Heart size={13} /> GRACIAS POR SER PARTE DE NUESTRA HISTORIA</p>
    </main>
    {activePhoto && <div
      role="dialog" aria-modal="true" aria-label="Foto ampliada"
      ref={viewerRef}
      className="fixed inset-0 z-50 flex touch-none items-center justify-center overflow-hidden bg-[#17231c]/95 p-4"
      onClick={event => { if (event.target === event.currentTarget) closeViewer(); }}
      onTouchStart={event => {
        if (event.touches.length === 2) {
          const a = event.touches[0]!; const b = event.touches[1]!;
          touchGesture.current = { kind: "pinch", distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2, initial: viewRef.current };
        } else if (event.touches.length === 1) {
          const touch = event.touches[0]!;
          touchGesture.current = { kind: "drag", x: touch.clientX, y: touch.clientY, initial: viewRef.current };
        }
      }}
      onTouchMove={event => {
        const gesture = touchGesture.current;
        if (!gesture) return;
        if (gesture.kind === "pinch" && event.touches.length === 2 && gesture.distance > 0) {
          const a = event.touches[0]!; const b = event.touches[1]!;
          const scale = Math.min(4, Math.max(1, gesture.initial.scale * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / gesture.distance));
          const ratio = scale / gesture.initial.scale;
          const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2;
          const x = (a.clientX + b.clientX) / 2 - centerX - ratio * (gesture.x - centerX - gesture.initial.x);
          const y = (a.clientY + b.clientY) / 2 - centerY - ratio * (gesture.y - centerY - gesture.initial.y);
          updateView(scale, x, y);
        } else if (gesture.kind === "drag" && gesture.initial.scale > 1 && event.touches.length === 1) {
          const touch = event.touches[0]!;
          updateView(gesture.initial.scale, gesture.initial.x + touch.clientX - gesture.x, gesture.initial.y + touch.clientY - gesture.y);
        }
      }}
      onTouchEnd={event => {
        if (event.touches.length > 0) return;
        const gesture = touchGesture.current;
        touchGesture.current = null;
        if (!gesture || gesture.kind !== "drag" || gesture.initial.scale > 1 || event.changedTouches.length !== 1) return;
        const dx = event.changedTouches[0]!.clientX - gesture.x;
        const dy = event.changedTouches[0]!.clientY - gesture.y;
        if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.25) navigate(dx < 0 ? 1 : -1);
      }}
      onTouchCancel={() => { touchGesture.current = null; }}
    >
      <button type="button" autoFocus aria-label="Cerrar foto" onClick={closeViewer} className="absolute right-4 top-4 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"><X size={22} /></button>
      <button type="button" aria-label="Foto anterior" onClick={() => navigate(-1)} disabled={activeIndex === 0 || loadingMore} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white hover:bg-black/65 disabled:opacity-25 sm:left-6"><ChevronLeft size={23} /></button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imageRef} src={activePhoto.url} alt={`Foto ${activeIndex + 1} de la galería`} draggable={false} onDoubleClick={() => updateView(viewRef.current.scale > 1 ? 1 : 2)} className="pointer-events-auto max-h-[82vh] max-w-full select-none object-contain" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }} />
      <button type="button" aria-label="Foto siguiente" onClick={() => navigate(1)} disabled={loadingMore || (activeIndex === photos.length - 1 && !hasMore)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white hover:bg-black/65 disabled:opacity-25 sm:right-6"><ChevronRight size={23} /></button>
      <div className="absolute bottom-5 flex items-center gap-2 rounded-full bg-black/55 px-2 py-1.5 text-white">
        <button type="button" aria-label="Alejar foto" disabled={view.scale <= 1} onClick={() => updateView(view.scale - 0.5, view.x, view.y)} className="rounded-full p-2 hover:bg-white/15 disabled:opacity-35"><Minus size={19} /></button>
        <span aria-live="polite" className="min-w-16 text-center text-xs tabular-nums">{view.scale > 1 ? `${Math.round(view.scale * 100)}%` : loadingMore ? "Cargando..." : `${activeIndex + 1} / ${photos.length}${hasMore ? "+" : ""}`}</span>
        <button type="button" aria-label="Acercar foto" disabled={view.scale >= 4} onClick={() => updateView(view.scale + 0.5, view.x, view.y)} className="rounded-full p-2 hover:bg-white/15 disabled:opacity-35"><Plus size={19} /></button>
      </div>
    </div>}
  </div>;
}
