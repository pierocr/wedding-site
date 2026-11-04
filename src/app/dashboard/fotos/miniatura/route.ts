import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { PHOTO_PREVIEW_BUCKET } from "@/lib/guestPhotos";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  if (!await hasDashboardAccess()) return new Response("No autorizado", { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return new Response("Solicitud inválida", { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin().storage.from(PHOTO_PREVIEW_BUCKET).createSignedUrl(`${id}.webp`, 60);
  if (error || !data) return new Response("Vista previa no disponible", { status: 404 });
  return new Response(null, { status: 303, headers: { Location: data.signedUrl, "Cache-Control": "private, no-store" } });
}
