"use client";

import { useState } from "react";

export function PreviewRecovery() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function process() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/dashboard/fotos/procesar", { method: "POST" });
      if (!response.ok) throw new Error();
      const data = await response.json() as { processed: number; completed: number };
      setMessage(data.processed ? `Se crearon ${data.completed} de ${data.processed} vistas previas. Puedes repetir para procesar más fotos.` : "No hay fotos pendientes de procesar.");
    } catch { setMessage("No pudimos procesar las fotos. Vuelve a intentarlo."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" onClick={process} disabled={busy} className="rounded-lg border border-[#cbd7c9] px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Preparando fotos..." : "Preparar vistas previas pendientes"}</button>{message && <p role="status" className="mt-2 text-xs text-[#718072]">{message}</p>}</div>;
}
