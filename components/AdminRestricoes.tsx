"use client";

import { useState } from "react";

type Item = { nome: string; texto: string };

export default function AdminRestricoes({ titulo, itens }: { titulo: string; itens: Item[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surfacealt"
      >
        {titulo} ({itens.length})
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">{titulo}</p>

            <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-lg border border-line">
              {itens.length === 0 ? (
                <p className="p-3 text-sm text-inksoft">Ninguém indicou restrições.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {itens.map((item) => (
                    <li key={item.nome + item.texto} className="p-2.5">
                      <p className="font-medium text-ink">{item.nome}</p>
                      <p className="text-xs text-inkmuted">{item.texto}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end">
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
