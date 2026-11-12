import { guestPhotosQrSvg } from "@/lib/guestPhotosQr";

export async function GET() {
  return new Response(await guestPhotosQrSvg(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
