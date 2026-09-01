import { useEffect } from "react";

/** Fecha um modal quando a tecla Esc é premida, enquanto `ativo` for verdadeiro. */
export function useCloseOnEscape(ativo: boolean, fechar: () => void) {
  useEffect(() => {
    if (!ativo) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ativo, fechar]);
}
