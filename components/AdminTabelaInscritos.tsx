"use client";

import { useState } from "react";
import type { InscritoRow } from "@/lib/sheets";
import { ehVagaSocial, estaConfirmado, pagou } from "@/lib/estados";
import AdminVista, { useVista } from "@/components/AdminVista";
import AdminEstadoEditor from "@/components/AdminEstadoEditor";
import { agruparDestinatarios } from "@/components/AdminListaDestinatarios";
import AdminEnviarDocs from "@/components/AdminEnviarDocs";
import AdminResumoRestricoes from "@/components/AdminResumoRestricoes";

type Filtro = "todos" | "pago" | "pendente" | "social";
type ItemRestricao = { nome: string; texto: string };

type Props = {
  inscritos: InscritoRow[];
  restricoesFisicas: ItemRestricao[];
  restricoesAlimentares: ItemRestricao[];
  alergias: ItemRestricao[];
  /** Edição já encerrada: mostra os dados, mas não deixa alterar nada. */
  arquivada?: boolean;
  /** O FIRE desta edição já terminou: esconde o envio das informações finais. */
  terminou?: boolean;
  edicao?: number;
};

function formatarDataNascimento(valor: string): string {
  if (!valor) return "—";

  // Linhas antigas: a Sheet converteu a data para o número de série (dias desde 30/12/1899).
  if (/^\d+(\.\d+)?$/.test(valor)) {
    const dataBase = Date.UTC(1899, 11, 30);
    const data = new Date(dataBase + Number(valor) * 86400000);
    return data.toLocaleDateString("pt-PT", { timeZone: "UTC" });
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleDateString("pt-PT", { timeZone: "UTC" });
}

function DetailsCell({ items }: { items: { label: string; value: string }[] }) {
  const filled = items.filter((i) => i.value);
  if (filled.length === 0) return <span className="text-inksoft">—</span>;

  return (
    <details className="group">
      <summary className="cursor-pointer list-none whitespace-nowrap text-sm text-ink underline decoration-dotted underline-offset-2 marker:content-none">
        Ver ({filled.length})
      </summary>
      <div className="mt-1.5 min-w-[200px] space-y-1 text-xs text-inkmuted">
        {filled.map((i) => (
          <p key={i.label}>
            <span className="text-inksoft">{i.label}:</span> {i.value}
          </p>
        ))}
      </div>
    </details>
  );
}

function TextoCell({ texto }: { texto: string }) {
  if (!texto) return <span className="text-inksoft">—</span>;

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm text-ink underline decoration-dotted underline-offset-2 marker:content-none">
        Ver
      </summary>
      <p className="mt-1.5 min-w-[200px] max-w-[280px] text-xs text-inkmuted">{texto}</p>
    </details>
  );
}

