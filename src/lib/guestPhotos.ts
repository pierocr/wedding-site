export const PHOTO_BUCKET = "wedding-guest-photos";
export const PHOTO_PREVIEW_BUCKET = "wedding-guest-previews";
export const PHOTO_MAX_BYTES = 100 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 1024 * 1024 * 1024;
export const PHOTO_MAX_BATCH = 20;
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/3gpp": "3gp",
  "video/x-m4v": "m4v",
};

export function photoType(file: { name: string; type: string }) {
  if (PHOTO_TYPES[file.type]) return file.type;
  // Some iOS browsers omit the MIME type for HEIC files.
  if (!file.type && /\.mp4$/i.test(file.name)) return "video/mp4";
  if (!file.type && /\.mov$/i.test(file.name)) return "video/quicktime";
  if (!file.type && /\.webm$/i.test(file.name)) return "video/webm";
  if (!file.type && /\.heic$/i.test(file.name)) return "image/heic";
  if (!file.type && /\.heif$/i.test(file.name)) return "image/heif";
  return "";
}

export function mediaMaxBytes(type: string) { return type.startsWith("video/") ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES; }
