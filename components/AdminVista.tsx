"use client";

import { useEffect, useState } from "react";

export type Vista = "lista" | "grelha";

/**
 * Preferência de vista (lista ou grelha) de um separador, guardada no browser
 * de quem está a usar o admin. Cada separador tem a sua chave e o seu default:
 * a tabela de inscritos pede lista, o feedback lê-se melhor em grelha.
 */
export function useVista(chave: string, defeito: Vista = "lista"): [Vista, (v: Vista) => void] {
  const [vista, setVista] = useState<Vista>(defeito);

  // Só depois de montar, para o servidor e o cliente renderizarem o mesmo no
  // primeiro passo.
  useEffect(() => {
    try {
      const guardada = localStorage.getItem(`admin-vista-${chave}`);
      if (guardada === "lista" || guardada === "grelha") setVista(guardada);
    } catch {
      // sem acesso ao localStorage (janela privada) — fica no default
    }
  }, [chave]);

  function mudar(nova: Vista) {
    setVista(nova);
    try {
      localStorage.setItem(`admin-vista-${chave}`, nova);
    } catch {
      // a preferência não fica guardada, mas a vista muda à mesma
    }
  }

  return [vista, mudar];
}

const OPCOES = [
  { valor: "lista" as const, label: "Lista", caminho: "M4 6h16M4 12h16M4 18h16" },
  {
    valor: "grelha" as const,
    label: "Grelha",
    caminho: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  },
];

export default function AdminVista({
  vista,
  onMudar,
}: {
  vista: Vista;
  onMudar: (v: Vista) => void;
}) {
  return (
    <div className="flex flex-none items-center gap-0.5 rounded-xl border border-line bg-surfacealt p-0.5">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          onClick={() => onMudar(opcao.valor)}
          title={opcao.label}
          aria-label={opcao.label}
          aria-pressed={vista === opcao.valor}
          className={
            "rounded-lg p-1.5 transition " +
            (vista === opcao.valor ? "bg-white text-ink shadow-sm" : "text-inksoft hover:text-ink")
          }
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d={opcao.caminho}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
