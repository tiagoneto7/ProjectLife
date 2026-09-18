"use client";

import { useMemo, useState } from "react";
import type { InscritoRow, Equipa, Despesa, Feedback } from "@/lib/sheets";
import { EVENTO, edicaoAtual, edicaoDaData } from "@/lib/evento";
import { estaValidado, pagou } from "@/lib/estados";
import AdminTabelaInscritos from "@/components/AdminTabelaInscritos";
import AdminDespesas from "@/components/AdminDespesas";
import AdminFeedback from "@/components/AdminFeedback";

type Separador = "inscricoes" | "despesas" | "feedback";

type Props = {
  inscritos: InscritoRow[];
  equipas: Equipa[];
  despesas: Despesa[];
  feedback: Feedback[];
};

const SEM_RESTRICAO = ["nada", "nenhum", "nenhuma"];
const temRestricao = (texto: string) =>
  Boolean(texto) && !SEM_RESTRICAO.includes(texto.trim().toLowerCase());

export default function AdminPainel({ inscritos, equipas, despesas, feedback }: Props) {
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

  // Inscrições: fecham alguns dias depois do FIRE (ver DIAS_ATE_ARQUIVAR),
  // por isso uma edição passada é só de leitura.
  const arquivada = edicao !== atual;
  // Despesas e feedback: editáveis da edição em curso para a frente — uma
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
  const despesasDaEdicao = despesas.filter((d) => d.edicao === edicao);
  const feedbackDaEdicao = feedback.filter((f) => f.edicao === edicao);
  // Validados = confirmados para o campo (inclui vagas sociais).
  // Pagos = só quem pagou mesmo — é o que conta para a receita.
  const totalValidados = visiveis.filter((i) => estaValidado(i.estado)).length;
  const totalPagos = visiveis.filter((i) => pagou(i.estado)).length;
  const receitaCentimos = totalPagos * EVENTO.valorCentimos;

  const paraDestinatario = (i: InscritoRow) => {
    const emails = [i.email];
    if (i.menorDe18 === "Sim" && i.emailResponsavel) emails.push(i.emailResponsavel);
    return { nome: i.nome, emails };
  };
  const validados = visiveis.filter((i) => estaValidado(i.estado)).map(paraDestinatario);
  const pendentes = visiveis.filter((i) => !estaValidado(i.estado)).map(paraDestinatario);

  const separadores: { id: Separador; label: string }[] = [
    { id: "inscricoes", label: "Inscrições" },
    { id: "despesas", label: "Despesas" },
    { id: "feedback", label: "Feedback" },
  ];

  return (
    <div>
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

        {/* Seta própria: a nativa do browser deixa uma folga a mais à direita. */}
        <div className="relative mb-2 flex-none">
          <select
            value={edicao}
            onChange={(e) => setEdicao(Number(e.target.value))}
            aria-label="Edição"
            className="w-full appearance-none rounded-lg border border-line bg-surface py-1.5 pl-2.5 pr-8 text-sm font-semibold text-ink"
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
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {separador === "inscricoes" && (
        <AdminTabelaInscritos
          inscritos={visiveis}
          equipas={equipasDaEdicao}
          restricoesFisicas={restricoesFisicas}
          restricoesAlimentares={restricoesAlimentares}
          alergias={alergias}
          arquivada={arquivada}
          edicao={edicao}
        />
      )}

      {separador === "despesas" && (
        <AdminDespesas
          despesas={despesasDaEdicao}
          receitaCentimos={receitaCentimos}
          totalPagos={totalPagos}
          edicao={edicao}
          readOnly={!edicaoEditavel}
        />
      )}
      {separador === "feedback" && (
        <AdminFeedback
          respostas={feedbackDaEdicao}
          validados={validados}
          pendentes={pendentes}
          totalConvidados={totalValidados}
          edicao={edicao}
          readOnly={!edicaoEditavel}
        />
      )}
    </div>
  );
}
