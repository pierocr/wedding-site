import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createGuestPhotoPreview } from "@/lib/guestPhotoPreviews";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!await hasDashboardAccess()) return Response.json({ error: "No autorizado." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== request.headers.get("host")) return Response.json({ error: "Solicitud no permitida." }, { status: 403 }); }
    catch { return Response.json({ error: "Solicitud no permitida." }, { status: 403 }); }
  }
  const admin = getSupabaseAdmin();
  const stale = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data, error } = await admin.from("wedding_guest_photos")
    .select("id,object_path")
    .or(`preview_status.in.(pending,failed),and(preview_status.eq.processing,preview_attempted_at.lt.${stale})`)
    .order("preview_attempted_at", { ascending: true, nullsFirst: true }).limit(5);
  if (error) return Response.json({ error: "No pudimos buscar fotos pendientes." }, { status: 503 });
  let completed = 0;
  for (const item of data ?? []) if (await createGuestPhotoPreview(item.id, item.object_path)) completed++;
  return Response.json({ processed: data?.length ?? 0, completed });
}
