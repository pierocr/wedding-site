"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";

type Video = { id: string; created_at: string };

function VideoTile({ video, index, onOpen }: { video: Video; index: number; onOpen: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    fetch(`/api/fotos/videos?id=${encodeURIComponent(video.id)}`, { signal: controller.signal, cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error(); return response.json() as Promise<{ url: string }>; })
      .then(data => setPreviewUrl(data.url))
      .catch(() => {});
    return () => controller.abort();
  }, [visible, video.id]);

  return <button ref={buttonRef} type="button" onClick={onOpen} className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[#e8eee5] text-[#365741] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365741]" aria-label={`Reproducir video ${index + 1}`}>
    {previewUrl && <video aria-hidden="true" muted playsInline preload="metadata" src={`${previewUrl}#t=0.1`} onLoadedData={() => setReady(true)} onError={() => setReady(false)} className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition duration-300 ${ready ? "opacity-100 group-hover:scale-105" : "opacity-0"}`} />}
    <span className={`relative flex flex-col items-center gap-2 ${ready ? "text-white drop-shadow-lg" : "text-[#365741]"}`}><span className={`rounded-full p-3 ${ready ? "bg-black/45" : ""}`}><Play size={28} fill={ready ? "currentColor" : "none"} /></span><span className={`text-xs font-semibold ${ready ? "rounded-full bg-black/45 px-3 py-1" : ""}`}>Ver video</span></span>
  </button>;
}

export function GuestVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [pages, setPages] = useState(1);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const results = await Promise.all(Array.from({ length: pages }, async (_, index) => {
        const response = await fetch(`/api/fotos/videos?pagina=${index}`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        return await response.json() as { videos: Video[]; hasMore: boolean };
      }));
      const seen = new Set<string>();
      setVideos(results.flatMap(result => result.videos).filter(item => !seen.has(item.id) && !!seen.add(item.id)));
      setMore(results.at(-1)?.hasMore ?? false);
      setError("");
    } catch { setError("No pudimos cargar los videos. Inténtalo de nuevo."); }
  }, [pages]);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => window.clearInterval(timer);
  }, [load]);
  async function open(id: string) {
    setSelected(id); setUrl(""); setError("");
    try {
      const response = await fetch(`/api/fotos/videos?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json() as { url: string };
      setUrl(data.url);
    } catch { setError("No pudimos abrir este video. Inténtalo nuevamente."); setSelected(null); }
  }
  if (!videos.length && !error) return null;
  return <section className="mt-10" aria-label="Videos compartidos">
    <h2 className="!font-serif text-2xl font-normal text-[#365741]">Videos compartidos</h2>
    {error && <p role="alert" className="mt-3 text-sm text-[#a44e3f]">{error}</p>}
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{videos.map((video, index) => <VideoTile key={video.id} video={video} index={index} onOpen={() => void open(video.id)} />)}</div>
    {more && <button type="button" onClick={() => setPages(value => value + 1)} className="mt-4 rounded-xl border border-[#c9d5c7] px-5 py-2 text-sm font-semibold">Ver más videos</button>}
    {selected && <div role="dialog" aria-modal="true" aria-label="Video compartido" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17231c]/95 p-5" onClick={event => { if (event.target === event.currentTarget) { setSelected(null); setUrl(""); } }}><button autoFocus type="button" onClick={() => { setSelected(null); setUrl(""); }} aria-label="Cerrar video" className="absolute right-4 top-4 rounded-full bg-white/15 p-3 text-white"><X size={22} /></button>{url ? <div className="w-full max-w-4xl"><video src={url} controls playsInline preload="metadata" className="max-h-[80vh] w-full" /><a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-white underline">Abrir o descargar el video si no se reproduce</a></div> : <p className="text-white">Cargando video...</p>}</div>}
  </section>;
}