export default function AdminTabelaInscritos({
  inscritos,
  restricoesFisicas,
  restricoesAlimentares,
  alergias,
  arquivada = false,
  terminou = false,
  edicao,
}: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [vista, mudarVista] = useVista("inscritos", "lista");

  const totalPagos = inscritos.filter((i) => pagou(i.estado)).length;
  // Pendentes = nem pagou nem é vaga social (Todos = Pagos + Pendentes + Sociais).
  const totalPendente = inscritos.filter((i) => !estaConfirmado(i.estado)).length;
  const totalSociais = inscritos.filter((i) => ehVagaSocial(i.estado)).length;

  const destinatarios = agruparDestinatarios(inscritos);

  const visiveis = inscritos.filter((i) => {
    if (filtro === "todos") return true;
    if (filtro === "pago") return pagou(i.estado);
    if (filtro === "social") return ehVagaSocial(i.estado);
    return !estaConfirmado(i.estado);
  });

  const opcoesFiltro: { valor: Filtro; label: string; total: number }[] = [
    { valor: "todos", label: "Todos", total: inscritos.length },
    { valor: "pago", label: "Pagos", total: totalPagos },
    { valor: "pendente", label: "Pendentes", total: totalPendente },
    { valor: "social", label: "Sociais", total: totalSociais },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="order-2 flex w-full items-center gap-0.5 rounded-xl border border-line bg-surfacealt p-0.5 sm:order-1 sm:w-auto">
          {opcoesFiltro.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setFiltro(opcao.valor)}
              className={
                "flex-1 rounded-lg px-3 py-1 text-sm font-medium transition sm:flex-none " +
                (filtro === opcao.valor
                  ? "bg-white text-ink shadow-sm"
                  : "text-inkmuted hover:text-ink")
              }
            >
              {opcao.label}{" "}
              <span className={filtro === opcao.valor ? "text-branddark" : "text-inksoft"}>
                ({opcao.total})
              </span>
            </button>
          ))}
        </div>

        <div className="order-2 sm:order-1">
          <AdminVista vista={vista} onMudar={mudarVista} />
        </div>

        {/* Resumo + Enviar Email Final como chips soltos, full width em mobile */}
        <div className="order-1 flex w-full items-center gap-2 sm:order-2 sm:ml-auto sm:w-auto">
          <div className="flex-1 sm:flex-none [&>button]:w-full">
            <AdminResumoRestricoes
              restricoesAlimentares={restricoesAlimentares}
              restricoesFisicas={restricoesFisicas}
              alergias={alergias}
              transparente
            />
          </div>
          {!terminou && (
            <div className="flex-1 sm:flex-none [&>button]:w-full">
              <AdminEnviarDocs
                grupos={destinatarios}
              />
            </div>
          )}
        </div>
      </div>

      {inscritos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <p className="text-sm font-semibold text-ink">
            {arquivada
              ? `Sem inscrições no FIRE ${edicao}`
              : `Ainda sem inscrições para o FIRE ${edicao}`}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-inkmuted">
            {arquivada
              ? "Esta edição não tem inscrições guardadas."
              : "As inscrições da próxima edição aparecem aqui assim que a primeira pessoa se inscrever."}
          </p>
        </div>
      ) : vista === "lista" ? (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Data</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Data Nasc.</th>
              <th className="p-2">Email</th>
              <th className="p-2">Contacto</th>
              <th className="whitespace-nowrap p-2">C. de Emergência</th>
              <th className="p-2">Menor 18</th>
              <th className="p-2">Saúde</th>
              <th className="p-2">Observações</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((inscrito) => {
              const saudeItems = [
                { label: "Alimentar", value: inscrito.restricoesAlimentares },
                { label: "Atividade física", value: inscrito.restricoesAtividadeFisica },
                { label: "Alergias", value: inscrito.alergias },
                { label: "Outros", value: inscrito.outros },
              ];

              const responsavelItems = [
                { label: "Nome", value: inscrito.nomeResponsavel },
                { label: "Grau de parentesco", value: inscrito.grauParentesco },
                { label: "Email", value: inscrito.emailResponsavel },
                { label: "Contacto", value: inscrito.contactoResponsavel },
              ];

              return (
                <tr key={inscrito.rowIndex} className="border-b odd:bg-surfacealt/50">
                  <td className="p-2">
                    <div>
                      {new Date(inscrito.data).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                    <div className="text-inksoft">
                      {new Date(inscrito.data).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="p-2">{inscrito.nome}</td>
                  <td className="p-2">{formatarDataNascimento(inscrito.dataNascimento)}</td>
                  <td className="p-2">{inscrito.email}</td>
                  <td className="p-2">{inscrito.contacto}</td>
                  <td className="p-2">{inscrito.contactoEmergencia}</td>
                  <td className="p-2">
                    {inscrito.menorDe18 === "Sim" ? (
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        Sim · <DetailsCell items={responsavelItems} />
                      </span>
                    ) : (
                      inscrito.menorDe18 || "—"
                    )}
                  </td>
                  <td className="p-2">
                    <DetailsCell items={saudeItems} />
                  </td>
                  <td className="p-2">
                    <TextoCell texto={inscrito.observacoes} />
                  </td>
                  <td className="p-2">
                    <AdminEstadoEditor
                      rowIndex={inscrito.rowIndex}
                      initialEstado={inscrito.estado}
                      initialOrigem={inscrito.origemPagamento}
                      initialNota={inscrito.nota}
                      readOnly={arquivada}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((inscrito) => {
            const saudeItems = [
              { label: "Alimentar", value: inscrito.restricoesAlimentares },
              { label: "Atividade física", value: inscrito.restricoesAtividadeFisica },
              { label: "Alergias", value: inscrito.alergias },
              { label: "Outros", value: inscrito.outros },
            ];

            const responsavelItems = [
              { label: "Nome", value: inscrito.nomeResponsavel },
              { label: "Grau de parentesco", value: inscrito.grauParentesco },
              { label: "Email", value: inscrito.emailResponsavel },
              { label: "Contacto", value: inscrito.contactoResponsavel },
            ];

            return (
              <div key={inscrito.rowIndex} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{inscrito.nome}</p>
                    <p className="text-[11px] text-inksoft">
                      {new Date(inscrito.data).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                      })}{" "}
                      ·{" "}
                      {new Date(inscrito.data).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex-none text-sm">
                    <AdminEstadoEditor
                      rowIndex={inscrito.rowIndex}
                      initialEstado={inscrito.estado}
                      initialOrigem={inscrito.origemPagamento}
                      initialNota={inscrito.nota}
                      readOnly={arquivada}
                    />
                  </div>
                </div>

                <div className="mt-2.5 space-y-1 text-xs text-inkmuted">
                  <p className="truncate" title={inscrito.email}>
                    {inscrito.email}
                  </p>
                  <p>
                    {inscrito.contacto}
                    {inscrito.contactoEmergencia && (
                      <span className="text-inksoft"> · emergência {inscrito.contactoEmergencia}</span>
                    )}
                  </p>
                </div>

                <details className="group mt-2.5 border-t border-dashed border-line pt-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-branddark marker:content-none">
                    Ver detalhes
                  </summary>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-inksoft">
                        Data Nasc.
                      </dt>
                      <dd className="text-ink">
                        {formatarDataNascimento(inscrito.dataNascimento)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-inksoft">Menor 18</dt>
                      <dd className="text-ink">
                        {inscrito.menorDe18 === "Sim" ? (
                          <span className="flex items-center gap-1.5">
                            Sim · <DetailsCell items={responsavelItems} />
                          </span>
                        ) : (
                          inscrito.menorDe18 || "—"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-inksoft">Saúde</dt>
                      <dd className="text-ink">
                        <DetailsCell items={saudeItems} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-inksoft">
                        Observações
                      </dt>
                      <dd className="text-ink">
                        <TextoCell texto={inscrito.observacoes} />
                      </dd>
                    </div>
                  </dl>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
