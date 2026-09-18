"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { InscritoRow, Equipa, Movimento, Feedback } from "@/lib/sheets";
import { EVENTO, edicaoAtual, edicaoDaData } from "@/lib/evento";
import { ehVagaSocial, pagou } from "@/lib/estados";
import { agruparDestinatarios } from "@/components/AdminListaDestinatarios";
import AdminTabelaInscritos from "@/components/AdminTabelaInscritos";
import AdminEquipas from "@/components/AdminEquipas";
import AdminContas from "@/components/AdminContas";
import AdminFeedback from "@/components/AdminFeedback";

type Separador = "inscricoes" | "equipas" | "contas" | "feedback";

type Props = {
  inscritos: InscritoRow[];
  equipas: Equipa[];
  movimentos: Movimento[];
  feedback: Feedback[];
};

const SEM_RESTRICAO = ["nada", "nenhum", "nenhuma"];
const temRestricao = (texto: string) =>
  Boolean(texto) && !SEM_RESTRICAO.includes(texto.trim().toLowerCase());

export default function AdminPainel({ inscritos, equipas, movimentos, feedback }: Props) {
  const atual = edicaoAtual();

  // A edição de cada inscrito sai da data de inscrição — nada é lido nem
  // escrito na Sheet só para arquivar.
  const porEdicao = useMemo(() => {
    const mapa = new Map<number, InscritoRow[]>();
    for (const inscrito of inscritos) {
      const ano = edicaoDaData(new Date(inscrito.data));
      const lista = mapa.get(ano) ?? [];
      lista.push(inscrito);
      mapa.set(ano, lista);
    }
    return mapa;
  }, [inscritos]);

  const edicoes = useMemo(() => {
    const anos = new Set(porEdicao.keys());
    anos.add(atual);
    return Array.from(anos).sort((a, b) => b - a);
  }, [porEdicao, atual]);

  // Abre na edição atual, mas se ela ainda estiver vazia mostra a mais recente
  // que tenha inscritos — evita cair num ecrã vazio entre edições.
  const [edicao, setEdicao] = useState(() => {
    if ((porEdicao.get(atual)?.length ?? 0) > 0) return atual;
    const comDados = edicoes.find((ano) => (porEdicao.get(ano)?.length ?? 0) > 0);
    return comDados ?? atual;
  });
  const [separador, setSeparador] = useState<Separador>("inscricoes");
  // O ano vive no header, ao lado do "Sair" (ver SiteHeaderClient).
  const [slotEdicao, setSlotEdicao] = useState<HTMLElement | null>(null);
  useEffect(() => setSlotEdicao(document.getElementById("admin-edicao-slot")), []);

  // Inscrições: fecham alguns dias depois do FIRE (ver DIAS_ATE_ARQUIVAR),
  // por isso uma edição passada é só de leitura.
  const arquivada = edicao !== atual;
  // Contas e feedback: editáveis da edição em curso para a frente — uma
  // fatura pode chegar depois de as inscrições fecharem, e já se pode gastar
  // dinheiro (ex: sinal do espaço) na edição seguinte. Só as edições
  // anteriores à que está a ser organizada ficam de leitura.
  const edicaoEditavel = edicao >= EVENTO.edicao;
  const visiveis = porEdicao.get(edicao) ?? [];

  const restricoesFisicas = visiveis
    .filter((i) => temRestricao(i.restricoesAtividadeFisica))
    .map((i) => ({ nome: i.nome, texto: i.restricoesAtividadeFisica }));
  const restricoesAlimentares = visiveis
    .filter((i) => temRestricao(i.restricoesAlimentares))
    .map((i) => ({ nome: i.nome, texto: i.restricoesAlimentares }));
  const alergias = visiveis
    .filter((i) => temRestricao(i.alergias))
    .map((i) => ({ nome: i.nome, texto: i.alergias }));

  const equipasDaEdicao = equipas.filter((e) => e.edicao === edicao);
  const movimentosDaEdicao = movimentos.filter((m) => m.edicao === edicao);
  const feedbackDaEdicao = feedback.filter((f) => f.edicao === edicao);
  // Pagos = só quem pagou mesmo (sem vagas sociais) — é o que conta para a receita.
  const totalPagos = visiveis.filter((i) => pagou(i.estado)).length;
  const totalSociais = visiveis.filter((i) => ehVagaSocial(i.estado)).length;
  const receitaCentimos = totalPagos * EVENTO.valorCentimos;

  const destinatarios = agruparDestinatarios(visiveis);

  const separadores: { id: Separador; label: string }[] = [
    { id: "inscricoes", label: "Inscrições" },
    { id: "equipas", label: "Equipas" },
    { id: "contas", label: "Contas" },
    { id: "feedback", label: "Feedback" },
  ];

  // Seta própria: a nativa do browser deixa uma folga a mais à direita.
  const seletorEdicao = (
    <span className="relative inline-flex items-center">
      <select
        value={edicao}
        onChange={(e) => setEdicao(Number(e.target.value))}
        aria-label="Edição"
        className="cursor-pointer appearance-none bg-transparent pr-4 text-sm text-inkmuted hover:text-ink focus:outline-none"
      >
        {edicoes.map((ano) => (
          <option key={ano} value={ano}>
            FIRE {ano}
            {ano === atual ? " — atual" : ""}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute right-0 h-3 w-3 text-inksoft"
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );

  return (
    <div>
      {slotEdicao && createPortal(<span className="hidden sm:inline-flex">{seletorEdicao}</span>, slotEdicao)}
      <div className="mb-8 flex items-end justify-between gap-3 border-b border-line">
        <div className="flex gap-5 overflow-x-auto sm:gap-6">
          {separadores.map((s) => {
            const ativo = separador === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSeparador(s.id)}
                className={
                  "-mb-px flex flex-none items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 pb-2.5 text-sm font-semibold transition " +
                  (ativo
                    ? "border-branddark text-ink"
                    : "border-transparent text-inksoft hover:text-inkmuted")
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Em mobile o "Sair" está dentro do menu, por isso o ano fica aqui. */}
        <div className="mb-2 flex-none sm:hidden">{seletorEdicao}</div>
      </div>

      {separador === "inscricoes" && (
        <AdminTabelaInscritos
          inscritos={visiveis}
          restricoesFisicas={restricoesFisicas}
          restricoesAlimentares={restricoesAlimentares}
          alergias={alergias}
          arquivada={arquivada}
          edicao={edicao}
        />
      )}

      {separador === "equipas" && (
        <AdminEquipas
          equipas={equipasDaEdicao}
          inscritos={visiveis}
          edicao={edicao}
          // Como as contas: o lugar final só se sabe depois do FIRE, por isso
          // as equipas da edição em curso continuam editáveis após o fecho.
          readOnly={!edicaoEditavel}
        />
      )}

      {separador === "contas" && (
        <AdminContas
          movimentos={movimentosDaEdicao}
          receitaCentimos={receitaCentimos}
          totalPagos={totalPagos}
          totalSociais={totalSociais}
          edicao={edicao}
          readOnly={!edicaoEditavel}
        />
      )}
      {separador === "feedback" && (
        <AdminFeedback
          respostas={feedbackDaEdicao}
          destinatarios={destinatarios}
          totalConvidados={visiveis.length}
          edicao={edicao}
          readOnly={!edicaoEditavel}
        />
      )}
    </div>
  );
}
