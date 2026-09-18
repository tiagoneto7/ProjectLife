"use client";

import type { InscritoRow } from "@/lib/sheets";
import { ehVagaSocial, pagou } from "@/lib/estados";

export type Destinatario = {
  nome: string;
  emails: string[];
};

/** Inscritos agrupados pelo estado, pela mesma ordem do filtro das Inscrições. */
export type GruposDestinatarios = {
  pagos: Destinatario[];
  sociais: Destinatario[];
  pendentes: Destinatario[];
};

/** Um destinatário por inscrito; menores levam também o email do responsável. */
export function agruparDestinatarios(inscritos: InscritoRow[]): GruposDestinatarios {
  const paraDestinatario = (i: InscritoRow): Destinatario => {
    const emails = [i.email];
    if (i.menorDe18 === "Sim" && i.emailResponsavel) emails.push(i.emailResponsavel);
    return { nome: i.nome, emails };
  };
  return {
    pagos: inscritos.filter((i) => pagou(i.estado)).map(paraDestinatario),
    sociais: inscritos.filter((i) => ehVagaSocial(i.estado)).map(paraDestinatario),
    pendentes: inscritos
      .filter((i) => !pagou(i.estado) && !ehVagaSocial(i.estado))
      .map(paraDestinatario),
  };
}

export function chave(d: Destinatario) {
  return `${d.nome}|${d.emails.join(",")}`;
}

/** Por defeito vai para quem vem ao FIRE: pagos e vagas sociais. */
export function selecaoPorDefeito(grupos: GruposDestinatarios): Set<string> {
  return new Set([...grupos.pagos, ...grupos.sociais].map(chave));
}

export function todosDestinatarios(grupos: GruposDestinatarios): Destinatario[] {
  return [...grupos.pagos, ...grupos.sociais, ...grupos.pendentes];
}

export function resumoSelecao(grupos: GruposDestinatarios, selecionados: Set<string>): string {
  const conta = (lista: Destinatario[]) => lista.filter((d) => selecionados.has(chave(d))).length;
  const emails = new Set(
    todosDestinatarios(grupos)
      .filter((d) => selecionados.has(chave(d)))
      .flatMap((d) => d.emails)
  );
  return (
    `${selecionados.size} selecionados (${conta(grupos.pagos)} pagos, ` +
    `${conta(grupos.sociais)} sociais, ${conta(grupos.pendentes)} pendentes) · ${emails.size} emails`
  );
}

export default function AdminListaDestinatarios({
  grupos,
  selecionados,
  onToggle,
}: {
  grupos: GruposDestinatarios;
  selecionados: Set<string>;
  onToggle: (d: Destinatario) => void;
}) {
  const secoes = [
    { titulo: "Pagos", lista: grupos.pagos },
    { titulo: "Sociais", lista: grupos.sociais },
    { titulo: "Pendentes", lista: grupos.pendentes },
  ].filter((s) => s.lista.length > 0);

  if (secoes.length === 0) {
    return <p className="p-3 text-sm text-inksoft">Não há inscritos nesta edição.</p>;
  }

  return (
    <>
      {secoes.map((secao) => (
        <div key={secao.titulo}>
          <p className="sticky top-0 bg-surfacealt px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-inksoft">
            {secao.titulo} ({secao.lista.length})
          </p>
          <ul className="divide-y divide-line text-sm">
            {secao.lista.map((d) => (
              <li key={chave(d)}>
                <label className="flex cursor-pointer items-start gap-2.5 p-2.5 hover:bg-surfacealt">
                  <input
                    type="checkbox"
                    checked={selecionados.has(chave(d))}
                    onChange={() => onToggle(d)}
                    className="mt-0.5 h-4 w-4 flex-none accent-branddark"
                  />
                  <span>
                    <p className="font-medium text-ink">{d.nome}</p>
                    <p className="text-xs text-inkmuted">{d.emails.join(" · ")}</p>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
