"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

export function PhotoThumbnail({ id, ready }: { id: string; ready: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!ready || failed) {
    return <span role="img" aria-label="Vista previa no disponible" title="Vista previa no disponible" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#edf1e9] text-[#96a697] sm:h-14 sm:w-14"><ImageOff size={20} aria-hidden="true" /></span>;
  }
  return (
    // Las URLs firmadas se generan al cargar la imagen y provienen de Storage privado.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/dashboard/fotos/miniatura?id=${id}`} alt="Vista previa de la foto" loading="lazy" onError={() => setFailed(true)} className="h-12 w-12 shrink-0 rounded-lg bg-[#edf1e9] object-cover sm:h-14 sm:w-14" />
  );
}
