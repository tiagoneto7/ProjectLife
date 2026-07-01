"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const initialValues = {
  nome: "",
  dataNascimento: "",
  email: "",
  contacto: "",
  contactoEmergencia: "",
  empresa: "", // honeypot
};

export default function InscricaoForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function update(field: keyof typeof initialValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Algo correu mal. Tenta novamente.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Não foi possível ligar ao servidor. Verifica a tua ligação e tenta novamente.");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-full bg-ember/15 flex items-center justify-center">
          <FlameIcon className="h-7 w-7 text-ember" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-parchment">
          Inscrição confirmada
        </h2>
        <p className="mt-3 text-haze">
          Enviámos um email de confirmação para <strong className="text-parchment">{values.email}</strong>.
          Até já, no Fire!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* honeypot — invisível para humanos, bots costumam preencher */}
      <input
        type="text"
        name="empresa"
        value={values.empresa}
        onChange={update("empresa")}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <Field label="Nome" htmlFor="nome">
        <input
          id="nome"
          required
          value={values.nome}
          onChange={update("nome")}
          placeholder="Nome completo"
          className={inputClass}
        />
      </Field>

      <Field label="Data de nascimento" htmlFor="dataNascimento">
        <input
          id="dataNascimento"
          type="date"
          required
          value={values.dataNascimento}
          onChange={update("dataNascimento")}
          className={inputClass}
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          type="email"
          required
          value={values.email}
          onChange={update("email")}
          placeholder="o-teu-email@exemplo.com"
          className={inputClass}
        />
      </Field>

      <Field label="Contacto" htmlFor="contacto">
        <input
          id="contacto"
          required
          inputMode="numeric"
          value={values.contacto}
          onChange={update("contacto")}
          placeholder="93XXXXXXX"
          className={inputClass}
        />
      </Field>

      <Field label="Contacto de emergência" htmlFor="contactoEmergencia">
        <input
          id="contactoEmergencia"
          required
          inputMode="numeric"
          value={values.contactoEmergencia}
          onChange={update("contactoEmergencia")}
          placeholder="93XXXXXXX"
          className={inputClass}
        />
      </Field>

      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-embersoft">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-ember px-6 py-3 font-semibold text-dusk transition hover:bg-embersoft disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "A enviar…" : "Confirmar inscrição"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-haze">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-charcoal px-4 py-3 text-parchment placeholder:text-haze/60 outline-none transition focus:border-ember";

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-2-.5-2 2 1 3.5 3.5 3.5 6a7 7 0 1 1-14 0c0-4 2-6 3-8 1.5-3 3-3 4-3z"
        fill="currentColor"
      />
    </svg>
  );
}
