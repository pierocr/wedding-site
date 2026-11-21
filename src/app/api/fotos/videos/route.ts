import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_BUCKET } from "@/lib/guestPhotos";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const admin = getSupabaseAdmin();
  if (id) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return Response.json({ error: "Solicitud inválida." }, { status: 400 });
    const { data: video, error } = await admin.from("wedding_guest_photos").select("object_path").eq("id", id).like("content_type", "video/%").not("completed_at", "is", null).maybeSingle();
    if (error || !video) return Response.json({ error: "Video no disponible." }, { status: 404 });
    const signed = await admin.storage.from(PHOTO_BUCKET).createSignedUrl(video.object_path, 3600);
    if (signed.error || !signed.data) return Response.json({ error: "Video no disponible." }, { status: 503 });
    return Response.json({ url: signed.data.signedUrl }, { headers: { "Cache-Control": "no-store" } });
  }
  const pageValue = params.get("pagina") ?? "0";
  if (!/^\d{1,4}$/.test(pageValue)) return Response.json({ error: "Página inválida." }, { status: 400 });
  const page = Number(pageValue);
  const { data, error } = await admin.from("wedding_guest_photos").select("id,created_at").like("content_type", "video/%").not("completed_at", "is", null).order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * 24, page * 24 + 24);
  if (error) return Response.json({ error: "No pudimos cargar los videos." }, { status: 503 });
  return Response.json({ videos: (data ?? []).slice(0, 24), hasMore: (data?.length ?? 0) > 24 }, { headers: { "Cache-Control": "no-store" } });
}
