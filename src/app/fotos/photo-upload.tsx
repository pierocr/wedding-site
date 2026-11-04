"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Heart, ImagePlus, RefreshCw, X } from "lucide-react";
import { Upload } from "tus-js-client";
import { PHOTO_MAX_BATCH, PHOTO_MAX_BYTES, photoType } from "@/lib/guestPhotos";

type Photo = { id: string; file: File; preview?: string | undefined; status: "ready" | "uploading" | "done" | "error"; progress: number; error?: string | undefined; uploadId?: string | undefined };

export function PhotoUpload() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [guestName, setGuestName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const nextPhotoId = useRef(0);
  const photosRef = useRef<Photo[]>([]);
  function update(fn: (items: Photo[]) => Photo[]) {
    setPhotos(previous => { const next = fn(previous); photosRef.current = next; return next; });
  }
  function choose(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files);
    const invalid = incoming.filter(file => !photoType(file) || !file.size || file.size > PHOTO_MAX_BYTES);
    const valid = incoming.filter(file => photoType(file) && file.size > 0 && file.size <= PHOTO_MAX_BYTES);
    const available = Math.max(0, PHOTO_MAX_BATCH - photosRef.current.length);
    const added = valid.slice(0, available).map(file => ({ id: String(nextPhotoId.current++), file, preview: file.type !== "image/heic" && file.type !== "image/heif" ? URL.createObjectURL(file) : undefined, status: "ready" as const, progress: 0 }));
    update(items => [...items, ...added]);
    setNotice(invalid.length ? "Algunas fotos no se agregaron. Usa JPG, PNG, HEIC, HEIF o WebP de hasta 20 MB." : valid.length > available ? `Puedes seleccionar hasta ${PHOTO_MAX_BATCH} fotos por envío.` : "");
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
          const response = await fetch("/api/fotos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: item.file.name, size: item.file.size, type: photoType(item.file), guestName }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "No pudimos iniciar la subida.");
          const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (!base || !key) throw new Error("La subida aún no está configurada.");
          const url = new URL(base);
          if (url.hostname.endsWith(".supabase.co")) url.hostname = url.hostname.replace(".supabase.co", ".storage.supabase.co");
          await new Promise<void>((resolve, reject) => {
            const upload = new Upload(item.file, {
              endpoint: `${url.origin}/storage/v1/upload/resumable/sign`,
              headers: { "x-signature": data.token, apikey: key },
              metadata: { bucketName: data.bucket, objectName: data.path, contentType: photoType(item.file), cacheControl: "3600" },
              chunkSize: 6 * 1024 * 1024, retryDelays: [0, 3000, 5000, 10000, 20000], uploadDataDuringCreation: true, removeFingerprintOnSuccess: true,
              onProgress: (sent, total) => patch(item.id, { progress: Math.round(sent / total * 100) }),
              onError: () => reject(new Error("No pudimos subir esta foto. Revisa tu conexión y vuelve a intentar.")), onSuccess: () => resolve(),
            });
            upload.start();
          });
          uploadId = data.id;
          patch(item.id, { uploadId });
        }
        const completion = await fetch("/api/fotos/completar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: uploadId }) });
        if (!completion.ok) throw new Error("La foto se subió, pero falta confirmarla. Vuelve a intentar.");
        const confirmation = await completion.json();
        if (!confirmation.previewReady) previewDelayed = true;
        patch(item.id, { status: "done", progress: 100 });
      } catch (error) { patch(item.id, { status: "error", error: error instanceof Error ? error.message : "No pudimos subir esta foto." }); }
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
      <div className="mx-auto grid max-w-6xl gap-5 px-5 pb-12 pt-3 sm:px-8 lg:grid-cols-[.85fr_1fr] lg:gap-20 lg:pt-14">
        <section className="lg:sticky lg:top-12 lg:self-start">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#9a795d] lg:mb-5 lg:text-[11px]">21 de noviembre · 2026</p>
          <h1 className="!font-serif text-[clamp(2.3rem,7vw,5.5rem)] font-normal leading-[1.05] tracking-[-.04em]">Un día, mil <span className="italic text-[#81927c]">miradas.</span></h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#667268] lg:mt-6 lg:text-base">Comparte con nosotros tus fotos favoritas de este día.</p>
          <div className="relative mt-9 hidden h-[310px] overflow-hidden rounded-t-[140px] rounded-b-[10px] lg:block">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/gallery/CivilDP-327.webp')" }} />
            <div className="absolute inset-0 bg-[#263d2e]/10" />
          </div>
          <p className="mt-5 hidden items-center gap-2 text-xs tracking-wide text-[#879188] lg:flex"><Heart size={14} /> Gracias por ser parte de nuestra historia.</p>
        </section>
        <section className="rounded-[24px] border border-[#e6e8dd] bg-white p-5 shadow-[0_20px_70px_rgba(47,63,45,.07)] sm:p-8" aria-labelledby="upload-title">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a48a70]">Nuestro álbum compartido</p><h2 id="upload-title" className="mt-2 !font-serif text-2xl font-normal tracking-normal sm:text-3xl">Tus recuerdos, aquí</h2></div><div className="rounded-full bg-[#eff3ea] p-3 text-[#6d846b]"><Camera size={21} /></div></div>
          
          <div className="relative mt-5 flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8c9b7] bg-[#f7faf5] px-4 py-5 text-center transition hover:border-[#789479] hover:bg-[#f0f6ee] focus-within:ring-2 focus-within:ring-[#718b72]">
            <span aria-hidden="true" className="rounded-full bg-white p-3 text-[#6f8b70] shadow-sm"><ImagePlus size={23} /></span>
            <span className="mt-3 text-sm font-semibold">Elegir fotos</span>
            <span className="mt-1 text-xs text-[#8a988b]">Hasta 20 MB por foto</span>
            <input ref={input} id="photo-files" aria-label="Elegir fotos" type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.heic,.heif" multiple className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" onChange={event => choose(event.target.files)} disabled={busy || photos.length >= PHOTO_MAX_BATCH} />
          </div>
          <label htmlFor="guest-name" className="mt-5 block text-sm font-semibold">Tu nombre <span className="font-normal text-[#929b92]">(opcional)</span></label>
          <input id="guest-name" maxLength={80} value={guestName} onChange={event => setGuestName(event.target.value)} disabled={busy} placeholder="¿Quién comparte estas fotos?" className="mt-2 h-12 w-full rounded-xl border border-[#e2e7de] bg-[#fafbf8] px-4 text-sm outline-none placeholder:text-[#a8b0a6] focus:border-[#718b72] focus:ring-2 focus:ring-[#dce8d9]" />
          {notice && <p role="alert" className="mt-3 text-sm text-[#a44e3f]">{notice}</p>}
          {photos.length > 0 && <div className="mt-6"><div className="mb-3 flex justify-between text-xs font-semibold uppercase tracking-[.12em] text-[#7e8d7f]"><span>Fotos seleccionadas</span><span>{photos.length} / {PHOTO_MAX_BATCH}</span></div><ul className="space-y-2">{photos.map(item => <li key={item.id} className="flex items-center gap-3 rounded-xl bg-[#f8faf6] p-2.5"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8eee5] text-[#7b907b]">{item.preview ? <img src={item.preview} alt="" className="h-full w-full object-cover" /> : <Camera size={19} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.file.name}</p><p className={`mt-0.5 text-xs ${item.status === "error" ? "text-[#ad5849]" : "text-[#869387]"}`}>{item.status === "done" ? "Compartida ✓" : item.status === "uploading" ? `Subiendo · ${item.progress}%` : item.status === "error" ? item.error : `${(item.file.size / 1024 / 1024).toFixed(1)} MB`}</p>{item.status === "uploading" && <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#dce7d9]"><div className="h-full bg-[#719276]" style={{ width: `${item.progress}%` }} /></div>}</div>{!busy && item.status !== "done" && <button type="button" onClick={() => remove(item.id)} aria-label={`Quitar ${item.file.name}`} className="rounded-full p-2 text-[#8b998c] hover:bg-[#e9eee7]"><X size={16} /></button>}{item.status === "done" && <Check size={18} className="mr-2 shrink-0 text-[#719276]" />}</li>)}</ul></div>}
          {completed > 0 && pending === 0 && <p role="status" className="mt-5 rounded-xl bg-[#edf5eb] p-4 text-sm leading-6 text-[#486d4c]">¡Gracias! Tus fotos ya son parte de nuestros recuerdos. <Heart className="inline" size={14} /></p>}
          <button type="button" onClick={send} disabled={busy || !pending} className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#365741] px-4 text-sm font-semibold text-white transition hover:bg-[#284632] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Compartiendo fotos..." : photos.some(item => item.status === "error") ? <><RefreshCw size={16} /> Reintentar fotos pendientes</> : <>Compartir mis fotos <ArrowRight size={17} /></>}</button>
          <p className="mt-5 text-xs leading-5 text-[#899489]">Las fotos aparecerán en la galería y pueden incluir datos de ubicación.</p><Link href="/fotos/galeria" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#365741] underline underline-offset-4">Ver la galería <ArrowRight size={15} /></Link>
        </section>
      </div>
      <footer className="pb-8 text-center text-xs tracking-[.12em] text-[#9ba79a]">CON CARIÑO, PIERO & DEBBY</footer>
    </div>
  );
}
