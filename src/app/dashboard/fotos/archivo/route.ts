import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { PHOTO_BUCKET } from "@/lib/guestPhotos";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  if (!await hasDashboardAccess()) return Response.json({ error: "No autorizado." }, { status: 401 });
  const path = new URL(request.url).searchParams.get("path");
  if (!path || path.length > 1024 || /[\x00-\x1f\x7f]/.test(path)) return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().storage.from(PHOTO_BUCKET).createSignedUrl(path, 120);
  if (error || !data) return Response.json({ error: "Foto no disponible." }, { status: 404 });
  return Response.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
