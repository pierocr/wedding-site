export const PHOTO_BUCKET = "wedding-guest-photos";
export const PHOTO_PREVIEW_BUCKET = "wedding-guest-previews";
export const PHOTO_MAX_BYTES = 20 * 1024 * 1024;
export const PHOTO_MAX_BATCH = 20;
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/webp": "webp",
};

export function photoType(file: { name: string; type: string }) {
  if (PHOTO_TYPES[file.type]) return file.type;
  // Some iOS browsers omit the MIME type for HEIC files.
  if (!file.type && /\.heic$/i.test(file.name)) return "image/heic";
  if (!file.type && /\.heif$/i.test(file.name)) return "image/heif";
  return "";
}
