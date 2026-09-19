"use client";

import { useEffect, useState } from "react";

/**
 * Ano atual lido no browser de quem visita — as páginas pré-geradas no deploy
 * ficavam com o ano desse deploy. O servidor manda o ano que conhece, e o
 * browser corrige-o se já tiver mudado.
 */
export default function AnoAtual({ inicial }: { inicial: number }) {
  const [ano, setAno] = useState(inicial);
  useEffect(() => setAno(new Date().getFullYear()), []);
  return <>{ano}</>;
}
