import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_BUCKET } from "@/lib/guestPhotos";

export async function GET(request: Request) {
  if (!await hasDashboardAccess()) return new Response("No autorizado", { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Solicitud inválida", { status: 400 });
  const admin = getSupabaseAdmin();
  const { data: photo } = await admin.from("wedding_guest_photos").select("object_path,original_name").eq("id", id).maybeSingle();
  if (!photo) return new Response("Foto no encontrada", { status: 404 });
  const { data, error } = await admin.storage.from(PHOTO_BUCKET).createSignedUrl(photo.object_path, 60, { download: photo.original_name });
  if (error || !data) return new Response("La foto aún no está disponible", { status: 404 });
  return Response.redirect(data.signedUrl, 303);
}
