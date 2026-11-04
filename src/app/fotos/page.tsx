import type { Metadata } from "next";
import { PhotoUpload } from "./photo-upload";

export const metadata: Metadata = {
  title: "Comparte tus fotos",
  description: "Comparte tus recuerdos del matrimonio de Piero y Debby.",
  robots: { index: false, follow: false },
};

export default function FotosPage() {
  return <PhotoUpload />;
}
