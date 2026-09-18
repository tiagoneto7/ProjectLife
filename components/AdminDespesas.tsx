"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Despesa } from "@/lib/sheets";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";
import AdminVista, { useVista } from "@/components/AdminVista";

const CATEGORIAS = [
  "Alimentação",
  "Material",
  "Equipamento",
  "Transporte",
  "Atividades",
  "Espaço",
  "Outros",
];

function euros(centimos: number): string {
  return (centimos / 100).toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR",
  });
}

function dataCurta(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor || "—";
  return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  despesas: Despesa[];
  receitaCentimos: number;
  totalPagos: number;
  edicao: number;
  readOnly?: boolean;
};

export default function AdminDespesas({
  despesas,
  receitaCentimos,
  totalPagos,
  edicao,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [vista, mudarVista] = useVista("despesas", "lista");

  const [novoAberto, setNovoAberto] = useState(false);
  const [data, setData] = useState(hoje);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [pagoPor, setPagoPor] = useState("");
  const [valor, setValor] = useState("");
  const [comprovativo, setComprovativo] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [aEliminar, setAEliminar] = useState<Despesa | null>(null);
  const [aApagar, setAApagar] = useState(false);

  const totalCentimos = despesas.reduce((soma, d) => soma + d.valorCentimos, 0);
  const saldoCentimos = receitaCentimos - totalCentimos;

  function fecharNovo() {
    setNovoAberto(false);
    setErro(null);
  }
  useCloseOnEscape(novoAberto, fecharNovo);
  useCloseOnEscape(!!aEliminar, () => setAEliminar(null));

  useEffect(() => {
    if (!novoAberto) return;
    setData(hoje());
    setDescricao("");
    setCategoria(CATEGORIAS[0]);
    setPagoPor("");
    setValor("");
    setComprovativo("");
  }, [novoAberto]);

  const valorCentimos = Math.round(Number(valor.replace(",", ".")) * 100);
  const valorValido = Number.isFinite(valorCentimos) && valorCentimos > 0;

  async function guardar() {
    if (!descricao.trim() || !valorValido) return;
    setAGuardar(true);
    setErro(null);

    const res = await fetch("/api/admin/despesas/criar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data,
        descricao,
        categoria,
        pagoPor,
        valorCentimos,
        comprovativo,
        edicao,
      }),
    });
    const resposta = await res.json().catch(() => ({}));

    setAGuardar(false);

    if (!res.ok) {
      setErro(resposta.error ?? "Não foi possível guardar.");
      return;
    }

    fecharNovo();
    router.refresh();
  }

  async function eliminar() {
    if (!aEliminar) return;
    setAApagar(true);

    const res = await fetch("/api/admin/despesas/eliminar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex: aEliminar.rowIndex }),
    });

    setAApagar(false);

    if (!res.ok) {
      setErro("Não foi possível eliminar. Tenta novamente.");
      return;
    }

    setAEliminar(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
        <Cartao titulo={`Receita (${totalPagos} pagos)`} valor={euros(receitaCentimos)} tom="bom" />
        <Cartao
          titulo="Despesas"
          valor={euros(totalCentimos)}
          nota={`${despesas.length} ${despesas.length === 1 ? "registo" : "registos"}`}
        />
        <Cartao
          titulo="Saldo"
          valor={euros(saldoCentimos)}
          tom={saldoCentimos < 0 ? "mau" : "bom"}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <AdminVista vista={vista} onMudar={mudarVista} />
        <span className="flex-1" />
        {!readOnly && (
          <button
            type="button"
            onClick={() => setNovoAberto(true)}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink hover:bg-branddark"
          >
            + Adicionar despesa
          </button>
        )}
      </div>

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

      {despesas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <p className="text-sm font-semibold text-ink">Sem despesas no FIRE {edicao}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-inkmuted">
            {readOnly
              ? "Esta edição não tem despesas registadas."
              : "Vai registando aqui o que for sendo gasto — o saldo acima atualiza-se sozinho."}
          </p>
        </div>
      ) : vista === "grelha" ? (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {despesas.map((d) => (
            <div key={d.rowIndex} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{d.descricao}</p>
                  <p className="text-[11px] text-inksoft">
                    {dataCurta(d.data)}
                    {d.categoria && ` · ${d.categoria}`}
                  </p>
                </div>
                <p className="flex-none text-sm font-semibold tabular-nums text-ink">
                  {euros(d.valorCentimos)}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-inkmuted">
                <span>{d.pagoPor ? `Pago por ${d.pagoPor}` : "—"}</span>
                <span className="flex flex-none items-center gap-3">
                  {d.comprovativo && (
                    <a
                      href={d.comprovativo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline decoration-dotted underline-offset-2"
                    >
                      Comprovativo
                    </a>
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setAEliminar(d)}
                      className="text-inksoft hover:text-red-600"
                      title="Eliminar despesa"
                    >
                      ✕
                    </button>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Data</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Categoria</th>
                <th className="whitespace-nowrap p-2">Pago por</th>
                <th className="p-2 text-right">Valor</th>
                <th className="p-2">Comprovativo</th>
                {!readOnly && <th className="p-2" />}
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => (
                <tr key={d.rowIndex} className="border-b odd:bg-surfacealt/50">
                  <td className="whitespace-nowrap p-2">{dataCurta(d.data)}</td>
                  <td className="p-2">{d.descricao}</td>
                  <td className="whitespace-nowrap p-2 text-inkmuted">{d.categoria || "—"}</td>
                  <td className="whitespace-nowrap p-2 text-inkmuted">{d.pagoPor || "—"}</td>
                  <td className="whitespace-nowrap p-2 text-right tabular-nums">
                    {euros(d.valorCentimos)}
                  </td>
                  <td className="p-2">
                    {d.comprovativo ? (
                      <a
                        href={d.comprovativo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink underline decoration-dotted underline-offset-2"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="text-inksoft">—</span>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => setAEliminar(d)}
                        className="text-xs text-inksoft hover:text-red-600"
                        title="Eliminar despesa"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {novoAberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fecharNovo}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">Nova despesa</p>
            <p className="mt-1 text-xs text-inksoft">Fica associada ao FIRE {edicao}.</p>

            <div className="mt-3 space-y-2.5">
              <Campo label="Descrição">
                <input
                  type="text"
                  autoFocus
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Compras para o jantar de sábado"
                  className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                />
              </Campo>

              <div className="grid grid-cols-2 gap-2.5">
                <Campo label="Valor (€)">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="128,45"
                    className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                  />
                </Campo>
                <Campo label="Data">
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                  />
                </Campo>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Campo label="Categoria">
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-sm"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Pago por">
                  <input
                    type="text"
                    value={pagoPor}
                    onChange={(e) => setPagoPor(e.target.value)}
                    placeholder="Tiago"
                    className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                  />
                </Campo>
              </div>

              <Campo label="Comprovativo (link, opcional)">
                <input
                  type="url"
                  value={comprovativo}
                  onChange={(e) => setComprovativo(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                />
              </Campo>
            </div>

            {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={fecharNovo} className="text-sm text-inkmuted hover:text-ink">
                Cancelar
              </button>
              <button
                type="button"
                disabled={aGuardar || !descricao.trim() || !valorValido}
                onClick={guardar}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink disabled:opacity-50"
              >
                {aGuardar ? "A guardar…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {aEliminar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAEliminar(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">Eliminar despesa</p>
            <p className="mt-1.5 text-sm text-inkmuted">
              Queres eliminar &ldquo;{aEliminar.descricao}&rdquo; ({euros(aEliminar.valorCentimos)})?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAEliminar(null)}
                className="text-sm text-inkmuted hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={aApagar}
                onClick={eliminar}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {aApagar ? "A eliminar…" : "Sim, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Cartao({
  titulo,
  valor,
  nota,
  tom,
}: {
  titulo: string;
  valor: string;
  nota?: string;
  tom?: "bom" | "mau";
}) {
  const cor = tom === "bom" ? "text-branddark" : tom === "mau" ? "text-red-600" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-surfacealt px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-inksoft">{titulo}</p>
      <p className={"mt-0.5 text-xl font-bold tabular-nums " + cor}>
        {valor}
        {nota && <span className="ml-2 text-xs font-medium text-inksoft">{nota}</span>}
      </p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-inksoft">{label}</span>
      {children}
    </label>
  );
}
