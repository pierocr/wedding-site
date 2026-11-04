import type { Metadata } from "next";
import { GuestGallery } from "./guest-gallery";

export const metadata: Metadata = {
  title: "Nuestro álbum compartido",
  description: "Los recuerdos compartidos del matrimonio de Piero y Debby.",
  robots: { index: false, follow: false },
};

export default function GalleryPage() {
  return <GuestGallery />;
}
