"use client";

import { useState } from "react";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";

type Item = { nome: string; texto: string };
type Categoria = "alimentares" | "fisicas" | "alergias";

type Props = {
  restricoesAlimentares: Item[];
  restricoesFisicas: Item[];
  alergias: Item[];
  transparente?: boolean;
};

export default function AdminResumoRestricoes({
  restricoesAlimentares,
  restricoesFisicas,
  alergias,
  transparente,
}: Props) {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState<Categoria>("alimentares");
  useCloseOnEscape(open, () => setOpen(false));

  const abas: { valor: Categoria; label: string; itens: Item[] }[] = [
    { valor: "alimentares", label: "Alimentares", itens: restricoesAlimentares },
    { valor: "fisicas", label: "Físicas", itens: restricoesFisicas },
    { valor: "alergias", label: "Alergias", itens: alergias },
  ];

  const itensAtivos = abas.find((a) => a.valor === categoria)?.itens ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          transparente
            ? "rounded-lg border border-line bg-surface px-3 py-1.5 text-center text-sm font-medium text-ink hover:bg-surfacealt"
            : "rounded-lg border border-line px-3 py-1.5 text-left text-sm font-medium text-ink hover:bg-surfacealt"
        }
      >
        Resumo
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="flex-none text-sm font-semibold text-ink">Resumo de saúde</p>

            <div className="mt-3 inline-flex flex-none items-center gap-0.5 self-start rounded-xl border border-line bg-surfacealt p-1">
              {abas.map((aba) => (
                <button
                  key={aba.valor}
                  type="button"
                  onClick={() => setCategoria(aba.valor)}
                  className={
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
                    (categoria === aba.valor
                      ? "bg-white text-ink shadow-sm"
                      : "text-inkmuted hover:text-ink")
                  }
                >
                  {aba.label}{" "}
                  <span className={categoria === aba.valor ? "text-branddark" : "text-inksoft"}>
                    ({aba.itens.length})
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex-1 overflow-y-auto rounded-lg border border-line">
              {itensAtivos.length === 0 ? (
                <p className="p-3 text-sm text-inksoft">Ninguém indicou restrições.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {itensAtivos.map((item) => (
                    <li key={item.nome + item.texto} className="p-2.5">
                      <p className="font-medium text-ink">{item.nome}</p>
                      <p className="text-xs text-inkmuted">{item.texto}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex flex-none justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-inkmuted hover:text-ink"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
