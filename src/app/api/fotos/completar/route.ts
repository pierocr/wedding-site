import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_BUCKET } from "@/lib/guestPhotos";
import { createGuestPhotoPreview } from "@/lib/guestPhotoPreviews";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let id: unknown;
  try { ({ id } = await request.json()); } catch { return Response.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const admin = getSupabaseAdmin();
    const { data: photo, error } = await admin.from("wedding_guest_photos").select("object_path,completed_at,preview_status").eq("id", id).maybeSingle();
    if (error || !photo) return Response.json({ error: "Foto no encontrada." }, { status: 404 });
    if (!photo.completed_at) {
      const { data: object, error: objectError } = await admin.storage.from(PHOTO_BUCKET).info(photo.object_path);
      if (objectError || !object) return Response.json({ error: "La foto aún no está disponible." }, { status: 409 });
      const { error: updateError } = await admin.from("wedding_guest_photos").update({ completed_at: new Date().toISOString() }).eq("id", id);
      if (updateError) throw updateError;
    }
    const previewReady = photo.preview_status === "ready" || await createGuestPhotoPreview(id, photo.object_path);
    return Response.json({ ok: true, previewReady });
  } catch (error) {
    console.error("Photo completion failed", error);
    return Response.json({ error: "No pudimos confirmar la foto." }, { status: 503 });
  }
}
