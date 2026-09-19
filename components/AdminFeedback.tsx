"use client";

import { useState } from "react";
import type { Feedback } from "@/lib/sheets";
import AdminPedirFeedback from "@/components/AdminPedirFeedback";
import type { GruposDestinatarios } from "@/components/AdminListaDestinatarios";


type Props = {
  respostas: Feedback[];
  destinatarios: GruposDestinatarios;
  totalConvidados: number;
  edicao: number;
  readOnly?: boolean;
};

type FiltroEstrelas = "todas" | "5" | "4" | "baixas" | "sem";

/** Em que filtro de estrelas cai uma resposta (meias estrelas contam na de baixo). */
function grupoEstrelas(avaliacao: number): Exclude<FiltroEstrelas, "todas"> {
  if (avaliacao <= 0) return "sem";
  if (avaliacao >= 5) return "5";
  if (avaliacao >= 4) return "4";
  return "baixas";
}

/** Minúsculas e sem acentos, para "agua" encontrar "Água". */
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Altura estimada de um cartão pelo texto: caracteres das respostas abertas
 * mais um tanto por cada pergunta respondida (etiqueta e espaçamento).
 */
function pesoDoCartao(r: Feedback): number {
  const textos = [r.gostou, r.melhorar, r.mensagem, r.oQueFoi].filter(Boolean);
  return textos.reduce((t, texto) => t + texto.length, 0) + textos.length * 80;
}

