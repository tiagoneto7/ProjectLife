"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // O painel só aparece quando o servidor acaba de ler a Sheet (uns segundos),
  // por isso o botão continua "A entrar…" até lá, para ninguém carregar duas vezes.
  const [aAbrir, comecarAAbrir] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setLoading(false);
      setError("Password incorreta.");
      return;
    }

    comecarAAbrir(() => router.refresh());
  }

  const ocupado = loading || aAbrir;

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-24 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">Área de administração</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={ocupado}
        placeholder="Password"
        className="w-full rounded border px-3 py-2 disabled:opacity-60"
        autoFocus
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={ocupado}
        className="w-full rounded bg-brand px-3 py-2 text-brandink disabled:opacity-50"
      >
        {ocupado ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
