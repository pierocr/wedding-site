import QRCode from "qrcode";
import { SITE_URL } from "@/data/site";

export const GUEST_PHOTOS_URL = new URL("/fotos", SITE_URL).toString();

const QR_OPTIONS = {
  width: 700,
  margin: 3,
  color: { dark: "#263f2e", light: "#ffffff" },
  errorCorrectionLevel: "M",
} as const;

export function guestPhotosQrDataUrl() {
  return QRCode.toDataURL(GUEST_PHOTOS_URL, QR_OPTIONS);
}

export function guestPhotosQrSvg() {
  return QRCode.toString(GUEST_PHOTOS_URL, { ...QR_OPTIONS, type: "svg" });
}
