import "server-only";
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_BUCKET, PHOTO_MAX_BYTES, PHOTO_PREVIEW_BUCKET } from "@/lib/guestPhotos";

const MAX_PIXELS = 50_000_000;

async function renderPreview(input: Buffer, path: string) {
  let pipeline: ReturnType<typeof sharp>;
  if (/\.(heic|heif)$/i.test(path)) {
    const { default: decode } = await import("heic-decode");
    const images = await decode.all({ buffer: input });
    try {
      const first = images[0];
      if (!first || !first.width || !first.height || first.width * first.height > MAX_PIXELS) throw new Error("Unsupported HEIC dimensions");
      const image = await first.decode();
      pipeline = sharp(Buffer.from(image.data), { raw: { width: image.width, height: image.height, channels: 4 }, limitInputPixels: MAX_PIXELS });
    } finally { images.dispose(); }
  } else {
    pipeline = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "warning", animated: false }).rotate();
  }
  return pipeline.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
}

export async function createGuestPhotoPreview(id: string, path: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const now = new Date();
  const stale = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const { data: claim, error: claimError } = await admin.from("wedding_guest_photos")
    .update({ preview_status: "processing", preview_attempted_at: now.toISOString() })
    .eq("id", id)
    .or(`preview_status.in.(pending,failed),and(preview_status.eq.processing,preview_attempted_at.lt.${stale})`)
    .select("id").maybeSingle();
  if (claimError) throw claimError;
  if (!claim) return false;
  let stage = "download original";
  try {
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).download(path);
    if (error || !data || !data.size || data.size > PHOTO_MAX_BYTES) throw error || new Error("Original file unavailable or too large");
    stage = "render preview";
    const output = await renderPreview(Buffer.from(await data.arrayBuffer()), path);
    if (output.length > 3 * 1024 * 1024) throw new Error("Preview too large");
    stage = `upload preview to ${PHOTO_PREVIEW_BUCKET}`;
    const { error: uploadError } = await admin.storage.from(PHOTO_PREVIEW_BUCKET).upload(`${id}.webp`, output, { contentType: "image/webp", upsert: true, cacheControl: "3600" });
    if (uploadError) throw uploadError;
    const { error: updateError } = await admin.from("wedding_guest_photos").update({ preview_status: "ready" }).eq("id", id);
    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Guest photo preview failed", id, stage, error);
    await admin.from("wedding_guest_photos").update({ preview_status: "failed" }).eq("id", id);
    return false;
  }
}
