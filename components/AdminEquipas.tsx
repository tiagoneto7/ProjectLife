"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InscritoRow, Equipa } from "@/lib/sheets";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";
import { ehVagaSocial, pagou } from "@/lib/estados";

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
  /** Edição a que estas equipas pertencem — cada FIRE tem as suas. */
  edicao: number;
  /** Edição arquivada: dá para ver as equipas, mas não para alterar. */
  readOnly?: boolean;
  /** Edição já encerrada: as equipas existentes editam-se, mas não se criam novas. */
  arquivada?: boolean;
};

export default function AdminEquipas({
  equipas: equipasIniciais,
  inscritos,
  edicao,
  readOnly = false,
  arquivada = false,
}: Props) {
  const router = useRouter();
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
  const [editMonitores, setEditMonitores] = useState<string[]>([]);
  const [editLugar, setEditLugar] = useState(0);
  const [aGuardarEdicao, setAGuardarEdicao] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  // Tocar num chip abre esta modal para escolher a equipa — é a forma de
  // atribuir em ecrãs táteis, onde o drag-and-drop nativo não funciona.
  const [atribuirPara, setAtribuirPara] = useState<InscritoRow | null>(null);

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
  const porAtribuir = [
    { titulo: "Pagos", lista: naoAtribuidos.filter((i) => pagou(i.estado)) },
    { titulo: "Sociais", lista: naoAtribuidos.filter((i) => ehVagaSocial(i.estado)) },
    {
      titulo: "Pendentes",
      lista: naoAtribuidos.filter((i) => !pagou(i.estado) && !ehVagaSocial(i.estado)),
    },
  ];

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
      body: JSON.stringify({ nome: novoNome.trim(), cor: novaCor, edicao }),
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
    const nomesMembros = new Set(
      inscritos.filter((i) => (atribuicoes[i.rowIndex] || "") === equipa.id).map((i) => i.nome)
    );
    setEditMonitores(equipa.monitores.filter((m) => nomesMembros.has(m)));
    setEditLugar(equipa.lugar);
    setConfirmarEliminar(false);
    setErro(null);
  }

  async function guardarEdicao() {
    if (!editId || !editNome.trim()) return;
    setAGuardarEdicao(true);
    setErro(null);

    // Descarta quem entretanto saiu da equipa.
    const nomesMembros = new Set(
      inscritos.filter((i) => (atribuicoes[i.rowIndex] || "") === editId).map((i) => i.nome)
    );
    const monitores = editMonitores.filter((m) => nomesMembros.has(m));

    const res = await fetch("/api/admin/equipas/editar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        nome: editNome.trim(),
        cor: editCor,
        monitores,
        lugar: editLugar,
      }),
    });
    const data = await res.json();

    setAGuardarEdicao(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível guardar.");
      return;
    }

    setEquipas((prev) =>
      prev.map((e) =>
        e.id === editId
          ? { ...e, nome: editNome.trim(), cor: editCor, monitores, lugar: editLugar }
          : e
      )
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

  function chip(inscrito: InscritoRow, monitor = false) {
    // Verde só para quem pagou; vagas sociais e pendentes ficam iguais (não pagaram).
    const corEstado = pagou(inscrito.estado) ? "bg-green-500" : "bg-amber-400";

    if (readOnly) {
      return (
        <span
          key={inscrito.rowIndex}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink shadow-sm"
        >
          <span
            className={`h-1.5 w-1.5 flex-none rounded-full ${corEstado}`}
            aria-hidden="true"
          />
          {primeiroEUltimoNome(inscrito.nome)}
          {monitor && <span aria-label="Monitor" title="Monitor">★</span>}
        </span>
      );
    }

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
          className={`h-1.5 w-1.5 flex-none rounded-full ${corEstado}`}
          aria-hidden="true"
        />
        {primeiroEUltimoNome(inscrito.nome)}
        {monitor && <span aria-label="Monitor" title="Monitor">★</span>}
      </button>
    );
  }

  function dropzoneProps(zona: string, onDrop: () => void) {
    if (readOnly) return {};

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

  const atribuidos = inscritos.length - naoAtribuidos.length;
  const percentagem = inscritos.length > 0 ? Math.round((atribuidos / inscritos.length) * 100) : 0;
  const classificacao = equipas
    .filter((e) => e.lugar > 0)
    .sort((a, b) => a.lugar - b.lugar);
  const opcoesLugar = Array.from({ length: Math.max(equipas.length, 3) }, (_, i) => i + 1);
  const MEDALHAS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {classificacao.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-line bg-surfacealt px-4 py-2 text-sm">
            <span className="text-[11px] uppercase tracking-wide text-inksoft">Classificação</span>
            {classificacao.map((e, i) => (
              <span key={e.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-inksoft">·</span>}
                <span className={e.lugar === 1 ? "font-semibold text-ink" : "text-inkmuted"}>
                  {MEDALHAS[e.lugar] ?? `${e.lugar}º`} {e.nome}
                </span>
              </span>
            ))}
          </div>
        )}

        <span className="flex-1" />
        {!readOnly && !arquivada && (
          <button
            type="button"
            onClick={() => setNovoAberto(true)}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink hover:bg-branddark"
          >
            + Nova equipa
          </button>
        )}
      </div>

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Por atribuir — fica visível ao fazer scroll, para dar para arrastar para qualquer equipa */}
        <aside
          {...dropzoneProps("nao-atribuidos", () => arrastando !== null && atribuir(arrastando, ""))}
          className={
            "rounded-xl border p-3 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:w-60 md:flex-none md:overflow-y-auto " +
            (sobreZona === "nao-atribuidos" ? "border-branddark bg-surfacealt" : "border-line")
          }
        >
          {/* Sem título: os grupos (Pagos/Sociais/Pendentes) já dizem o que é. */}
          <p className="text-[11px] text-inkmuted">
            <b className="font-semibold text-ink">{atribuidos}</b> de {inscritos.length} atribuídos
          </p>
          <span
            className="mb-3 mt-1.5 block h-1.5 overflow-hidden rounded bg-line"
            aria-hidden="true"
          >
            <span className="block h-full rounded bg-brand" style={{ width: `${percentagem}%` }} />
          </span>
          {porAtribuir.map((grupo) => (
            <div key={grupo.titulo} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[11px] text-inksoft">{grupo.titulo}</p>
              <div className="flex flex-wrap gap-1.5">
                {grupo.lista.length === 0 ? (
                  <p className="text-xs text-inksoft">—</p>
                ) : (
                  grupo.lista.map((i) => chip(i))
                )}
              </div>
            </div>
          ))}
        </aside>

        <div className="grid flex-1 items-start gap-3 sm:grid-cols-2">
          {equipas.map((equipa) => {
            const membros = inscritos.filter((i) => (atribuicoes[i.rowIndex] || "") === equipa.id);
            const emEdicao = editId === equipa.id;
            // Só conta como monitor quem ainda é membro — se mudar de equipa, deixa de aparecer.
            const nomesMembros = new Set(membros.map((i) => i.nome));
            const monitores = equipa.monitores.filter((m) => nomesMembros.has(m));
            const candidatosMonitor = membros.filter((i) => !editMonitores.includes(i.nome));

            const cabecalho = (
              <>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold" style={{ color: COR_TEXTO_CABECALHO }}>
                    {equipa.nome}
                  </span>
                </span>
                <span className="flex-none text-xs" style={{ color: COR_TEXTO_CABECALHO }}>
                  {membros.length} {membros.length === 1 ? "membro" : "membros"}
                  {!readOnly && " · editar ✎"}
                </span>
              </>
            );

            return (
              <div
                key={equipa.id}
                className={
                  "overflow-hidden rounded-xl border border-line " +
                  (emEdicao ? "ring-2 ring-branddark/30" : "")
                }
              >
                {readOnly ? (
                  <div
                    className="flex w-full items-center justify-between gap-2 px-3 py-2"
                    style={{ backgroundColor: equipa.cor || CORES[0].bg }}
                  >
                    {cabecalho}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => (emEdicao ? setEditId(null) : abrirEdicao(equipa))}
                    title="Clicar para editar"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                    style={{ backgroundColor: equipa.cor || CORES[0].bg }}
                  >
                    {cabecalho}
                  </button>
                )}

                {emEdicao && (
                  <div className="space-y-2.5 border-b border-line bg-surfacealt p-3">
                    <input
                      type="text"
                      autoFocus
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      aria-label="Nome da equipa"
                      className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && guardarEdicao()}
                    />
                    <SeletorCor valor={editCor} onEscolher={setEditCor} />

                    <div>
                      <p className="mb-1 text-[11px] font-medium text-inkmuted">Monitores</p>
                      <div className="flex flex-wrap items-center gap-1.5 rounded border border-line bg-white px-2 py-1.5">
                        {editMonitores.map((m) => (
                          <span
                            key={m}
                            className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white"
                          >
                            ★ {primeiroEUltimoNome(m)}
                            <button
                              type="button"
                              onClick={() => setEditMonitores((prev) => prev.filter((x) => x !== m))}
                              aria-label={`Remover ${m}`}
                              className="ml-0.5 opacity-60 hover:opacity-100"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {/* Os monitores escolhem-se entre os membros desta equipa. */}
                        <select
                          value=""
                          onChange={(e) => {
                            const nome = e.target.value;
                            if (nome) setEditMonitores((prev) => [...prev, nome]);
                          }}
                          aria-label="Adicionar monitor"
                          disabled={candidatosMonitor.length === 0}
                          className="min-w-[140px] flex-1 bg-transparent text-sm text-inkmuted outline-none disabled:opacity-60"
                        >
                          <option value="">
                            {membros.length === 0
                              ? "Primeiro junta membros à equipa"
                              : candidatosMonitor.length === 0
                                ? "Todos os membros já são monitores"
                                : "Escolher membro…"}
                          </option>
                          {candidatosMonitor.map((i) => (
                            <option key={i.rowIndex} value={i.nome}>
                              {i.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-[11px] font-medium text-inkmuted">Lugar final</p>
                      <div className="inline-flex flex-wrap gap-0.5 rounded-xl border border-line bg-white p-0.5">
                        {[0, ...opcoesLugar].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setEditLugar(n)}
                            aria-pressed={editLugar === n}
                            className={
                              "rounded-lg px-2.5 py-1 text-sm transition " +
                              (editLugar === n
                                ? "bg-surfacealt font-semibold text-ink shadow-sm"
                                : "text-inkmuted hover:text-ink")
                            }
                          >
                            {n === 0 ? "—" : `${n}º`}
                          </button>
                        ))}
                      </div>
                    </div>

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
                    "flex min-h-[72px] flex-wrap content-start gap-1.5 p-2.5 " +
                    (sobreZona === equipa.id ? "bg-surfacealt" : "")
                  }
                >
                  {membros.length === 0 ? (
                    <p className="text-xs text-inksoft">
                      {readOnly ? "Sem membros." : "Arrasta inscritos para aqui."}
                    </p>
                  ) : (
                    // Monitores primeiro, marcados com ★.
                    [...membros]
                      .sort((x, y) => Number(monitores.includes(y.nome)) - Number(monitores.includes(x.nome)))
                      .map((i) => chip(i, monitores.includes(i.nome)))
                  )}
                </div>
              </div>
            );
          })}

          {readOnly ? (
            equipas.length === 0 && (
              <p className="text-sm text-inksoft">Esta edição não tem equipas guardadas.</p>
            )
          ) : novoAberto ? (
            <div className="space-y-2 rounded-xl border border-dashed border-line p-3">
              <input
                type="text"
                autoFocus
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                aria-label="Nome da nova equipa"
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
          ) : null}
        </div>
      </div>

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
    </div>
  );
}
