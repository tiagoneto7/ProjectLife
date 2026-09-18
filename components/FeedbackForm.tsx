"use client";

import { useState } from "react";

const ESTRELAS = [1, 2, 3, 4, 5];

// Mesmas perguntas do questionário em papel, pela mesma ordem.
const ABERTAS = [
  { campo: "gostou", label: "O que mais gostaste?" },
  { campo: "melhorar", label: "O que melhoravas?" },
  { campo: "mensagem", label: "Qual a mensagem que te tocou mais?" },
  { campo: "oQueFoi", label: "Para ti, o que foi o FIRE?" },
] as const;

const SIM_NAO = [
  { campo: "volta", label: "Voltas ao FIRE no próximo ano?" },
  { campo: "ambiente", label: "Gostaste do ambiente?" },
  { campo: "atividades", label: "Gostaste das atividades?" },
  { campo: "comida", label: "Gostaste da comida?" },
  { campo: "espaco", label: "Gostaste do espaço?" },
] as const;

type CampoAberto = (typeof ABERTAS)[number]["campo"];
type CampoSimNao = (typeof SIM_NAO)[number]["campo"];

export default function FeedbackForm() {
  const [nome, setNome] = useState("");
  const [abertas, setAbertas] = useState<Record<CampoAberto, string>>({
    gostou: "",
    melhorar: "",
    mensagem: "",
    oQueFoi: "",
  });
  const [simNao, setSimNao] = useState<Record<CampoSimNao, string>>({
    volta: "",
    ambiente: "",
    atividades: "",
    comida: "",
    espaco: "",
  });
  const [avaliacao, setAvaliacao] = useState(0);
  const [empresa, setEmpresa] = useState("");
  const [estado, setEstado] = useState<"parado" | "a-enviar" | "enviado" | "erro">("parado");
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (avaliacao === 0) {
      setEstado("erro");
      setErro("Escolhe uma avaliação de 1 a 5 estrelas.");
      return;
    }

    setEstado("a-enviar");
    setErro("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, ...abertas, ...simNao, avaliacao, empresa }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEstado("erro");
        setErro(data.error ?? "Algo correu mal. Tenta novamente.");
        return;
      }

      setEstado("enviado");
    } catch {
      setEstado("erro");
      setErro("Não foi possível ligar ao servidor. Verifica a tua ligação.");
    }
  }

  if (estado === "enviado") {
    return (
      <div className="rounded-xl bg-brand/15 px-4 py-6 text-center text-branddark">
        <p className="font-semibold">Obrigado pelo teu feedback!</p>
        <p className="mt-1 text-sm">Vai ajudar-nos a preparar a próxima edição. Até breve!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {ABERTAS.map((pergunta) => (
        <label key={pergunta.campo} className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{pergunta.label}</span>
          <textarea
            value={abertas[pergunta.campo]}
            onChange={(e) =>
              setAbertas((prev) => ({ ...prev, [pergunta.campo]: e.target.value }))
            }
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
          />
        </label>
      ))}

      <div className="space-y-2">
        {SIM_NAO.map((pergunta) => (
          <div
            key={pergunta.campo}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2"
          >
            <span className="text-sm text-ink">{pergunta.label}</span>
            <div className="flex flex-none gap-1.5">
              {[
                { valor: "sim", label: "Sim" },
                { valor: "nao", label: "Não" },
              ].map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  aria-pressed={simNao[pergunta.campo] === opcao.valor}
                  onClick={() =>
                    setSimNao((prev) => ({
                      ...prev,
                      // voltar a tocar na mesma opção limpa a resposta
                      [pergunta.campo]: prev[pergunta.campo] === opcao.valor ? "" : opcao.valor,
                    }))
                  }
                  className={
                    "rounded-lg border px-3 py-1 text-sm font-medium transition " +
                    (simNao[pergunta.campo] === opcao.valor
                      ? "border-branddark bg-brand/15 text-branddark"
                      : "border-line text-inkmuted hover:bg-surfacealt")
                  }
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink">
          Quantas estrelas dás ao FIRE?
        </span>
        <div className="flex gap-1.5">
          {ESTRELAS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAvaliacao(n)}
              aria-label={`${n} de 5 estrelas`}
              aria-pressed={avaliacao === n}
              className={
                "h-11 w-11 rounded-lg border text-xl transition " +
                (n <= avaliacao
                  ? "border-branddark bg-brand/15 text-branddark"
                  : "border-line text-inksoft hover:bg-surfacealt")
              }
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Nome <span className="font-normal text-inksoft">(opcional)</span>
        </span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={120}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
        />
      </label>

      {/* honeypot — invisível para pessoas, preenchido por bots */}
      <input
        type="text"
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {estado === "erro" && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={estado === "a-enviar"}
        className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-brandink transition hover:bg-branddark disabled:opacity-60"
      >
        {estado === "a-enviar" ? "A enviar…" : "Enviar feedback"}
      </button>
    </form>
  );
}
