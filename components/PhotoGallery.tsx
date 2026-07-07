"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  photos: string[];
  layout?: "grid" | "carousel";
  moreHref?: string;
  moreLabel?: string;
};

export default function PhotoGallery({ photos, layout = "grid", moreHref, moreLabel }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openIndex, photos.length]);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  }

  const thumbClass =
    layout === "carousel"
      ? "aspect-square w-40 flex-none snap-start overflow-hidden rounded-lg bg-surfacealt sm:w-52"
      : "aspect-square overflow-hidden rounded-lg bg-surfacealt";

  return (
    <>
      <div className={layout === "carousel" ? "relative mx-auto w-fit max-w-full" : undefined}>
        {layout === "carousel" && (
          <button
            type="button"
            aria-label="Fotos anteriores"
            onClick={() => scrollByPage(-1)}
            className="absolute -left-10 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-inkmuted shadow-sm hover:text-ink sm:flex"
          >
            ‹
          </button>
        )}

        <div
          ref={scrollerRef}
          style={layout === "carousel" ? { scrollbarWidth: "none" } : undefined}
          className={
            layout === "carousel"
              ? "flex w-[676px] max-w-full gap-3 overflow-x-auto scroll-smooth pb-1 snap-x snap-mandatory [-ms-overflow-style:none] sm:w-[868px] [&::-webkit-scrollbar]:hidden"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3"
          }
        >
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setOpenIndex(i)}
              className={thumbClass}
            >
              <Image
                src={`/galeria/${photo}`}
                alt=""
                width={400}
                height={400}
                className="h-full w-full object-cover transition hover:scale-105"
              />
            </button>
          ))}

          {moreHref && (
            <Link
              href={moreHref}
              className={
                layout === "carousel"
                  ? "flex aspect-square w-40 flex-none snap-start items-center justify-center rounded-lg bg-surfacealt text-sm font-semibold text-branddark sm:w-52"
                  : "flex aspect-square items-center justify-center rounded-lg bg-surfacealt text-sm font-semibold text-branddark"
              }
            >
              {moreLabel ?? "Ver mais"} →
            </Link>
          )}
        </div>

        {layout === "carousel" && (
          <button
            type="button"
            aria-label="Fotos seguintes"
            onClick={() => scrollByPage(1)}
            className="absolute -right-10 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-inkmuted shadow-sm hover:text-ink sm:flex"
          >
            ›
          </button>
        )}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute right-5 top-5 text-3xl text-white/80 hover:text-white"
            onClick={() => setOpenIndex(null)}
          >
            ×
          </button>

          <button
            type="button"
            aria-label="Foto anterior"
            className="absolute left-2 text-4xl text-white/70 hover:text-white sm:left-6"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
            }}
          >
            ‹
          </button>

          <Image
            src={`/galeria/${photos[openIndex]}`}
            alt=""
            width={1200}
            height={1200}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            aria-label="Foto seguinte"
            className="absolute right-2 text-4xl text-white/70 hover:text-white sm:right-6"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
            }}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
