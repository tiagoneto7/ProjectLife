import Link from "next/link";
import PhotoGallery from "@/components/PhotoGallery";
import { getGaleriaPreview } from "@/lib/galeria";

export default function Home() {
  const preview = getGaleriaPreview(8);

  return (
    <main>
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.1em] text-inksoft sm:hidden">
          Associação Project Life
        </p>
        <h1 className="mt-4 text-5xl font-semibold text-ink">Make it happen.</h1>
        <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-inkmuted">
          Acreditamos no valor de caminhar em comunidade.
          <br />
          Juntos, com fé e propósito.
        </p>

        <Link
          href="/fire"
          className="mt-8 inline-block rounded-lg bg-brand px-7 py-3.5 font-bold text-white transition hover:bg-branddark"
        >
          Inscreve-te no Fire
        </Link>

        <section className="mt-24 mb-8 text-left">
          <PhotoGallery photos={preview} layout="carousel" moreHref="/galeria" moreLabel="Ver mais" />
        </section>
      </div>
    </main>
  );
}
