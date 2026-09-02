"use client";

import { useState } from "react";
import type { InscritoRow, Equipa } from "@/lib/sheets";
import AdminEstadoEditor from "@/components/AdminEstadoEditor";
import AdminEnviarDocs from "@/components/AdminEnviarDocs";
import AdminResumoRestricoes from "@/components/AdminResumoRestricoes";
import AdminEquipas from "@/components/AdminEquipas";

type Filtro = "todos" | "pago" | "pendente";
type ItemRestricao = { nome: string; texto: string };

type Props = {
  inscritos: InscritoRow[];
  equipas: Equipa[];
  restricoesFisicas: ItemRestricao[];
  restricoesAlimentares: ItemRestricao[];
  alergias: ItemRestricao[];
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
  equipas,
  restricoesFisicas,
  restricoesAlimentares,
  alergias,
}: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const totalPago = inscritos.filter((i) => i.estado.toLowerCase() === "pago").length;
  const totalPendente = inscritos.length - totalPago;

  const paraDestinatario = (i: InscritoRow) => {
    const emails = [i.email];
    if (i.menorDe18 === "Sim" && i.emailResponsavel) emails.push(i.emailResponsavel);
    return { nome: i.nome, emails };
  };
  const destinatariosValidados = inscritos
    .filter((i) => i.estado.toLowerCase() === "pago")
    .map(paraDestinatario);
  const destinatariosPendentes = inscritos
    .filter((i) => i.estado.toLowerCase() !== "pago")
    .map(paraDestinatario);

  const visiveis = inscritos.filter((i) => {
    if (filtro === "todos") return true;
    if (filtro === "pago") return i.estado.toLowerCase() === "pago";
    return i.estado.toLowerCase() !== "pago";
  });

  const opcoesFiltro: { valor: Filtro; label: string; total: number }[] = [
    { valor: "todos", label: "Todos", total: inscritos.length },
    { valor: "pago", label: "Validados", total: totalPago },
    { valor: "pendente", label: "Pendentes", total: totalPendente },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Inscritos ({inscritos.length})</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="order-2 flex w-full items-center gap-0.5 rounded-xl border border-line bg-surfacealt p-1 sm:order-1 sm:w-auto">
          {opcoesFiltro.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setFiltro(opcao.valor)}
              className={
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:flex-none " +
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

        {/* Resumo + Equipas + Enviar Email Final como chips soltos, full width em mobile */}
        <div className="order-1 flex w-full items-center gap-2 sm:order-2 sm:ml-auto sm:w-auto">
          <div className="flex-1 sm:flex-none [&>button]:w-full">
            <AdminResumoRestricoes
              restricoesAlimentares={restricoesAlimentares}
              restricoesFisicas={restricoesFisicas}
              alergias={alergias}
              transparente
            />
          </div>
          <div className="flex-1 sm:flex-none [&>button]:w-full">
            <AdminEquipas equipas={equipas} inscritos={inscritos} transparente />
          </div>
          <div className="flex-1 sm:flex-none [&>button]:w-full">
            <AdminEnviarDocs validados={destinatariosValidados} pendentes={destinatariosPendentes} />
          </div>
        </div>
      </div>

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
                <tr key={inscrito.rowIndex} className="border-b">
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
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