function dataCurta(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor || "—";
  return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

export default function AdminFeedback({
  respostas,
  destinatarios,
  totalConvidados,
  edicao,
  readOnly = false,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [filtro, setFiltro] = useState<FiltroEstrelas>("todas");
  const [pesquisa, setPesquisa] = useState("");

  const opcoesFiltro: { valor: FiltroEstrelas; label: string }[] = [
    { valor: "todas", label: "Todas" },
    { valor: "5", label: "5★" },
    { valor: "4", label: "4★" },
    { valor: "baixas", label: "1–3★" },
    { valor: "sem", label: "Sem estrelas" },
  ];
  const contar = (valor: FiltroEstrelas) =>
    valor === "todas"
      ? respostas.length
      : respostas.filter((r) => grupoEstrelas(r.avaliacao) === valor).length;

  const termo = normalizar(pesquisa.trim());
  // Ordenadas pelo tamanho do texto: cada linha da grelha junta dois cartões
  // de altura parecida.
  const visiveis = respostas
    .filter(
      (r) =>
        (filtro === "todas" || grupoEstrelas(r.avaliacao) === filtro) &&
        (!termo ||
          normalizar([r.gostou, r.melhorar, r.mensagem, r.oQueFoi, r.nome].join(" ")).includes(termo))
    )
    .sort((a, b) => pesoDoCartao(b) - pesoDoCartao(a));

  const comNota = respostas.filter((r) => r.avaliacao > 0);
  const media =
    comNota.length > 0
      ? comNota.reduce((soma, r) => soma + r.avaliacao, 0) / comNota.length
      : 0;
  const taxa = totalConvidados > 0 ? Math.round((respostas.length / totalConvidados) * 100) : 0;

  const distribuicao = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    // Meias estrelas (do papel) contam na estrela de baixo: 4,5 → 4.
    total: comNota.filter((r) => Math.floor(r.avaliacao) === nota).length,
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
      <div className="mb-4 flex flex-wrap items-start gap-3">
        {respostas.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-line bg-surfacealt px-5 py-3 lg:w-auto lg:flex-1">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-inksoft">Média geral</p>
              <p className="text-xl font-bold tabular-nums text-ink">
                {media.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}
                <span className="ml-1 text-xs font-medium text-inksoft">/ 5</span>
                <span className="ml-2 text-sm font-normal text-branddark" aria-hidden="true">
                  {"★".repeat(Math.round(media))}
                  <span className="text-inksoft">{"★".repeat(5 - Math.round(media))}</span>
                </span>
              </p>
            </div>
            <span className="hidden h-10 w-px bg-line sm:block" aria-hidden="true" />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-inksoft">Respostas</p>
              <p className="text-xl font-bold tabular-nums text-ink">
                {respostas.length}
                <span className="ml-1 text-xs font-medium text-inksoft">
                  de {totalConvidados} ({taxa}%)
                </span>
              </p>
            </div>
            <span className="hidden h-10 w-px bg-line sm:block" aria-hidden="true" />
            <div className="min-w-[200px] flex-1 space-y-0.5">
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
        )}

        {respostas.length === 0 && <span className="flex-1" />}

        <div className="flex w-full flex-col gap-1.5 sm:w-auto">
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-line bg-surfacealt px-3 py-1.5 text-xs text-inkmuted">
            <span className="truncate">{linkPublico}</span>
            <button
              type="button"
              onClick={copiarLink}
              className="flex-none font-semibold text-branddark hover:underline"
            >
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
          {!readOnly && <AdminPedirFeedback grupos={destinatarios} />}
        </div>
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
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-line bg-surfacealt p-0.5">
              {opcoesFiltro.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => setFiltro(opcao.valor)}
                  className={
                    "rounded-lg px-3 py-1 text-sm font-medium transition " +
                    (filtro === opcao.valor
                      ? "bg-white text-ink shadow-sm"
                      : "text-inkmuted hover:text-ink")
                  }
                >
                  {opcao.label}{" "}
                  <span className={filtro === opcao.valor ? "text-branddark" : "text-inksoft"}>
                    ({contar(opcao.valor)})
                  </span>
                </button>
              ))}
            </div>
            <span className="flex-1" />
            <input
              type="search"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar nas respostas…"
              aria-label="Pesquisar nas respostas"
              className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm sm:w-64"
            />
          </div>

          {visiveis.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-6 py-8 text-center text-sm text-inkmuted">
              Nenhuma resposta com estes filtros.
            </p>
          )}

          <div className="grid gap-2.5 md:grid-cols-2">
            {visiveis.map((r) => {
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
              ];

              return (
              <div key={r.rowIndex} className="rounded-xl border border-line p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{r.nome || "Anónimo"}</p>
                  {r.avaliacao > 0 ? (
                    <p className="flex-none text-sm text-branddark">
                      <Estrelas valor={r.avaliacao} />
                      <span className="ml-1.5 text-[11px] font-medium text-inkmuted">
                        {r.avaliacao.toLocaleString("pt-PT")}/5
                      </span>
                    </p>
                  ) : (
                    <p className="flex-none text-[11px] text-inksoft">sem estrelas</p>
                  )}
                </div>
                {abertas.map((campo) => (
                  <div key={campo.label} className="mt-2">
                    <p className="text-[10px] uppercase tracking-wide text-inksoft">
                      {campo.label}
                    </p>
                    <p className="text-xs leading-relaxed text-inkmuted">{campo.texto}</p>
                  </div>
                ))}

                {/* Os cinco aparecem sempre; os que ficaram por responder ficam neutros. */}
                {simNao.some((campo) => campo.valor) && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {simNao.map((campo) => (
                      <span
                        key={campo.label}
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                          (campo.valor === "Sim"
                            ? "bg-brand/15 text-branddark"
                            : campo.valor
                              ? "bg-red-50 text-red-700"
                              : "border border-line text-inksoft")
                        }
                      >
                        {campo.label}: {campo.valor || "não preenchido"}
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

/** Estrelas de 0 a 5, com meia estrela (ex: 4,5 de um questionário em papel). */
function Estrelas({ valor }: { valor: number }) {
  const cheias = Math.floor(valor);
  const meia = valor - cheias >= 0.5;
  const vazias = 5 - cheias - (meia ? 1 : 0);
  return (
    <span aria-label={`${valor.toLocaleString("pt-PT")} de 5 estrelas`}>
      {"★".repeat(cheias)}
      {meia && (
        <span className="relative text-inksoft">
          ★
          <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden text-branddark">★</span>
        </span>
      )}
      <span className="text-inksoft">{"★".repeat(Math.max(0, vazias))}</span>
    </span>
  );
}
