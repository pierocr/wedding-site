"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, X } from "lucide-react";

type Video = { id: string; created_at: string };

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
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{videos.map((video, index) => <button key={video.id} type="button" onClick={() => void open(video.id)} className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-[#e8eee5] text-[#365741] hover:bg-[#dce8d9]" aria-label={`Reproducir video ${index + 1}`}><Play size={28} /><span className="text-xs font-semibold">Ver video</span></button>)}</div>
    {more && <button type="button" onClick={() => setPages(value => value + 1)} className="mt-4 rounded-xl border border-[#c9d5c7] px-5 py-2 text-sm font-semibold">Ver más videos</button>}
    {selected && <div role="dialog" aria-modal="true" aria-label="Video compartido" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17231c]/95 p-5" onClick={event => { if (event.target === event.currentTarget) { setSelected(null); setUrl(""); } }}><button autoFocus type="button" onClick={() => { setSelected(null); setUrl(""); }} aria-label="Cerrar video" className="absolute right-4 top-4 rounded-full bg-white/15 p-3 text-white"><X size={22} /></button>{url ? <div className="w-full max-w-4xl"><video src={url} controls playsInline preload="metadata" className="max-h-[80vh] w-full" /><a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-white underline">Abrir o descargar el video si no se reproduce</a></div> : <p className="text-white">Cargando video...</p>}</div>}
  </section>;
}
