"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { InscritoRow, Equipa, Movimento, Feedback } from "@/lib/sheets";
import { edicaoAtual, edicaoDaData, fichaDaEdicao } from "@/lib/evento";
import { ehVagaSocial, pagou } from "@/lib/estados";
import { ehCategoriaInscricoes } from "@/lib/contas";
import { agruparDestinatarios } from "@/components/AdminListaDestinatarios";
import AdminTabelaInscritos from "@/components/AdminTabelaInscritos";
import AdminEquipas from "@/components/AdminEquipas";
import AdminContas from "@/components/AdminContas";
import AdminModoEdicao from "@/components/AdminModoEdicao";
import AdminFeedback from "@/components/AdminFeedback";

type Separador = "inscricoes" | "equipas" | "contas" | "feedback";

type Props = {
  inscritos: InscritoRow[];
  equipas: Equipa[];
  movimentos: Movimento[];
  feedback: Feedback[];
  /** false para quem entrou com a password de leitura: vê tudo, não altera nada. */
  podeEditar: boolean;
};

const SEM_RESTRICAO = ["nada", "nenhum", "nenhuma"];
const temRestricao = (texto: string) =>
  Boolean(texto) && !SEM_RESTRICAO.includes(texto.trim().toLowerCase());

export default function AdminPainel({
  inscritos,
  equipas,
  movimentos,
  feedback,
  podeEditar,
}: Props) {
  const atual = edicaoAtual();

  // A edição de cada inscrito é a gravada na coluna X no momento da inscrição
  // (a do FIRE que o site anunciava). Só as linhas antigas sem ela é que a
  // deduzem pela data.
  const porEdicao = useMemo(() => {
    const mapa = new Map<number, InscritoRow[]>();
    for (const inscrito of inscritos) {
      const ano = inscrito.edicao || edicaoDaData(new Date(inscrito.data));
      const lista = mapa.get(ano) ?? [];
      lista.push(inscrito);
      mapa.set(ano, lista);
    }
    return mapa;
  }, [inscritos]);

  const edicoes = useMemo(() => {
    const anos = new Set(porEdicao.keys());
    // Edições anteriores ao site só existem nas Contas (ex: o resumo de 2025).
    for (const m of movimentos) if (m.edicao) anos.add(m.edicao);
    anos.add(atual);
    return Array.from(anos).sort((a, b) => b - a);
  }, [porEdicao, movimentos, atual]);

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
  const [slotMobile, setSlotMobile] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSlotEdicao(document.getElementById("admin-edicao-slot"));
    setSlotMobile(document.getElementById("admin-edicao-slot-mobile"));
  }, []);

  // Inscrições: a edição muda a 1 de janeiro, por isso uma edição passada é
  // só de leitura.
  // Os botões de criar e enviar ficam disponíveis durante todo o ano civil da
  // edição; nas edições passadas, só a consulta e a edição do que já existe.
  const arquivada = edicao !== atual;
  // Equipas e contas ficam editáveis em qualquer edição (faturas e lugares
  // finais chegam depois do fecho). O pedido de feedback só na edição atual —
  // é essa a que o formulário grava.
  const pedeFeedback = edicao === atual;
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
  const feedbackDaEdicao = feedback.filter((f) => f.edicao === edicao);
  const contas = resumoContas(edicao);
  // Só compara quando a edição anterior tem alguma coisa registada.
  const contasAnterior = resumoContas(edicao - 1);
  const temAnterior = contasAnterior.movimentos.length > 0 || contasAnterior.receitaCentimos > 0;

  /**
   * Movimentos e receita de inscrições de uma edição. Pagos = só quem pagou
   * (sem vagas sociais). Nas edições anteriores ao site não há inscritos, e as
   * inscrições vêm das entradas registadas à mão nessa categoria.
   */
  function resumoContas(ano: number) {
    const inscritosAno = porEdicao.get(ano) ?? [];
    const doAno = movimentos.filter((m) => m.edicao === ano);
    const manuais = doAno.filter((m) => m.tipo === "entrada" && ehCategoriaInscricoes(m.categoria));
    const totalPagos = inscritosAno.filter((i) => pagou(i.estado)).length;
    const valorInscricao = fichaDaEdicao(ano).valorCentimos;
    return {
      movimentos: doAno.filter((m) => !manuais.includes(m)),
      receitaCentimos:
        totalPagos * valorInscricao + manuais.reduce((t, m) => t + m.valorCentimos, 0),
      inscricoesManuais: manuais,
      totalPagos,
      totalSociais: inscritosAno.filter((i) => ehVagaSocial(i.estado)).length,
      // Quem veio (pagos + sociais). Antes do site não há inscritos: estima-se
      // pelas inscrições registadas à mão ÷ valor da inscrição.
      participantes:
        inscritosAno.length > 0
          ? inscritosAno.filter((i) => pagou(i.estado) || ehVagaSocial(i.estado)).length
          : Math.round(manuais.reduce((t, m) => t + m.valorCentimos, 0) / valorInscricao),
    };
  }

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
      {slotEdicao &&
        createPortal(
          <span className="hidden items-center gap-4 sm:inline-flex">
            {seletorEdicao}
            <AdminModoEdicao ligado={podeEditar} />
          </span>,
          slotEdicao
        )}
      {/* Em ecrã pequeno vão os dois para dentro do menu, ao lado do "Sair". */}
      {slotMobile &&
        createPortal(
          <>
            {seletorEdicao}
            <AdminModoEdicao ligado={podeEditar} />
          </>,
          slotMobile
        )}
      <div className="mb-8 flex items-end justify-between gap-3 border-b border-line">
        <div className="flex gap-5 overflow-x-auto overflow-y-hidden sm:gap-6">
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

      </div>

      {separador === "inscricoes" && (
        <AdminTabelaInscritos
          inscritos={visiveis}
          restricoesFisicas={restricoesFisicas}
          restricoesAlimentares={restricoesAlimentares}
          alergias={alergias}
          arquivada={arquivada}
          readOnly={arquivada || !podeEditar}
          edicao={edicao}
        />
      )}

      {separador === "equipas" && (
        <AdminEquipas
          equipas={equipasDaEdicao}
          inscritos={visiveis}
          edicao={edicao}
          arquivada={arquivada}
          readOnly={!podeEditar}
        />
      )}

      {separador === "contas" && (
        <AdminContas
          {...contas}
          anterior={temAnterior ? contasAnterior : undefined}
          edicao={edicao}
          readOnly={!podeEditar}
        />
      )}
      {separador === "feedback" && (
        <AdminFeedback
          respostas={feedbackDaEdicao}
          destinatarios={destinatarios}
          totalConvidados={visiveis.length}
          edicao={edicao}
          readOnly={!pedeFeedback || !podeEditar}
        />
      )}
    </div>
  );
}
