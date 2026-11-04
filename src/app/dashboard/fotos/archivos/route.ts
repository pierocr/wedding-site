import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { PHOTO_BUCKET } from "@/lib/guestPhotos";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await hasDashboardAccess()) return Response.json({ error: "No autorizado." }, { status: 401 });
  const cursor = new URL(request.url).searchParams.get("cursor");
  if (cursor && cursor.length > 4096) return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  try {
    const admin = getSupabaseAdmin();
    const options = cursor ? { limit: 100, cursor } : { limit: 100 };
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).listV2(options);
    if (error) throw error;
    if (data.hasNext && !data.nextCursor) throw new Error("Missing Storage continuation cursor");
    const files = data.objects.filter(file => file.id && !file.is_delete_marker);
    const paths = files.map(file => file.name);
    let names = new Map<string, string>();
    if (paths.length) {
      const result = await admin.from("wedding_guest_photos").select("object_path,original_name").in("object_path", paths);
      if (result.error) throw result.error;
      names = new Map((result.data ?? []).map(row => [row.object_path, row.original_name]));
    }
    const photos = files.map(file => ({ path: file.name, name: names.get(file.name) || file.name, size: Number(file.metadata?.size ?? 0) }));
    return Response.json({ photos, nextCursor: data.hasNext ? data.nextCursor : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Could not list original photos", error);
    return Response.json({ error: "No pudimos obtener la lista de fotos." }, { status: 503 });
  }
}
