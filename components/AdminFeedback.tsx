"use client";

import { useState } from "react";
import type { Feedback } from "@/lib/sheets";
import AdminPedirFeedback from "@/components/AdminPedirFeedback";
import AdminVista, { useVista } from "@/components/AdminVista";

type Destinatario = { nome: string; emails: string[] };

type Props = {
  respostas: Feedback[];
  validados: Destinatario[];
  pendentes: Destinatario[];
  totalConvidados: number;
  edicao: number;
  readOnly?: boolean;
};

function dataCurta(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor || "—";
  return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

export default function AdminFeedback({
  respostas,
  validados,
  pendentes,
  totalConvidados,
  edicao,
  readOnly = false,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [vista, mudarVista] = useVista("feedback", "grelha");

  const comNota = respostas.filter((r) => r.avaliacao > 0);
  const media =
    comNota.length > 0
      ? comNota.reduce((soma, r) => soma + r.avaliacao, 0) / comNota.length
      : 0;
  const taxa = totalConvidados > 0 ? Math.round((respostas.length / totalConvidados) * 100) : 0;

  const distribuicao = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    total: comNota.filter((r) => r.avaliacao === nota).length,
  }));
  const maxDist = Math.max(1, ...distribuicao.map((d) => d.total));

  const linkPublico =
    typeof window !== "undefined" ? `${window.location.origin}/fire/feedback` : "/fire/feedback";

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão para a área de transferência — o link está visível para copiar à mão.
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AdminVista vista={vista} onMudar={mudarVista} />
        <span className="flex-1" />
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-surfacealt px-3 py-1.5 text-xs text-inkmuted">
          <span className="truncate">{linkPublico}</span>
          <button
            type="button"
            onClick={copiarLink}
            className="flex-none font-semibold text-branddark hover:underline"
          >
            {copiado ? "Copiado!" : "Copiar"}
          </button>
        </div>
        {!readOnly && <AdminPedirFeedback validados={validados} pendentes={pendentes} />}
      </div>

      {respostas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <p className="text-sm font-semibold text-ink">Sem respostas do FIRE {edicao}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-inkmuted">
            Partilha o link acima (ou usa o botão para enviar por email) e as respostas aparecem aqui.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surfacealt px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-inksoft">Média geral</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-ink">
                {media.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}
                <span className="ml-1 text-xs font-medium text-inksoft">/ 5</span>
              </p>
              <p className="mt-0.5 text-sm text-branddark" aria-hidden="true">
                {"★".repeat(Math.round(media))}
                <span className="text-inksoft">{"★".repeat(5 - Math.round(media))}</span>
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surfacealt px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-inksoft">Respostas</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-ink">
                {respostas.length}
                <span className="ml-1 text-xs font-medium text-inksoft">
                  de {totalConvidados} ({taxa}%)
                </span>
              </p>
              <div className="mt-2 space-y-1">
                {distribuicao.map((d) => (
                  <div key={d.nota} className="flex items-center gap-2 text-[11px] text-inkmuted">
                    <span className="w-6 flex-none">{d.nota} ★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded bg-line">
                      <span
                        className="block h-full rounded bg-brand"
                        style={{ width: `${(d.total / maxDist) * 100}%` }}
                      />
                    </span>
                    <span className="w-4 flex-none text-right tabular-nums">{d.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={vista === "grelha" ? "grid gap-2.5 md:grid-cols-2" : "space-y-2.5"}>
            {respostas.map((r) => {
              const abertas = [
                { label: "O que mais gostou", texto: r.gostou },
                { label: "O que melhorava", texto: r.melhorar },
                { label: "Mensagem que mais tocou", texto: r.mensagem },
                { label: "O que foi o FIRE", texto: r.oQueFoi },
              ].filter((campo) => campo.texto);

              const simNao = [
                { label: "Volta", valor: r.volta },
                { label: "Ambiente", valor: r.ambiente },
                { label: "Atividades", valor: r.atividades },
                { label: "Comida", valor: r.comida },
                { label: "Espaço", valor: r.espaco },
              ].filter((campo) => campo.valor);

              return (
              <div key={r.rowIndex} className="rounded-xl border border-line p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{r.nome || "Anónimo"}</p>
                  <p className="flex-none text-sm text-branddark">
                    {"★".repeat(r.avaliacao)}
                    <span className="text-inksoft">{"★".repeat(Math.max(0, 5 - r.avaliacao))}</span>
                    <span className="ml-1.5 text-[11px] font-medium text-inkmuted">
                      {r.avaliacao}/5
                    </span>
                  </p>
                </div>
                {abertas.map((campo) => (
                  <div key={campo.label} className="mt-2">
                    <p className="text-[10px] uppercase tracking-wide text-inksoft">
                      {campo.label}
                    </p>
                    <p className="text-xs leading-relaxed text-inkmuted">{campo.texto}</p>
                  </div>
                ))}

                {simNao.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {simNao.map((campo) => (
                      <span
                        key={campo.label}
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                          (campo.valor === "Sim"
                            ? "bg-brand/15 text-branddark"
                            : "bg-red-50 text-red-700")
                        }
                      >
                        {campo.label}: {campo.valor}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-right text-[10px] text-inksoft">{dataCurta(r.data)}</p>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
