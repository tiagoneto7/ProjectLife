"use client";

import { useState } from "react";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";
import AdminListaDestinatarios, {
  chave,
  resumoSelecao,
  selecaoPorDefeito,
  todosDestinatarios,
  type Destinatario,
  type GruposDestinatarios,
} from "@/components/AdminListaDestinatarios";

export default function AdminPedirFeedback({ grupos }: { grupos: GruposDestinatarios }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ total: number } | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => selecaoPorDefeito(grupos)
  );

  const todos = todosDestinatarios(grupos);
  const emailsSelecionados = todos
    .filter((d) => selecionados.has(chave(d)))
    .flatMap((d) => d.emails);
  const emailsUnicos = Array.from(new Set(emailsSelecionados));

  function abrir() {
    setSelecionados(selecaoPorDefeito(grupos));
    setOpen(true);
  }

  function fechar() {
    setOpen(false);
    setPassword("");
    setErro(null);
    setResultado(null);
  }

  useCloseOnEscape(open, fechar);

  function toggle(d: Destinatario) {
    const k = chave(d);
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  async function enviar() {
    setAEnviar(true);
    setErro(null);

    const res = await fetch("/api/admin/pedir-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, emails: emailsSelecionados }),
    });
    const data = await res.json().catch(() => ({}));

    setAEnviar(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível enviar.");
      return;
    }

    setResultado({ total: data.total });
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="w-full rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brandink hover:bg-branddark"
      >
        Enviar link por email
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fechar}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="flex-none text-sm font-semibold text-ink">Pedir feedback</p>
            <p className="mt-1 flex-none text-sm text-inkmuted">
              Vai ser enviado um email com o link do formulário às pessoas selecionadas.
            </p>

            <div className="mt-3 flex-1 overflow-y-auto rounded-lg border border-line">
              <AdminListaDestinatarios grupos={grupos} selecionados={selecionados} onToggle={toggle} />
            </div>

            <p className="mt-4 flex-none text-xs text-inksoft">
              {resumoSelecao(grupos, selecionados)}
            </p>

            {resultado ? (
              <>
                <p className="mt-3 flex-none text-sm text-branddark">
                  Enviado para {resultado.total} destinatários.
                </p>
                <div className="mt-4 flex flex-none justify-end">
                  <button
                    type="button"
                    onClick={fechar}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brandink hover:bg-branddark"
                  >
                    Fechar
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password de administração"
                  className="mt-3 w-full flex-none rounded border border-line px-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && enviar()}
                />
                {erro && <p className="mt-2 flex-none text-sm text-red-600">{erro}</p>}
                <div className="mt-4 flex flex-none justify-end gap-2">
                  <button type="button" onClick={fechar} className="text-sm text-inkmuted hover:text-ink">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={aEnviar || !password || emailsUnicos.length === 0}
                    onClick={enviar}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brandink disabled:opacity-50"
                  >
                    {aEnviar ? "A enviar…" : "Confirmar e enviar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
