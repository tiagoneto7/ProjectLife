"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminEstadoEditor({
  rowIndex,
  initialEstado,
}: {
  rowIndex: number;
  initialEstado: string;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(initialEstado);
  const [draft, setDraft] = useState(initialEstado);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex, estado: draft, password }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Não foi possível guardar.");
      return;
    }

    setEstado(draft);
    setEditing(false);
    setConfirming(false);
    setPassword("");
    router.refresh();
  }

  const isPago = estado.toLowerCase() === "pago";

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(estado);
          setEditing(true);
        }}
        className="flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-black/5"
        title="Clicar para editar"
      >
        <span className={isPago ? "text-green-600" : "text-orange-500"}>
          {isPago ? "✅" : "⚠️"}
        </span>
        <span>{estado}</span>
      </button>
    );
  }

  return (
    <div className="min-w-[160px]">
      <div className="flex gap-1.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-28 rounded border border-line px-1.5 py-0.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded bg-brand px-2 py-0.5 text-xs font-semibold text-brandink"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-inkmuted hover:text-ink"
        >
          Cancelar
        </button>
      </div>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-xs rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">Confirmar alteração</p>
            <p className="mt-1 text-sm text-inkmuted">
              Vais mudar o estado para <strong className="text-ink">&quot;{draft}&quot;</strong>.
              Escreve a password de administração para confirmar.
            </p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-3 w-full rounded border border-line px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setError(null);
                  setPassword("");
                }}
                className="text-sm text-inkmuted hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving || !password}
                onClick={handleConfirm}
                className="rounded bg-brand px-3 py-1.5 text-sm font-semibold text-brandink disabled:opacity-50"
              >
                {saving ? "A guardar…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
