"use client";

import { useState } from "react";

type Destinatario = {
  nome: string;
  emails: string[];
};

export default function AdminEnviarDocs({ destinatarios }: { destinatarios: Destinatario[] }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ totalReal: number; enviadoPara: string[] } | null>(
    null
  );

  const totalEmails = destinatarios.reduce((soma, d) => soma + d.emails.length, 0);

  function fechar() {
    setOpen(false);
    setPassword("");
    setError(null);
    setResultado(null);
  }

  async function handleEnviar() {
    setSending(true);
    setError(null);

    const res = await fetch("/api/admin/enviar-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Não foi possível enviar.");
      return;
    }

    setResultado({ totalReal: data.totalReal, enviadoPara: data.enviadoPara });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surfacealt"
      >
        Enviar Email Final
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fechar}
        >
          <div
            className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-ink">Enviar informações finais</p>
            <p className="mt-1 text-sm text-inkmuted">
              Vai ser enviado o email com as informações finais do FIRE a{" "}
              <strong className="text-ink">{destinatarios.length} inscritos validados</strong> (
              {totalEmails} emails, incluindo responsáveis de menores).
            </p>

            <div className="mt-3 max-h-96 overflow-y-auto rounded-lg border border-line">
              {destinatarios.length === 0 ? (
                <p className="p-3 text-sm text-inksoft">Ainda não há nenhum inscrito validado.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {destinatarios.map((d) => (
                    <li key={d.nome + d.emails.join(",")} className="p-2.5">
                      <p className="font-medium text-ink">{d.nome}</p>
                      <p className="text-xs text-inkmuted">{d.emails.join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {resultado ? (
              <>
                <p className="mt-3 text-sm text-branddark">
                  Email enviado para {resultado.totalReal} destinatários.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={fechar}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-branddark"
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
                  className="mt-3 w-full rounded border border-line px-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={fechar} className="text-sm text-inkmuted hover:text-ink">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={sending || !password || destinatarios.length === 0}
                    onClick={handleEnviar}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-branddark disabled:opacity-50"
                  >
                    {sending ? "A enviar…" : "Confirmar e enviar"}
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
