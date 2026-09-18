"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Movimento } from "@/lib/sheets";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";
import { EVENTO } from "@/lib/evento";
import { CATEGORIAS_FIXAS, TIPOS, ehCategoriaFixa, type TipoMovimento } from "@/lib/contas";

function euros(centimos: number): string {
  return (centimos / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function dataCurta(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor || "—";
  return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Aceita "128,45", "128.45" e "1.234,56". */
function lerValor(valor: string): number {
  const limpo = valor.trim();
  const normalizado =
    limpo.includes(",") && limpo.includes(".")
      ? limpo.replace(/\./g, "").replace(",", ".")
      : limpo.replace(",", ".");
  return Math.round(Number(normalizado) * 100);
}

type Filtro = "todos" | TipoMovimento;

type Props = {
  movimentos: Movimento[];
  receitaCentimos: number;
  totalPagos: number;
  totalSociais: number;
  edicao: number;
  readOnly?: boolean;
};

type Formulario = {
  rowIndex?: number;
  tipo: TipoMovimento;
  titulo: string;
  valor: string;
  data: string;
  categoria: string;
  pagoPor: string;
  nota: string;
  comprovativo: string;
};

function formularioVazio(tipo: TipoMovimento): Formulario {
  return {
    tipo,
    titulo: "",
    valor: "",
    data: hoje(),
    categoria: CATEGORIAS_FIXAS[tipo][0],
    pagoPor: "",
    nota: "",
    comprovativo: "",
  };
}

export default function AdminContas({
  movimentos,
  receitaCentimos,
  totalPagos,
  totalSociais,
  edicao,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [form, setForm] = useState<Formulario | null>(null);
  const [novaCategoria, setNovaCategoria] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  function fechar() {
    setForm(null);
    setNovaCategoria(null);
    setConfirmarEliminar(false);
    setErro(null);
  }
  useCloseOnEscape(!!form && !confirmarEliminar, fechar);
  useCloseOnEscape(confirmarEliminar, () => setConfirmarEliminar(false));

  const entradas = movimentos.filter((m) => m.tipo === "entrada");
  const saidas = movimentos.filter((m) => m.tipo === "saida");
  const soma = (lista: Movimento[]) => lista.reduce((t, m) => t + m.valorCentimos, 0);
  const totalEntradas = receitaCentimos + soma(entradas);
  const totalSaidas = soma(saidas);
  const saldo = totalEntradas - totalSaidas;

  /** Fixas primeiro (mesmo a zero), depois as criadas nesta edição, da maior para a menor. */
  function categoriasDe(tipo: TipoMovimento) {
    const lista = tipo === "entrada" ? entradas : saidas;
    const fixas = CATEGORIAS_FIXAS[tipo].map((nome) => ({
      nome,
      fixa: true,
      total: soma(lista.filter((m) => m.categoria.toLowerCase() === nome.toLowerCase())),
    }));
    const criadas = Array.from(
      new Set(lista.filter((m) => !ehCategoriaFixa(tipo, m.categoria)).map((m) => m.categoria))
    )
      .map((nome) => ({
        nome,
        fixa: false,
        total: soma(lista.filter((m) => m.categoria === nome)),
      }))
      .sort((a, b) => b.total - a.total);
    return { fixas, criadas };
  }

  const catEntradas = categoriasDe("entrada");
  const catSaidas = categoriasDe("saida");
  const maxEntradas = Math.max(
    receitaCentimos,
    ...[...catEntradas.fixas, ...catEntradas.criadas].map((c) => c.total)
  );
  const maxSaidas = Math.max(0, ...[...catSaidas.fixas, ...catSaidas.criadas].map((c) => c.total));

  const visiveis = movimentos
    .filter((m) => filtro === "todos" || m.tipo === filtro)
    .sort((a, b) => b.data.localeCompare(a.data) || b.rowIndex - a.rowIndex);

  function abrirNovo() {
    setForm(formularioVazio("saida"));
    setNovaCategoria(null);
    setErro(null);
  }

  function abrirEdicao(m: Movimento) {
    setForm({
      rowIndex: m.rowIndex,
      tipo: m.tipo,
      titulo: m.titulo,
      valor: (m.valorCentimos / 100).toFixed(2).replace(".", ","),
      data: m.data,
      categoria: m.categoria,
      pagoPor: m.pagoPor,
      nota: m.nota,
      comprovativo: m.comprovativo,
    });
    setNovaCategoria(null);
    setErro(null);
  }

  function mudarTipo(tipo: TipoMovimento) {
    if (!form || form.tipo === tipo) return;
    setForm({ ...form, tipo, categoria: CATEGORIAS_FIXAS[tipo][0] });
    setNovaCategoria(null);
  }

  const valorCentimos = form ? lerValor(form.valor) : 0;
  const valorValido = Number.isFinite(valorCentimos) && valorCentimos > 0;
  const categoriaFinal = novaCategoria !== null ? novaCategoria.trim() : form?.categoria ?? "";
  const podeGuardar = !!form && !!form.titulo.trim() && valorValido && !!categoriaFinal;

  async function guardar() {
    if (!form || !podeGuardar) return;
    setAGuardar(true);
    setErro(null);

    const res = await fetch("/api/admin/contas/guardar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rowIndex: form.rowIndex,
        tipo: form.tipo,
        data: form.data,
        titulo: form.titulo,
        categoria: categoriaFinal,
        pagoPor: form.pagoPor,
        valorCentimos,
        comprovativo: form.comprovativo,
        nota: form.nota,
        edicao,
      }),
    });
    const resposta = await res.json().catch(() => ({}));
    setAGuardar(false);

    if (!res.ok) {
      setErro(resposta.error ?? "Não foi possível guardar.");
      return;
    }

    fechar();
    router.refresh();
  }

  async function eliminar() {
    if (!form?.rowIndex) return;
    setAGuardar(true);

    const res = await fetch("/api/admin/contas/eliminar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex: form.rowIndex }),
    });
    setAGuardar(false);

    if (!res.ok) {
      setConfirmarEliminar(false);
      setErro("Não foi possível eliminar. Tenta novamente.");
      return;
    }

    fechar();
    router.refresh();
  }

  const opcoesFiltro: { valor: Filtro; label: string; total: number }[] = [
    { valor: "todos", label: "Todos", total: movimentos.length },
    { valor: "entrada", label: "Entradas", total: entradas.length },
    { valor: "saida", label: "Saídas", total: saidas.length },
  ];

  // Categorias disponíveis na modal: fixas + as já usadas nesta edição para esse tipo.
  const categoriasDoForm = form
    ? [
        ...CATEGORIAS_FIXAS[form.tipo],
        ...(form.tipo === "entrada" ? catEntradas : catSaidas).criadas.map((c) => c.nome),
      ]
    : [];
  // Ao editar um movimento antigo, a categoria dele pode já não estar na lista.
  if (form && form.categoria && !categoriasDoForm.includes(form.categoria)) {
    categoriasDoForm.push(form.categoria);
  }

  return (
    <div>
      <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
        <Cartao titulo="Entradas" valor={`+${euros(totalEntradas)}`} tom="bom" />
        <Cartao titulo="Saídas" valor={`−${euros(totalSaidas)}`} />
        <Cartao titulo="Saldo" valor={euros(saldo)} tom={saldo < 0 ? "mau" : "bom"} destaque />
      </div>

      <div className="mb-8 grid gap-3 lg:grid-cols-2">
        <Quadro
          titulo="Entradas"
          total={totalEntradas}
          tom="bom"
          nota={
            <>
              Inscrições = {totalPagos} {totalPagos === 1 ? "pago" : "pagos"} × {euros(EVENTO.valorCentimos)}
              {totalSociais > 0 &&
                ` · ${totalSociais} ${totalSociais === 1 ? "vaga social não conta" : "vagas sociais não contam"}`}
            </>
          }
        >
          <LinhaCategoria
            nome="Inscrições"
            etiqueta="auto"
            total={receitaCentimos}
            max={maxEntradas}
            cor="bg-brand"
            fixa
          />
          {catEntradas.fixas.map((c) => (
            <LinhaCategoria
              key={c.nome}
              nome={c.nome}
              total={c.total}
              max={maxEntradas}
              cor="bg-brand"
              fixa
            />
          ))}
          {catEntradas.criadas.length > 0 && <Divisoria />}
          {catEntradas.criadas.map((c) => (
            <LinhaCategoria
              key={c.nome}
              nome={c.nome}
              total={c.total}
              max={maxEntradas}
              cor="bg-brand"
            />
          ))}
        </Quadro>

        <Quadro titulo="Saídas" total={totalSaidas}>
          {catSaidas.fixas.map((c) => (
            <LinhaCategoria
              key={c.nome}
              nome={c.nome}
              total={c.total}
              max={maxSaidas}
              cor="bg-ink"
              fixa
            />
          ))}
          {catSaidas.criadas.length > 0 && <Divisoria />}
          {catSaidas.criadas.map((c) => (
            <LinhaCategoria
              key={c.nome}
              nome={c.nome}
              total={c.total}
              max={maxSaidas}
              cor="bg-inkmuted"
            />
          ))}
        </Quadro>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-0.5 rounded-xl border border-line bg-surfacealt p-0.5">
          {opcoesFiltro.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setFiltro(opcao.valor)}
              className={
                "rounded-lg px-3 py-1 text-sm font-medium transition " +
                (filtro === opcao.valor ? "bg-white text-ink shadow-sm" : "text-inkmuted hover:text-ink")
              }
            >
              {opcao.label}{" "}
              <span className={filtro === opcao.valor ? "text-branddark" : "text-inksoft"}>
                ({opcao.total})
              </span>
            </button>
          ))}
        </div>
        <span className="flex-1" />
        {!readOnly && (
          <button
            type="button"
            onClick={abrirNovo}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink hover:bg-branddark"
          >
            + Adicionar
          </button>
        )}
      </div>

      {erro && !form && <p className="mb-3 text-sm text-red-600">{erro}</p>}

      {visiveis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <p className="text-sm font-semibold text-ink">Sem movimentos no FIRE {edicao}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-inkmuted">
            {readOnly
              ? "Esta edição não tem movimentos registados."
              : "Regista aqui as entradas e saídas — os totais acima atualizam-se sozinhos."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-inksoft">
              <tr className="border-b border-line">
                <th className="p-2.5 font-medium">Data</th>
                <th className="p-2.5 font-medium">Título</th>
                <th className="p-2.5 font-medium">Categoria</th>
                <th className="whitespace-nowrap p-2.5 font-medium">Pago por</th>
                <th className="p-2.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((m) => {
                const entrada = m.tipo === "entrada";
                return (
                  <tr
                    key={m.rowIndex}
                    onClick={readOnly ? undefined : () => abrirEdicao(m)}
                    title={readOnly ? undefined : "Clicar para editar"}
                    className={
                      "border-b border-line last:border-b-0 odd:bg-surfacealt/50 " +
                      (readOnly ? "" : "cursor-pointer hover:bg-surfacealt")
                    }
                  >
                    <td className="whitespace-nowrap p-2.5 tabular-nums text-inkmuted">
                      {dataCurta(m.data)}
                    </td>
                    <td className="p-2.5">
                      <p className="text-ink">{m.titulo}</p>
                      {m.nota && <p className="mt-0.5 text-xs text-inksoft">{m.nota}</p>}
                    </td>
                    <td className="whitespace-nowrap p-2.5">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs " +
                          (entrada ? "bg-brand/15 text-branddark" : "bg-ink/5 text-ink")
                        }
                      >
                        {m.categoria}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-2.5 text-inkmuted">{m.pagoPor || "—"}</td>
                    <td
                      className={
                        "whitespace-nowrap p-2.5 text-right tabular-nums " +
                        (entrada ? "font-medium text-branddark" : "text-ink")
                      }
                    >
                      {entrada ? "+" : "−"}
                      {euros(m.valorCentimos)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fechar}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">
              {form.rowIndex ? "Editar movimento" : "Novo movimento"}
            </p>
            <p className="mt-0.5 text-xs text-inksoft">Fica associado ao FIRE {edicao}.</p>

            <div className="mt-3 flex w-full gap-0.5 rounded-xl border border-line bg-surfacealt p-0.5">
              {(["entrada", "saida"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => mudarTipo(t)}
                  aria-pressed={form.tipo === t}
                  className={
                    "flex-1 rounded-lg px-3 py-1.5 text-sm transition " +
                    (form.tipo === t
                      ? "bg-white font-semibold shadow-sm " + (t === "entrada" ? "text-branddark" : "text-ink")
                      : "font-medium text-inkmuted hover:text-ink")
                  }
                >
                  {TIPOS[t]}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-3">
              <Campo label="Título">
                <input
                  type="text"
                  autoFocus
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  maxLength={200}
                  className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                />
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Valor (€)">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="w-full rounded border border-line px-2.5 py-1.5 text-sm tabular-nums"
                  />
                </Campo>
                <Campo label="Data">
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                  />
                </Campo>
              </div>

              <div>
                <span className="mb-1 block text-[11px] uppercase tracking-wide text-inksoft">Categoria</span>
                <div className="flex flex-wrap gap-1.5">
                  {categoriasDoForm.map((c) => {
                    const ativa = novaCategoria === null && form.categoria === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, categoria: c });
                          setNovaCategoria(null);
                        }}
                        aria-pressed={ativa}
                        className={
                          "rounded-full border px-2.5 py-1 text-xs transition " +
                          (ativa
                            ? "border-branddark bg-brand/15 font-medium text-branddark"
                            : "border-line text-inkmuted hover:bg-surfacealt")
                        }
                      >
                        {c}
                      </button>
                    );
                  })}
                  {novaCategoria === null ? (
                    <button
                      type="button"
                      onClick={() => setNovaCategoria("")}
                      className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-inksoft hover:text-ink"
                    >
                      + nova
                    </button>
                  ) : (
                    <input
                      type="text"
                      autoFocus
                      value={novaCategoria}
                      onChange={(e) => setNovaCategoria(e.target.value)}
                      maxLength={60}
                      aria-label="Nome da nova categoria"
                      className="min-w-[140px] flex-1 rounded-full border border-branddark px-2.5 py-1 text-xs outline-none"
                    />
                  )}
                </div>
              </div>

              {form.tipo === "saida" && (
                <Campo label="Pago por">
                  <input
                    type="text"
                    value={form.pagoPor}
                    onChange={(e) => setForm({ ...form, pagoPor: e.target.value })}
                    maxLength={80}
                    className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                  />
                </Campo>
              )}

              <Campo label="Nota (opcional)">
                <textarea
                  value={form.nota}
                  onChange={(e) => setForm({ ...form, nota: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                />
              </Campo>
            </div>

            {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}

            <div className="mt-4 flex items-center justify-between gap-2">
              {form.rowIndex ? (
                <button
                  type="button"
                  onClick={() => setConfirmarEliminar(true)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={fechar} className="text-sm text-inkmuted hover:text-ink">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={aGuardar || !podeGuardar}
                  onClick={guardar}
                  className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-brandink disabled:opacity-50"
                >
                  {aGuardar ? "A guardar…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {form && confirmarEliminar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmarEliminar(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">Eliminar movimento</p>
            <p className="mt-1.5 text-sm text-inkmuted">
              Queres eliminar &ldquo;{form.titulo}&rdquo; ({euros(valorValido ? valorCentimos : 0)})?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmarEliminar(false)}
                className="text-sm text-inkmuted hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={aGuardar}
                onClick={eliminar}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {aGuardar ? "A eliminar…" : "Sim, eliminar"}
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
  tom,
  destaque,
}: {
  titulo: string;
  valor: string;
  tom?: "bom" | "mau";
  destaque?: boolean;
}) {
  const cor = tom === "bom" ? "text-branddark" : tom === "mau" ? "text-red-700" : "text-ink";
  const fundo =
    destaque && tom === "mau" ? "border-red-100 bg-red-50" : "border-line bg-surfacealt";
  return (
    <div className={"rounded-xl border px-4 py-3 " + fundo}>
      <p className="text-[11px] uppercase tracking-wide text-inksoft">{titulo}</p>
      <p className={"mt-0.5 text-xl font-bold tabular-nums " + cor}>{valor}</p>
    </div>
  );
}

// Nome · barra · valor · "fixa" — partilhada pelas linhas e pelo total, para alinharem.
const GRELHA_LINHA =
  "grid grid-cols-[minmax(0,11rem)_1fr_5.5rem_2.25rem] items-center gap-3 text-sm";

function Quadro({
  titulo,
  total,
  tom,
  nota,
  children,
}: {
  titulo: string;
  total: number;
  tom?: "bom";
  nota?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line p-4">
      <p className="mb-3 text-sm font-semibold text-ink">{titulo}</p>
      <div className="space-y-2">{children}</div>
      {/* Total alinhado com a coluna dos valores. */}
      <div className={GRELHA_LINHA + " mt-3 border-t border-line pt-2.5"}>
        <span className="font-semibold text-ink">Total</span>
        <span />
        <span
          className={
            "text-right font-semibold tabular-nums " + (tom === "bom" ? "text-branddark" : "text-ink")
          }
        >
          {euros(total)}
        </span>
        <span />
      </div>
      {nota && <p className="mt-2 text-[11px] text-inksoft">{nota}</p>}
    </section>
  );
}

function LinhaCategoria({
  nome,
  etiqueta,
  total,
  max,
  cor,
  fixa,
}: {
  nome: string;
  etiqueta?: string;
  total: number;
  max: number;
  cor: string;
  fixa?: boolean;
}) {
  const vazia = total === 0;
  return (
    <div className={GRELHA_LINHA}>
      <span className={"truncate " + (vazia ? "text-inksoft" : "text-ink")}>
        {nome}
        {etiqueta && (
          <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-branddark">
            {etiqueta}
          </span>
        )}
      </span>
      <span className="h-1.5 overflow-hidden rounded bg-line">
        {!vazia && (
          <span
            className={"block h-full rounded " + cor}
            style={{ width: `${(total / Math.max(max, 1)) * 100}%` }}
          />
        )}
      </span>
      <span className={"text-right tabular-nums " + (vazia ? "text-inksoft" : "font-medium text-ink")}>
        {euros(total)}
      </span>
      <span className="text-center text-[10px] text-inksoft">{fixa ? "fixa" : ""}</span>
    </div>
  );
}

function Divisoria() {
  return <div className="border-t border-dashed border-line" />;
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-inksoft">{label}</span>
      {children}
    </label>
  );
}
