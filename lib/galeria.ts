import fs from "fs";
import path from "path";

const GALERIA_DIR = path.join(process.cwd(), "public", "galeria");

function listPhotos(): string[] {
  try {
    return fs
      .readdirSync(GALERIA_DIR)
      .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
      .sort();
  } catch {
    return [];
  }
}

export function getGaleriaPhotos(): string[] {
  return listPhotos();
}

export function getGaleriaPreview(count: number): string[] {
  const photos = listPhotos().slice(0, count);
  // Troca o 1º grupo de 3 com o 2º grupo de 3, para não repetir sempre as mesmas primeiras fotos.
  const firstGroup = photos.slice(0, 3);
  const secondGroup = photos.slice(3, 6);
  const rest = photos.slice(6);
  return [...secondGroup, ...firstGroup, ...rest];
}
