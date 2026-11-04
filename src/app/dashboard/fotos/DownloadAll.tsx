"use client";

import { Download } from "lucide-react";
import { useState } from "react";

type Photo = { path: string; name: string; size: number };
type SavePickerWindow = Window & { showSaveFilePicker?: (options: object) => Promise<{ createWritable(): Promise<WritableStream<Uint8Array>> }> };
const MEMORY_LIMIT = 256 * 1024 * 1024;

function safeName(name: string) {
  const cleaned = name.replace(/[\\/\x00-\x1f\x7f<>:"|?*]/g, "_").replace(/^\.+/, "").trim();
  const extension = cleaned.match(/\.[a-z0-9]{1,10}$/i)?.[0] || "";
  const stem = extension ? cleaned.slice(0, -extension.length) : cleaned;
  return `${stem.slice(0, 180 - extension.length) || "foto"}${extension}`;
}

export function DownloadAll({ disabled }: { disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function download() {
    if (busy) return;
    setBusy(true); setMessage("");
    let output: WritableStream<Uint8Array> | undefined;
    try {
      // The picker must be opened directly from the user's click, before awaiting other work.
      const picker = (window as SavePickerWindow).showSaveFilePicker;
      if (picker) {
        const handle = await picker.call(window, { suggestedName: "fotos-matrimonio-piero-debby.zip", types: [{ description: "Archivo ZIP", accept: { "application/zip": [".zip"] } }] });
        output = await handle.createWritable();
      }
      setMessage("Buscando las fotos...");
      const photos: Photo[] = [];
      const visited = new Set<string>();
      let cursor: string | null = null;
      do {
        const response = await fetch(`/dashboard/fotos/archivos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store" });
        if (!response.ok) throw new Error("No pudimos obtener la lista de fotos.");
        const data = await response.json() as { photos: Photo[]; nextCursor: string | null };
        photos.push(...data.photos);
        cursor = data.nextCursor;
        if (cursor && visited.has(cursor)) throw new Error("No pudimos completar la lista de fotos.");
        if (cursor) visited.add(cursor);
      } while (cursor);
      if (!photos.length) throw new Error("Todavía no hay fotos para descargar.");
      if (!output && (photos.some(photo => !Number.isFinite(photo.size) || photo.size <= 0) || photos.reduce((total, photo) => total + photo.size, 0) > MEMORY_LIMIT)) {
        throw new Error("Para descargar esta cantidad de fotos, abre el dashboard en Chrome o Edge desde un computador con conexión HTTPS.");
      }
      const { ZipWriter, BlobWriter } = await import("@zip.js/zip.js");
      const blobWriter = output ? null : new BlobWriter("application/zip");
      const zip = new ZipWriter(output ?? blobWriter!, { level: 0, zip64: true, useWebWorkers: false });
      for (let index = 0; index < photos.length; index++) {
        const photo = photos[index]!;
        setMessage(`Preparando foto ${index + 1} de ${photos.length}...`);
        const authorization = await fetch(`/dashboard/fotos/archivo?path=${encodeURIComponent(photo.path)}`, { cache: "no-store" });
        if (!authorization.ok) throw new Error(`No pudimos acceder a la foto ${index + 1}. Inténtalo nuevamente.`);
        const { url } = await authorization.json() as { url: string };
        const response = await fetch(url);
        if (!response.ok || !response.body) throw new Error(`No pudimos descargar la foto ${index + 1}. Inténtalo nuevamente.`);
        await zip.add(`${String(index + 1).padStart(5, "0")}_${safeName(photo.name)}`, response.body);
      }
      setMessage("Finalizando el ZIP...");
      const blob = await zip.close();
      if (blobWriter && blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = "fotos-matrimonio-piero-debby.zip"; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
      setMessage(`Listo: ${photos.length} fotos guardadas en el ZIP.`);
    } catch (error) {
      if (output) await output.abort().catch(() => {});
      if (error instanceof DOMException && error.name === "AbortError") setMessage("Descarga cancelada.");
      else setMessage(error instanceof Error ? error.message : "No pudimos preparar el ZIP. Inténtalo nuevamente.");
    } finally { setBusy(false); }
  }
  return <div className="flex flex-col items-start gap-2 sm:items-end"><button type="button" onClick={download} disabled={disabled || busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#365741] px-4 py-2 text-sm font-semibold text-white hover:bg-[#284632] disabled:opacity-50"><Download size={16} />{busy ? "Preparando ZIP..." : "Descargar todas"}</button>{message && <p role="status" aria-live="polite" className="max-w-sm text-xs leading-5 text-[#718072] sm:text-right">{message}</p>}</div>;
}
