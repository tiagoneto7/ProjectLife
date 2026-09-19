"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";

/**
 * Interruptor entre ver e editar. Ligar pede a password de administração;
 * desligar é imediato. Quem entrou com a password de administração já vem ligado.
 */
export default function AdminModoEdicao({ ligado }: { ligado: boolean }) {
  const router = useRouter();
  const [aPedirPassword, setAPedirPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [aRecarregar, recarregar] = useTransition();

  function fechar() {
    setAPedirPassword(false);
    setPassword("");
    setErro(null);
  }
  useCloseOnEscape(aPedirPassword, fechar);

  async function mudar(ativar: boolean, password?: string) {
    setAGuardar(true);
    setErro(null);

    const res = await fetch("/api/admin/modo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativar, password }),
    });
    const data = await res.json().catch(() => ({}));

    setAGuardar(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível mudar de modo.");
      return;
    }

    fechar();
    recarregar(() => router.refresh());
  }

  const ocupado = aGuardar || aRecarregar;

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label="Modo de edição"
        disabled={ocupado}
        onClick={() => (ligado ? mudar(false) : setAPedirPassword(true))}
        title={ligado ? "Desligar a edição" : "Ligar a edição (pede password)"}
        className="flex items-center gap-2 text-[11px] text-inksoft transition hover:text-ink disabled:opacity-60"
      >
        <span
          className={
            "flex h-4 w-7 flex-none items-center rounded-full p-0.5 transition " +
            (ligado ? "bg-brand" : "bg-line")
          }
        >
          <span
            className={
              "h-3 w-3 rounded-full bg-white shadow-sm transition " + (ligado ? "translate-x-3" : "")
            }
          />
        </span>
        Edição
      </button>

      {aPedirPassword && (
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
            <p className="text-sm font-semibold text-ink">Ligar a edição</p>
            <p className="mt-1 text-xs text-inksoft">
              Escreve a password de administração para poder alterar dados.
            </p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && mudar(true, password)}
              placeholder="Password de administração"
              className="mt-3 w-full rounded border border-line px-3 py-2 text-sm"
            />
            {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={fechar} className="text-sm text-inkmuted hover:text-ink">
                Cancelar
              </button>
              <button
                type="button"
                disabled={ocupado || !password}
                onClick={() => mudar(true, password)}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink disabled:opacity-50"
              >
                {ocupado ? "A ligar…" : "Ligar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
