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
      <div>
        <div className="text-center">
          <div className="mx-auto mb-6 h-14 w-14 rounded-full bg-ember/15 flex items-center justify-center">
            <FlameIcon className="h-7 w-7 text-ember" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-parchment">
            Inscrição confirmada
          </h2>
          <p className="mt-3 text-haze">
            Enviámos um email de confirmação para <strong className="text-parchment">{values.email}</strong>.
          </p>
        </div>

        <hr className="my-6 border-white/10" />

        <p className="mb-4 text-xs text-haze">
          Para que a tua inscrição seja validada, é importante que sigas estes passos:
        </p>

        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ember">
          Passos a seguir
        </h3>

        <div className="flex gap-3.5">
          <StepNumber>1</StepNumber>
          <div className="flex-1 pt-0.5">
            <p>
              Paga o valor de <strong>35€</strong> através de um destes métodos:
            </p>
            <ul className="mt-2.5 space-y-2">
              <PaymentOption label="MBWAY" value="+351 937780027" />
              <PaymentOption label="Transferência Bancária" value="PT50001800036195088702043" />
              <PaymentOption label="Pagamento em mãos" />
            </ul>

            <div className="mt-2.5 rounded-xl border border-ember/30 bg-ember/10 p-4">
              <label htmlFor="mbwayContacto" className="text-sm text-haze">
                Indica o teu contacto MB WAY para efetuares o pagamento
              </label>
              <input
                id="mbwayContacto"
                type="tel"
                inputMode="numeric"
                defaultValue={values.contacto}
                placeholder="9XXXXXXXX"
                className={`${inputClass} mt-2`}
              />
              <button
                type="button"
                disabled
                title="Brevemente disponível"
                className="mt-2.5 w-full rounded-lg bg-ember px-4 py-2.5 font-semibold text-dusk opacity-50 cursor-not-allowed"
              >
                Pagar 35€ com MB WAY
              </button>
              <p className="mt-2 text-center text-xs text-haze">Brevemente disponível.</p>
            </div>
          </div>
        </div>

        <div className="mt-[18px] flex gap-3.5">
          <StepNumber>2</StepNumber>
          <p className="flex-1 pt-0.5">
            Se pagares por transferência ou em mãos, envia o comprovativo para o nosso Whatsapp ou email.
          </p>
        </div>

        <a
          href="/regulamento-fire.pdf"
          download
          className="mt-6 block text-center font-medium text-ember hover:text-embersoft"
        >
          📄 Descarregar regulamento (PDF)
        </a>

        <p className="mt-[18px] border-t border-white/10 pt-3.5 text-center text-sm text-haze">
          Podes continuar mais tarde — estes passos estão no email de confirmação que enviámos.
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

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-[1.5px] border-ember text-xs font-bold text-ember">
      {children}
    </div>
  );
}

function PaymentOption({ label, value }: { label: string; value?: string }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm">
      <span className="text-haze">{label}</span>
      {value && <span className="font-semibold text-parchment">{value}</span>}
    </li>
  );
}

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
