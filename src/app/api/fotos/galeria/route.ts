import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_PREVIEW_BUCKET } from "@/lib/guestPhotos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PAGE_SIZE = 48;

export async function GET(request: Request) {
  const pageValue = new URL(request.url).searchParams.get("pagina") ?? "0";
  if (!/^\d{1,4}$/.test(pageValue)) return Response.json({ error: "Página inválida." }, { status: 400 });
  const page = Number(pageValue);
  try {
    const storage = getSupabaseAdmin().storage.from(PHOTO_PREVIEW_BUCKET);
    const { data: files, error } = await storage.list("", {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw error;
    const images = (files ?? []).filter(file => file.id && /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name));
    if (!images.length) return Response.json({ photos: [], hasMore: (files?.length ?? 0) === PAGE_SIZE }, { headers: { "Cache-Control": "no-store" } });
    const { data: urls, error: signedError } = await storage.createSignedUrls(images.map(file => file.name), 600);
    if (signedError || !urls) throw signedError || new Error("No signed URLs");
    const photos = images.flatMap((file, index) => {
      const signedUrl = urls[index]?.signedUrl;
      return signedUrl ? [{ id: file.id, url: signedUrl, createdAt: file.created_at }] : [];
    });
    return Response.json({ photos, hasMore: (files?.length ?? 0) === PAGE_SIZE }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load guest photo gallery", error);
    return Response.json({ error: "No pudimos cargar las fotos. Inténtalo nuevamente." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
