"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";

export default function AdminEstadoEditor({
  rowIndex,
  initialEstado,
  initialOrigem,
}: {
  rowIndex: number;
  initialEstado: string;
  initialOrigem: string;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(initialEstado);
  const [origem, setOrigem] = useState(initialOrigem);
  const [open, setOpen] = useState(false);
  const [draftPago, setDraftPago] = useState(initialEstado.toLowerCase() === "pago");
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

  const isPago = estado.toLowerCase() === "pago";

  function abrir() {
    setDraftPago(isPago);
    setEnviarEmail(true);
    setPassword("");
    setError(null);
    setOpen(true);
  }

  const passaAPago = !isPago && draftPago;

  async function handleConfirm() {
    setSaving(true);
    setError(null);

    const novoEstado = draftPago ? "Pago" : "Pendente";

    const res = await fetch("/api/admin/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rowIndex,
        estado: novoEstado,
        password,
        enviarEmail: passaAPago && enviarEmail,
      }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Não foi possível guardar.");
      return;
    }

    setEstado(novoEstado);
    setOrigem(novoEstado.toLowerCase() === "pago" ? "Manual" : "");
    fechar();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-black/5"
        title="Clicar para editar"
      >
        <span className={isPago ? "text-green-600" : "text-orange-500"}>
          {isPago ? "✅" : "⚠️"}
        </span>
        <span>{estado}</span>
        {isPago && origem === "Automático" && (
          <span className="text-[10px] text-inksoft/70">(auto)</span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fechar}
        >
          <div
            className="w-full max-w-xs rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">Alterar estado</p>
            <p className="mt-1 text-sm text-inkmuted">Escolhe o estado do pagamento.</p>

            <div className="mt-3 space-y-2">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surfacealt">
                <input
                  type="checkbox"
                  checked={draftPago}
                  onChange={() => setDraftPago(true)}
                  className="h-4 w-4 accent-branddark"
                />
                <span className="text-green-600">✅</span>
                <span className="font-medium text-ink">Pago</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surfacealt">
                <input
                  type="checkbox"
                  checked={!draftPago}
                  onChange={() => setDraftPago(false)}
                  className="h-4 w-4 accent-branddark"
                />
                <span className="text-orange-500">⚠️</span>
                <span className="font-medium text-ink">Pendente</span>
              </label>
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
