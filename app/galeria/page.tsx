import PhotoGallery from "@/components/PhotoGallery";
import { getGaleriaPhotos } from "@/lib/galeria";

export const metadata = {
  title: "Galeria | Project Life",
  description: "Fotos das edições anteriores do Fire e de outros eventos da associação.",
};

export default function GaleriaPage() {
  const photos = getGaleriaPhotos();

  return (
    <main>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-semibold text-ink">Galeria</h1>
          <p className="mt-3 text-inkmuted">
            Recorda as edições anteriores do Fire e outros eventos da associação.
          </p>
        </header>

        <PhotoGallery photos={photos} />
      </div>
    </main>
  );
}
