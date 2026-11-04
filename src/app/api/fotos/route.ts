import { createHmac, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_BUCKET, PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/lib/guestPhotos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.PHOTO_UPLOADS_ENABLED === "false") {
    return Response.json({ error: "La recepción de fotos está cerrada por ahora." }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
    }
  }
  let body: { name?: unknown; size?: unknown; type?: unknown; guestName?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!body || typeof body.name !== "string" || body.name.length < 1 || body.name.length > 255 ||
      typeof body.type !== "string" || !PHOTO_TYPES[body.type] ||
      typeof body.size !== "number" || !Number.isSafeInteger(body.size) || body.size <= 0 || body.size > PHOTO_MAX_BYTES ||
      (body.guestName != null && (typeof body.guestName !== "string" || body.guestName.length > 80))) {
    return Response.json({ error: "El archivo no cumple los requisitos de formato o tamaño." }, { status: 400 });
  }
  try {
    const admin = getSupabaseAdmin();
    const id = randomUUID();
    const path = `${id}.${PHOTO_TYPES[body.type]}`;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!secret) throw new Error("Missing server secret");
    // Vercel supplies the last X-Forwarded-For entry; other deployments should set a trusted proxy.
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    const requestHash = createHmac("sha256", secret).update(ip).digest("hex");
    const { data: reserved, error: reserveError } = await admin.rpc("reserve_wedding_guest_photo", {
      p_id: id, p_path: path, p_guest_name: typeof body.guestName === "string" ? body.guestName.trim() || null : null,
      p_original_name: body.name, p_content_type: body.type, p_file_size: body.size, p_request_hash: requestHash,
    });
    if (reserveError) throw reserveError;
    if (!reserved) return Response.json({ error: "Se alcanzó el límite de subidas. Inténtalo más tarde." }, { status: 429 });
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error || new Error("No upload token");
    return Response.json({ id, path, token: data.token, bucket: PHOTO_BUCKET }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Photo upload authorization failed", error);
    return Response.json({ error: "No pudimos preparar la subida. Inténtalo nuevamente." }, { status: 503 });
  }
}
