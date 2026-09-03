"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InscritoRow, Equipa } from "@/lib/sheets";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";

// Cada cor tem um tom claro (fundo do cabeçalho da equipa) e um tom forte
// (aro de seleção), para o aro ficar sempre bem visível.
const CORES = [
  { bg: "#C9E88A", aro: "#7AA002" }, // verde
  { bg: "#A9D6F5", aro: "#2F87C9" }, // azul
  { bg: "#F5BBA0", aro: "#E8633A" }, // terracota
  { bg: "#E3B6F2", aro: "#A855D9" }, // roxo
  { bg: "#F5D07E", aro: "#D9A441" }, // âmbar
  { bg: "#EEE18A", aro: "#D9C226" }, // amarelo
  { bg: "#F5A9CE", aro: "#E0559A" }, // rosa
  { bg: "#C7C7C7", aro: "#8A8A8A" }, // cinza
];

// As cores disponíveis são todas claras, por isso o texto do cabeçalho fica sempre escuro.
const COR_TEXTO_CABECALHO = "#1C2400";

function primeiroEUltimoNome(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length <= 1) return nomeCompleto;
  return `${partes[0]} ${partes[partes.length - 1]}`;
}

function SeletorCor({
  valor,
  onEscolher,
}: {
  valor: string;
  onEscolher: (cor: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 py-1">
      {CORES.map((c) => (
        <button
          key={c.bg}
          type="button"
          onClick={() => onEscolher(c.bg)}
          aria-label={`Escolher cor ${c.bg}`}
          className="h-7 w-7 rounded-full border border-black/10 transition"
          style={{
            backgroundColor: c.bg,
            boxShadow: valor === c.bg ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${c.aro}` : "none",
          }}
        />
      ))}
    </div>
  );
}

type Props = {
  equipas: Equipa[];
  inscritos: InscritoRow[];
  transparente?: boolean;
};

export default function AdminEquipas({ equipas: equipasIniciais, inscritos, transparente }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [equipas, setEquipas] = useState(equipasIniciais);
  const [atribuicoes, setAtribuicoes] = useState<Record<number, string>>(() =>
    Object.fromEntries(inscritos.map((i) => [i.rowIndex, i.equipaId || ""]))
  );
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [sobreZona, setSobreZona] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState(CORES[0].bg);
  const [aCriar, setACriar] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCor, setEditCor] = useState("");
  const [aGuardarEdicao, setAGuardarEdicao] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  // Tocar num chip abre esta modal para escolher a equipa — é a forma de
  // atribuir em ecrãs táteis, onde o drag-and-drop nativo não funciona.
  const [atribuirPara, setAtribuirPara] = useState<InscritoRow | null>(null);

  function fechar() {
    setOpen(false);
    setNovoAberto(false);
    setEditId(null);
    setErro(null);
  }
  useCloseOnEscape(open && !confirmarEliminar && !atribuirPara, fechar);
  useCloseOnEscape(confirmarEliminar, () => setConfirmarEliminar(false));
  useCloseOnEscape(!!atribuirPara, () => setAtribuirPara(null));

  // Mantém o estado local em linha com o que vem do servidor sempre que a página revalida.
  useEffect(() => {
    setEquipas(equipasIniciais);
  }, [equipasIniciais]);
  useEffect(() => {
    setAtribuicoes(Object.fromEntries(inscritos.map((i) => [i.rowIndex, i.equipaId || ""])));
  }, [inscritos]);

  const idsValidos = new Set(equipas.map((e) => e.id));
  const naoAtribuidos = inscritos.filter((i) => {
    const eq = atribuicoes[i.rowIndex] || "";
    return !eq || !idsValidos.has(eq);
  });
  const validados = naoAtribuidos.filter((i) => i.estado.toLowerCase() === "pago");
  const pendentes = naoAtribuidos.filter((i) => i.estado.toLowerCase() !== "pago");

  async function atribuir(rowIndex: number, equipaId: string) {
    const anterior = atribuicoes[rowIndex] || "";
    if (anterior === equipaId) return;

    setAtribuicoes((prev) => ({ ...prev, [rowIndex]: equipaId }));

    const res = await fetch("/api/admin/equipas/atribuir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex, equipaId }),
    });

    if (!res.ok) {
      setAtribuicoes((prev) => ({ ...prev, [rowIndex]: anterior }));
      setErro("Não foi possível guardar essa alteração. Tenta novamente.");
      return;
    }

    router.refresh();
  }

  async function criarEquipa() {
    if (!novoNome.trim()) return;
    setACriar(true);
    setErro(null);

    const res = await fetch("/api/admin/equipas/criar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoNome.trim(), cor: novaCor }),
    });
    const data = await res.json();

    setACriar(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível criar a equipa.");
      return;
    }

    setEquipas((prev) => [...prev, data.equipa]);
    setNovoNome("");
    setNovaCor(CORES[0].bg);
    setNovoAberto(false);
    router.refresh();
  }

  function abrirEdicao(equipa: Equipa) {
    setEditId(equipa.id);
    setEditNome(equipa.nome);
    setEditCor(equipa.cor || CORES[0].bg);
    setConfirmarEliminar(false);
    setErro(null);
  }

  async function guardarEdicao() {
    if (!editId || !editNome.trim()) return;
    setAGuardarEdicao(true);
    setErro(null);

    const res = await fetch("/api/admin/equipas/editar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, nome: editNome.trim(), cor: editCor }),
    });
    const data = await res.json();

    setAGuardarEdicao(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível guardar.");
      return;
    }

    setEquipas((prev) =>
      prev.map((e) => (e.id === editId ? { ...e, nome: editNome.trim(), cor: editCor } : e))
    );
    setEditId(null);
    router.refresh();
  }

  async function eliminarEquipa() {
    if (!editId) return;

    setAGuardarEdicao(true);
    setErro(null);

    const res = await fetch("/api/admin/equipas/editar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, eliminar: true }),
    });

    setAGuardarEdicao(false);

    if (!res.ok) {
      setErro("Não foi possível eliminar.");
      return;
    }

    setEquipas((prev) => prev.filter((e) => e.id !== editId));
    setEditId(null);
    setConfirmarEliminar(false);
    router.refresh();
  }

  function chip(inscrito: InscritoRow) {
    const pago = inscrito.estado.toLowerCase() === "pago";
    return (
      <button
        key={inscrito.rowIndex}
        type="button"
        draggable
        onDragStart={() => setArrastando(inscrito.rowIndex)}
        onDragEnd={() => setArrastando(null)}
        onClick={() => setAtribuirPara(inscrito)}
        title="Tocar para escolher a equipa"
        className="flex cursor-grab items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink shadow-sm hover:bg-surfacealt active:cursor-grabbing"
      >
        <span
          className={`h-1.5 w-1.5 flex-none rounded-full ${pago ? "bg-green-500" : "bg-amber-400"}`}
          aria-hidden="true"
        />
        {primeiroEUltimoNome(inscrito.nome)}
      </button>
    );
  }

  function dropzoneProps(zona: string, onDrop: () => void) {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setSobreZona(zona);
      },
      onDragLeave: () => setSobreZona((z) => (z === zona ? null : z)),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setSobreZona(null);
        onDrop();
      },
    };
  }

  const equipaAEliminar = equipas.find((e) => e.id === editId) ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          transparente
            ? "rounded-lg border border-line bg-surface px-3 py-1.5 text-center text-sm font-medium text-ink hover:bg-surfacealt"
            : "rounded-lg border border-line px-3 py-1.5 text-left text-sm font-medium text-ink hover:bg-surfacealt"
        }
      >
        Equipas
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fechar}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-none items-center justify-between">
              <p className="text-sm font-semibold text-ink">Construtor de equipas</p>
              <button type="button" onClick={fechar} className="text-sm text-inkmuted hover:text-ink">
                Fechar
              </button>
            </div>

            {erro && <p className="mt-2 flex-none text-sm text-red-600">{erro}</p>}

            <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto sm:flex-row sm:overflow-hidden">
              {/* Não atribuídos */}
              <div
                {...dropzoneProps("nao-atribuidos", () => arrastando !== null && atribuir(arrastando, ""))}
                className={
                  "flex max-h-48 w-full flex-none flex-col overflow-y-auto rounded-lg border p-2 sm:max-h-none sm:w-48 " +
                  (sobreZona === "nao-atribuidos"
                    ? "border-branddark bg-surfacealt"
                    : "border-line")
                }
              >
                <p className="mb-1.5 flex-none px-1 text-xs font-semibold uppercase tracking-wide text-inksoft">
                  Validados ({validados.length})
                </p>
                <div className="mb-3 flex flex-none flex-wrap gap-1.5 px-1">
                  {validados.length === 0 ? (
                    <p className="text-xs text-inksoft">—</p>
                  ) : (
                    validados.map(chip)
                  )}
                </div>
                <p className="mb-1.5 flex-none px-1 text-xs font-semibold uppercase tracking-wide text-inksoft">
                  Pendentes ({pendentes.length})
                </p>
                <div className="flex flex-none flex-wrap gap-1.5 px-1">
                  {pendentes.length === 0 ? (
                    <p className="text-xs text-inksoft">—</p>
                  ) : (
                    pendentes.map(chip)
                  )}
                </div>
              </div>

              {/* Equipas */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {equipas.map((equipa) => {
                  const membros = inscritos.filter((i) => (atribuicoes[i.rowIndex] || "") === equipa.id);
                  const emEdicao = editId === equipa.id;

                  return (
                    <div key={equipa.id} className="rounded-lg border border-line">
                      <button
                        type="button"
                        onClick={() => (emEdicao ? setEditId(null) : abrirEdicao(equipa))}
                        title="Clicar para editar nome e cor"
                        className="flex w-full items-center justify-between rounded-t-lg px-3 py-2 text-left"
                        style={{ backgroundColor: equipa.cor || CORES[0].bg }}
                      >
                        <span className="text-sm font-semibold" style={{ color: COR_TEXTO_CABECALHO }}>
                          {equipa.nome}
                        </span>
                        <span className="text-xs" style={{ color: COR_TEXTO_CABECALHO }}>
                          {membros.length} {membros.length === 1 ? "membro" : "membros"} · editar ✎
                        </span>
                      </button>

                      {emEdicao && (
                        <div className="space-y-2 border-b border-line bg-surfacealt p-3">
                          <input
                            type="text"
                            autoFocus
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            placeholder="Nome da equipa"
                            className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && guardarEdicao()}
                          />
                          <SeletorCor valor={editCor} onEscolher={setEditCor} />

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setConfirmarEliminar(true)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Eliminar equipa
                            </button>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditId(null)}
                                className="text-sm text-inkmuted hover:text-ink"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={aGuardarEdicao || !editNome.trim()}
                                onClick={guardarEdicao}
                                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink disabled:opacity-50"
                              >
                                {aGuardarEdicao ? "A guardar…" : "Guardar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        {...dropzoneProps(equipa.id, () => arrastando !== null && atribuir(arrastando, equipa.id))}
                        className={
                          "flex min-h-[56px] flex-wrap gap-1.5 rounded-b-lg p-2.5 " +
                          (sobreZona === equipa.id ? "bg-surfacealt" : "")
                        }
                      >
                        {membros.length === 0 ? (
                          <p className="text-xs text-inksoft">Arrasta inscritos para aqui.</p>
                        ) : (
                          membros.map(chip)
                        )}
                      </div>
                    </div>
                  );
                })}

                {novoAberto ? (
                  <div className="space-y-2 rounded-lg border border-dashed border-line p-3">
                    <input
                      type="text"
                      autoFocus
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Nome da equipa"
                      className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && criarEquipa()}
                    />
                    <SeletorCor valor={novaCor} onEscolher={setNovaCor} />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setNovoAberto(false)}
                        className="text-sm text-inkmuted hover:text-ink"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={aCriar || !novoNome.trim()}
                        onClick={criarEquipa}
                        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink disabled:opacity-50"
                      >
                        {aCriar ? "A criar…" : "Criar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNovoAberto(true)}
                    className="rounded-lg border border-dashed border-line px-3 py-2 text-sm font-medium text-inkmuted hover:bg-surfacealt hover:text-ink"
                  >
                    + Nova equipa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && equipaAEliminar && (
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
            <p className="text-sm font-semibold text-ink">Eliminar equipa</p>
            <p className="mt-1.5 text-sm text-inkmuted">
              Tens a certeza que queres eliminar &ldquo;{equipaAEliminar.nome}&rdquo;? Os membros
              ficam por atribuir.
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
                disabled={aGuardarEdicao}
                onClick={eliminarEquipa}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {aGuardarEdicao ? "A eliminar…" : "Sim, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {atribuirPara && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAtribuirPara(null)}
        >
          <div
            className="w-full max-w-xs rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">{primeiroEUltimoNome(atribuirPara.nome)}</p>
            <p className="mt-1 text-xs text-inksoft">Escolhe a equipa</p>

            <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  atribuir(atribuirPara.rowIndex, "");
                  setAtribuirPara(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-left text-sm text-inkmuted hover:bg-surfacealt"
              >
                Sem equipa
              </button>
              {equipas.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    atribuir(atribuirPara.rowIndex, e.id);
                    setAtribuirPara(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-left text-sm text-ink hover:bg-surfacealt"
                >
                  <span
                    className="h-3 w-3 flex-none rounded-full"
                    style={{ backgroundColor: e.cor || CORES[0].bg }}
                  />
                  {e.nome}
                </button>
              ))}
              {equipas.length === 0 && (
                <p className="px-1 py-1 text-xs text-inksoft">Ainda não há equipas — cria uma primeiro.</p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAtribuirPara(null)}
                className="text-sm text-inkmuted hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
