"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Heart, ImagePlus, Images, RefreshCw, X } from "lucide-react";
import { Upload } from "tus-js-client";
import { PHOTO_MAX_BATCH, mediaMaxBytes, photoType } from "@/lib/guestPhotos";

type Photo = { id: string; file: File; preview?: string | undefined; status: "ready" | "uploading" | "done" | "error"; progress: number; error?: string | undefined; uploadId?: string | undefined };

export function PhotoUpload() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [guestName, setGuestName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const nextPhotoId = useRef(0);
  const photosRef = useRef<Photo[]>([]);
  const authorizations = useRef(new Map<string, { id: string; path: string; token: string; bucket: string }>());
  function update(fn: (items: Photo[]) => Photo[]) {
    setPhotos(previous => { const next = fn(previous); photosRef.current = next; return next; });
  }
  function choose(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files);
    const invalid = incoming.filter(file => !photoType(file) || !file.size || file.size > mediaMaxBytes(photoType(file)));
    const valid = incoming.filter(file => photoType(file) && file.size > 0 && file.size <= mediaMaxBytes(photoType(file)));
    const available = Math.max(0, PHOTO_MAX_BATCH - photosRef.current.filter(item => item.status !== "done").length);
    const added = valid.slice(0, available).map(file => ({ id: String(nextPhotoId.current++), file, preview: photoType(file).startsWith("image/") && photoType(file) !== "image/heic" && photoType(file) !== "image/heif" ? URL.createObjectURL(file) : undefined, status: "ready" as const, progress: 0 }));
    update(items => { for (const item of items) if (item.status === "done" && item.preview) URL.revokeObjectURL(item.preview); return [...items.filter(item => item.status !== "done"), ...added]; });
    setNotice(invalid.length ? "Algunos archivos no se agregaron. Usa fotos de hasta 100 MB o videos MP4, MOV, WebM o 3GP de hasta 1 GB." : valid.length > available ? `Puedes seleccionar hasta ${PHOTO_MAX_BATCH} archivos por envío.` : "");
    if (input.current) input.current.value = "";
  }
  function remove(id: string) {
    update(items => { const photo = items.find(item => item.id === id); if (photo?.preview) URL.revokeObjectURL(photo.preview); return items.filter(item => item.id !== id); });
  }
  function patch(id: string, changes: Partial<Photo>) { update(items => items.map(item => item.id === id ? { ...item, ...changes } : item)); }
  async function send() {
    if (busy) return;
    setBusy(true); setNotice("");
    const pending = photosRef.current.filter(item => item.status === "ready" || item.status === "error");
    let previewDelayed = false;
    for (const item of pending) {
      try {
        patch(item.id, { status: "uploading", progress: 0, error: undefined });
        let uploadId = item.uploadId;
        if (!uploadId) {
          let data = authorizations.current.get(item.id);
          if (!data) {
            const response = await fetch("/api/fotos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: item.file.name, size: item.file.size, type: photoType(item.file), guestName }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "No pudimos iniciar la subida.");
            data = result as { id: string; path: string; token: string; bucket: string };
            authorizations.current.set(item.id, data);
          }
          const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (!base || !key) throw new Error("La subida aún no está configurada.");
          const url = new URL(base);
          if (url.hostname.endsWith(".supabase.co")) url.hostname = url.hostname.replace(".supabase.co", ".storage.supabase.co");
          const authorization = data;
          await new Promise<void>((resolve, reject) => {
            const upload = new Upload(item.file, {
              endpoint: `${url.origin}/storage/v1/upload/resumable/sign`,
              headers: { "x-signature": authorization.token, apikey: key },
              metadata: { bucketName: authorization.bucket, objectName: authorization.path, contentType: photoType(item.file), cacheControl: "3600" },
              fingerprint: async () => `wedding-upload-${authorization.id}`,
              chunkSize: 6 * 1024 * 1024, retryDelays: [0, 3000, 5000, 10000, 20000], uploadDataDuringCreation: true, removeFingerprintOnSuccess: true,
              onProgress: (sent, total) => patch(item.id, { progress: Math.round(sent / total * 100) }),
              onError: () => reject(new Error("No pudimos subir este archivo. Revisa tu conexión y vuelve a intentar.")), onSuccess: () => resolve(),
            });
            void upload.findPreviousUploads().then(previous => { if (previous.length) upload.resumeFromPreviousUpload(previous[0]!); upload.start(); }).catch(reject);
          });
          uploadId = authorization.id;
          authorizations.current.delete(item.id);
          patch(item.id, { uploadId });
        }
        const completion = await fetch("/api/fotos/completar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: uploadId }) });
        if (!completion.ok) throw new Error("El archivo se subió, pero falta confirmarlo. Vuelve a intentar.");
        const confirmation = await completion.json();
        if (!confirmation.previewReady) previewDelayed = true;
        patch(item.id, { status: "done", progress: 100 });
      } catch (error) { patch(item.id, { status: "error", error: error instanceof Error ? error.message : "No pudimos subir este archivo." }); }
    }
    if (previewDelayed) setNotice("Tus fotos se guardaron, pero algunas pueden tardar en aparecer en la galería.");
    setBusy(false);
  }
  const pending = photos.filter(item => item.status !== "done").length;
  const completed = photos.filter(item => item.status === "done").length;
  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#27382d]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-[#52655a] hover:text-[#27382d]"><ArrowLeft size={15} /> Volver al sitio</Link>
        <span className="font-serif text-lg italic">P & D</span>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-5 px-5 pb-12 pt-3 sm:px-8 lg:grid-cols-[.85fr_1fr] lg:gap-20 lg:pt-14">
        <section className="lg:sticky lg:top-12 lg:self-start">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#9a795d] lg:mb-5 lg:text-[11px]">21 de noviembre · 2026</p>
          <h1 className="!font-serif text-[clamp(2.3rem,7vw,5.5rem)] font-normal leading-[1.05] tracking-[-.04em]">Un día, mil <span className="italic text-[#81927c]">miradas.</span></h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#667268] lg:mt-6 lg:text-base">Comparte con nosotros tus fotos y videos favoritos de este día.</p>
          <div className="relative mt-9 hidden h-[310px] overflow-hidden rounded-t-[140px] rounded-b-[10px] lg:block">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/gallery/CivilDP-327.webp')" }} />
            <div className="absolute inset-0 bg-[#263d2e]/10" />
          </div>
          <p className="mt-5 hidden items-center gap-2 text-xs tracking-wide text-[#879188] lg:flex"><Heart size={14} /> Gracias por ser parte de nuestra historia.</p>
        </section>
        <section className="min-w-0 rounded-[24px] border border-[#e6e8dd] bg-white p-5 shadow-[0_20px_70px_rgba(47,63,45,.07)] sm:p-8" aria-labelledby="upload-title">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a48a70]">Nuestro álbum compartido</p><h2 id="upload-title" className="mt-2 !font-serif text-2xl font-normal tracking-normal sm:text-3xl">Tus recuerdos, aquí</h2></div><div className="rounded-full bg-[#eff3ea] p-3 text-[#6d846b]"><Camera size={21} /></div></div>
          
          <div className="relative mt-5 flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8c9b7] bg-[#f7faf5] px-4 py-5 text-center transition hover:border-[#789479] hover:bg-[#f0f6ee] focus-within:ring-2 focus-within:ring-[#718b72]">
            <span aria-hidden="true" className="rounded-full bg-white p-3 text-[#6f8b70] shadow-sm"><ImagePlus size={23} /></span>
            <span className="mt-3 text-sm font-semibold">Elegir fotos y videos</span>
            <span className="mt-1 text-xs text-[#8a988b]">Hasta 100 MB por foto y 1 GB por video</span>
            <input ref={input} id="photo-files" aria-label="Elegir fotos y videos" type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.heic,.heif,video/mp4,video/quicktime,video/webm,video/3gpp,video/x-m4v,.mp4,.mov,.webm,.3gp,.m4v" multiple className="absolute inset-0 h-full w-full cursor-pointer text-base opacity-0 disabled:cursor-not-allowed" onChange={event => choose(event.target.files)} disabled={busy || photos.filter(item => item.status !== "done").length >= PHOTO_MAX_BATCH} />
          </div>
          <label htmlFor="guest-name" className="mt-5 block text-sm font-semibold">Tu nombre <span className="font-normal text-[#929b92]">(opcional)</span></label>
          <input id="guest-name" maxLength={80} value={guestName} onChange={event => setGuestName(event.target.value)} disabled={busy} placeholder="¿Quién comparte estos recuerdos?" className="mt-2 h-12 w-full rounded-xl border border-[#e2e7de] bg-[#fafbf8] px-4 text-base outline-none placeholder:text-[#a8b0a6] focus:border-[#718b72] focus:ring-2 focus:ring-[#dce8d9]" />
          {notice && <p role="alert" className="mt-3 text-sm text-[#a44e3f]">{notice}</p>}
          {photos.length > 0 && <div className="mt-6"><div className="mb-3 flex justify-between text-xs font-semibold uppercase tracking-[.12em] text-[#7e8d7f]"><span>Archivos seleccionados</span><span>{photos.length} / {PHOTO_MAX_BATCH}</span></div><ul className="space-y-2">{photos.map(item => <li key={item.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-[#f8faf6] p-2.5"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8eee5] text-[#7b907b]">{item.preview ? <img src={item.preview} alt="" className="h-full w-full object-cover" /> : <Camera size={19} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.file.name}</p><p className={`mt-0.5 text-xs ${item.status === "error" ? "text-[#ad5849]" : "text-[#869387]"}`}>{item.status === "done" ? "Compartida ✓" : item.status === "uploading" ? `Subiendo · ${item.progress}%` : item.status === "error" ? item.error : `${(item.file.size / 1024 / 1024).toFixed(1)} MB`}</p>{item.status === "uploading" && <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#dce7d9]"><div className="h-full bg-[#719276]" style={{ width: `${item.progress}%` }} /></div>}</div>{!busy && item.status !== "done" && <button type="button" onClick={() => remove(item.id)} aria-label={`Quitar ${item.file.name}`} className="rounded-full p-2 text-[#8b998c] hover:bg-[#e9eee7]"><X size={16} /></button>}{item.status === "done" && <Check size={18} className="mr-2 shrink-0 text-[#719276]" />}</li>)}</ul></div>}
          {completed > 0 && pending === 0 && <p role="status" className="mt-5 rounded-xl bg-[#edf5eb] p-4 text-sm leading-6 text-[#486d4c]">¡Gracias! Tus recuerdos ya son parte de nuestros recuerdos. <Heart className="inline" size={14} /></p>}
          <button type="button" onClick={send} disabled={busy || !pending} className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#365741] px-4 text-sm font-semibold text-white transition hover:bg-[#284632] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Compartiendo archivos..." : photos.some(item => item.status === "error") ? <><RefreshCw size={16} /> Reintentar archivos pendientes</> : <>Compartir mis recuerdos <ArrowRight size={17} /></>}</button>
          <p className="mt-5 text-xs leading-5 text-[#899489]">Las fotos y videos aparecerán en la galería y pueden incluir datos de ubicación. Mantén esta página abierta hasta terminar la subida.</p><Link href="/fotos/galeria" className="mt-4 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#cbdac9] bg-[#f0f6ee] px-4 py-3 text-sm font-semibold text-[#365741] no-underline transition hover:border-[#a8c0a5] hover:bg-[#e5f0e3] hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365741]"><Images size={17} aria-hidden="true" /> Ver la galería <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </div>
      <footer className="pb-8 text-center text-xs tracking-[.12em] text-[#9ba79a]">CON CARIÑO, PIERO & DEBBY</footer>
    </div>
  );
}
