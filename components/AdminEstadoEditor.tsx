"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";
import { ESTADOS, type Estado, ehVagaSocial, pagou } from "@/lib/estados";

const OPCOES: { valor: Estado; icone: string; cor: string }[] = [
  { valor: ESTADOS.pago, icone: "✅", cor: "text-green-600" },
  { valor: ESTADOS.social, icone: "🤝", cor: "text-blue-600" },
  { valor: ESTADOS.pendente, icone: "⚠️", cor: "text-orange-500" },
];

export default function AdminEstadoEditor({
  rowIndex,
  initialEstado,
  initialOrigem,
  initialNota = "",
  readOnly = false,
}: {
  rowIndex: number;
  initialEstado: string;
  initialOrigem: string;
  initialNota?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(initialEstado);
  const [origem, setOrigem] = useState(initialOrigem);
  const [nota, setNota] = useState(initialNota);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Estado>(ESTADOS.pendente);
  const [draftNota, setDraftNota] = useState(initialNota);
  const [password, setPassword] = useState("");
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fechar() {
    setOpen(false);
    setPassword("");
    setError(null);
  }

  useCloseOnEscape(open, fechar);

  const isPago = pagou(estado);
  const isSocial = ehVagaSocial(estado);

  function estadoAtual(): Estado {
    if (isPago) return ESTADOS.pago;
    if (isSocial) return ESTADOS.social;
    return ESTADOS.pendente;
  }

  function abrir() {
    setDraft(estadoAtual());
    setDraftNota(nota);
    setEnviarEmail(true);
    setPassword("");
    setError(null);
    setOpen(true);
  }

  // O email confirma a receção do pagamento, por isso só se oferece a quem
  // passa mesmo a Pago (nunca numa vaga social).
  const passaAPago = !isPago && draft === ESTADOS.pago;

  async function handleConfirm() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rowIndex,
        estado: draft,
        password,
        nota: draftNota,
        enviarEmail: passaAPago && enviarEmail,
      }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Não foi possível guardar.");
      return;
    }

    setEstado(draft);
    setNota(draftNota.trim());
    setOrigem(draft === ESTADOS.pago ? "Manual" : "");
    fechar();
    router.refresh();
  }

  const conteudo = (
    <>
      <span className={isPago ? "text-green-600" : isSocial ? "text-blue-600" : "text-orange-500"}>
        {isPago ? "✅" : isSocial ? "🤝" : "⚠️"}
      </span>
      <span>{isSocial ? "Vaga social" : estado}</span>
      {isPago && origem === "Automático" && (
        <span className="text-[10px] text-inksoft/70">(auto)</span>
      )}
    </>
  );

  return (
    <>
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        {readOnly ? (
          <span className="flex min-w-0 items-center gap-1.5 px-1.5 py-0.5">{conteudo}</span>
        ) : (
          <button
            type="button"
            onClick={abrir}
            className="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-black/5"
            title="Clicar para editar"
          >
            {conteudo}
          </button>
        )}
        {nota && (
          <span
            className="max-w-[160px] truncate px-1.5 text-[11px] text-inksoft"
            title={nota}
          >
            {nota}
          </span>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fechar}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-xs flex-col overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">Alterar estado</p>
            <p className="mt-1 text-sm text-inkmuted">Escolhe o estado do pagamento.</p>

            <div className="mt-3 space-y-2">
              {OPCOES.map((opcao) => (
                <label
                  key={opcao.valor}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surfacealt"
                >
                  <input
                    type="checkbox"
                    checked={draft === opcao.valor}
                    onChange={() => setDraft(opcao.valor)}
                    className="mt-0.5 h-4 w-4 flex-none accent-branddark"
                  />
                  <span className={opcao.cor}>{opcao.icone}</span>
                  <span className="font-medium text-ink">{opcao.valor}</span>
                </label>
              ))}
            </div>

            {passaAPago && (
              <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-surfacealt px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={enviarEmail}
                  onChange={(e) => setEnviarEmail(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-none accent-branddark"
                />
                <span className="text-ink">Enviar email de confirmação de pagamento ao guardar</span>
              </label>
            )}

            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-inksoft">
                Nota (opcional)
              </span>
              <textarea
                value={draftNota}
                onChange={(e) => setDraftNota(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded border border-line px-2.5 py-1.5 text-sm"
              />
            </label>

            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password de administração"
              className="mt-3 w-full rounded border border-line px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={fechar} className="text-sm text-inkmuted hover:text-ink">
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving || !password}
                onClick={handleConfirm}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink disabled:opacity-50"
              >
                {saving ? "A guardar…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
