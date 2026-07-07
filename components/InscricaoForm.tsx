"use client";

import { useState, FormEvent } from "react";
import { inscricaoSchema } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

const initialValues = {
  nome: "",
  dataNascimento: "",
  email: "",
  contacto: "",
  contactoEmergencia: "",
  restricoesAlimentares: "",
  restricoesAtividadeFisica: "",
  alergias: "",
  outros: "",
  menorDe18: "" as "" | "sim" | "nao",
  nomeResponsavel: "",
  grauParentesco: "",
  emailResponsavel: "",
  contactoResponsavel: "",
  observacoes: "",
  consentimentoDados: false,
  consentimentoImagens: false,
  consentimentoContacto: false,
  empresa: "", // honeypot
};

type FieldName = keyof typeof initialValues;
type FieldErrors = Partial<Record<FieldName, string>>;

export default function InscricaoForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update(field: FieldName) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function updateCheckbox(field: FieldName) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.checked }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const parsed = inscricaoSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setStatus("error");
      setErrorMessage("Corrige os campos assinalados antes de submeter.");
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

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
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand/15">
            <FlameIcon className="h-7 w-7 text-branddark" />
          </div>
          <h2 className="text-2xl font-semibold text-ink">Inscrição confirmada</h2>
          <p className="mt-3 text-inkmuted">
            Enviámos um email de confirmação para <strong className="text-ink">{values.email}</strong>.
          </p>
          {values.menorDe18 === "sim" &&
            values.emailResponsavel &&
            values.emailResponsavel.toLowerCase() !== values.email.toLowerCase() && (
              <p className="mt-1 text-xs text-inksoft">
                Com cópia para {values.emailResponsavel}
              </p>
            )}
        </div>

        <hr className="my-6 border-line" />

        <p className="mb-4 text-xs text-inksoft">
          Para que a tua inscrição seja validada, é importante que sigas estes passos:
        </p>

        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-branddark">
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

            {/* Pagamento MB WAY direto — descomentar quando a integração (IfthenPay) estiver pronta.
            <div className="mt-2.5 rounded-xl border border-brand/40 bg-brand/10 p-4">
              <label htmlFor="mbwayContacto" className="text-sm text-inkmuted">
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
                className="mt-2.5 w-full cursor-not-allowed rounded-lg bg-brand px-4 py-2.5 font-semibold text-brandink opacity-50"
              >
                Pagar 35€ com MB WAY
              </button>
              <p className="mt-2 text-center text-xs text-inksoft">Brevemente disponível.</p>
            </div>
            */}
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
          className="mt-6 block text-center font-medium text-branddark hover:underline"
        >
          📄 Descarregar regulamento (PDF)
        </a>

        <p className="mt-[18px] border-t border-line pt-3.5 text-center text-sm text-inkmuted">
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

      <Field label="Nome" htmlFor="nome" required error={fieldErrors.nome}>
        <input
          id="nome"
          value={values.nome}
          onChange={update("nome")}
          placeholder="Nome completo"
          className={inputClass}
        />
      </Field>

      <Field label="Data de nascimento" htmlFor="dataNascimento" required error={fieldErrors.dataNascimento}>
        <input
          id="dataNascimento"
          type="date"
          value={values.dataNascimento}
          onChange={update("dataNascimento")}
          className={inputClass}
        />
      </Field>

      <Field label="Email" htmlFor="email" required error={fieldErrors.email}>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={update("email")}
          placeholder="o-teu-email@exemplo.com"
          className={inputClass}
        />
      </Field>

      <Field label="Contacto" htmlFor="contacto" required error={fieldErrors.contacto}>
        <input
          id="contacto"
          inputMode="numeric"
          value={values.contacto}
          onChange={update("contacto")}
          placeholder="93XXXXXXX"
          className={inputClass}
        />
      </Field>

      <Field
        label="Contacto de emergência"
        htmlFor="contactoEmergencia"
        required
        error={fieldErrors.contactoEmergencia}
      >
        <input
          id="contactoEmergencia"
          inputMode="numeric"
          value={values.contactoEmergencia}
          onChange={update("contactoEmergencia")}
          placeholder="93XXXXXXX"
          className={inputClass}
        />
      </Field>

      <SectionTitle>Saúde</SectionTitle>

      <Field label="Restrições Alimentares" htmlFor="restricoesAlimentares">
        <textarea
          id="restricoesAlimentares"
          value={values.restricoesAlimentares}
          onChange={update("restricoesAlimentares")}
          rows={2}
          className={inputClass}
        />
      </Field>

      <Field label="Restrições na Atividade Física" htmlFor="restricoesAtividadeFisica">
        <textarea
          id="restricoesAtividadeFisica"
          value={values.restricoesAtividadeFisica}
          onChange={update("restricoesAtividadeFisica")}
          rows={2}
          className={inputClass}
        />
      </Field>

      <Field label="Alergias" htmlFor="alergias">
        <textarea
          id="alergias"
          value={values.alergias}
          onChange={update("alergias")}
          rows={2}
          className={inputClass}
        />
      </Field>

      <Field label="Outros" htmlFor="outros">
        <textarea
          id="outros"
          value={values.outros}
          onChange={update("outros")}
          rows={2}
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-inkmuted">
          És menor de 18 anos? <span className="text-red-600">*</span>
        </legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-ink">
            <input
              type="radio"
              name="menorDe18"
              checked={values.menorDe18 === "sim"}
              onChange={() => setValues((prev) => ({ ...prev, menorDe18: "sim" }))}
            />
            Sim
          </label>
          <label className="flex items-center gap-2 text-ink">
            <input
              type="radio"
              name="menorDe18"
              checked={values.menorDe18 === "nao"}
              onChange={() => setValues((prev) => ({ ...prev, menorDe18: "nao" }))}
            />
            Não
          </label>
        </div>
        {fieldErrors.menorDe18 && (
          <p className="mt-1.5 text-sm text-red-600">{fieldErrors.menorDe18}</p>
        )}
      </fieldset>

      {values.menorDe18 === "sim" && (
        <div className="space-y-5 rounded-xl border border-line bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-inksoft">Menores de 18 anos</p>

          <Field
            label="Nome do responsável"
            htmlFor="nomeResponsavel"
            required
            error={fieldErrors.nomeResponsavel}
          >
            <input
              id="nomeResponsavel"
              value={values.nomeResponsavel}
              onChange={update("nomeResponsavel")}
              className={inputClass}
            />
          </Field>

          <Field
            label="Grau de parentesco"
            htmlFor="grauParentesco"
            required
            error={fieldErrors.grauParentesco}
          >
            <input
              id="grauParentesco"
              value={values.grauParentesco}
              onChange={update("grauParentesco")}
              className={inputClass}
            />
          </Field>

          <Field
            label="Email do responsável"
            htmlFor="emailResponsavel"
            required
            error={fieldErrors.emailResponsavel}
          >
            <input
              id="emailResponsavel"
              type="email"
              value={values.emailResponsavel}
              onChange={update("emailResponsavel")}
              className={inputClass}
            />
          </Field>

          <Field
            label="Contacto do responsável"
            htmlFor="contactoResponsavel"
            required
            error={fieldErrors.contactoResponsavel}
          >
            <input
              id="contactoResponsavel"
              inputMode="numeric"
              value={values.contactoResponsavel}
              onChange={update("contactoResponsavel")}
              placeholder="93XXXXXXX"
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <SectionTitle>Submissão</SectionTitle>

      <Field label="Observações" htmlFor="observacoes">
        <textarea
          id="observacoes"
          value={values.observacoes}
          onChange={update("observacoes")}
          rows={3}
          className={inputClass}
        />
      </Field>

      <ConsentCheckbox
        id="consentimentoDados"
        checked={values.consentimentoDados}
        error={fieldErrors.consentimentoDados}
        onChange={updateCheckbox("consentimentoDados")}
      >
        Autorizo que os dados recolhidos sejam processados para organização e coordenação das
        atividades no âmbito do evento FIRE, assim como para transmissões de informações relativas
        ao mesmo.
      </ConsentCheckbox>

      <ConsentCheckbox
        id="consentimentoImagens"
        checked={values.consentimentoImagens}
        error={fieldErrors.consentimentoImagens}
        onChange={updateCheckbox("consentimentoImagens")}
      >
        Autorizo que sejam capturadas imagens (fotografias e vídeos), com respeito pela legislação
        vigente e para uso exclusivo de ações de divulgação e promoção dos projetos desenvolvidos
        pela Associação PROJECT LIFE.
      </ConsentCheckbox>

      <ConsentCheckbox
        id="consentimentoContacto"
        checked={values.consentimentoContacto}
        error={fieldErrors.consentimentoContacto}
        onChange={updateCheckbox("consentimentoContacto")}
      >
        Autorizo que me contactem via Email
      </ConsentCheckbox>

      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={
          status === "submitting" ||
          !values.consentimentoDados ||
          !values.consentimentoImagens ||
          !values.consentimentoContacto
        }
        className="w-full rounded-lg bg-brand px-6 py-3 font-bold text-white transition hover:bg-branddark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "A enviar…" : "Submeter inscrição"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-inkmuted">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="!mt-8 border-t border-line pt-5 text-xs font-semibold uppercase tracking-[0.1em] text-inksoft">
      {children}
    </p>
  );
}

function ConsentCheckbox({
  id,
  checked,
  error,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-inkmuted">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-0.5 h-4 w-4 flex-none accent-branddark"
        />
        <span>
          {children} <span className="text-red-600">*</span>
        </span>
      </label>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-ink placeholder:text-inksoft outline-none transition focus:border-brand";

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-[1.5px] border-branddark text-xs font-bold text-branddark">
      {children}
    </div>
  );
}

function PaymentOption({ label, value }: { label: string; value?: string }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-line bg-surfacealt px-3.5 py-2.5 text-sm">
      <span className="text-inkmuted">{label}</span>
      {value && <span className="font-semibold text-ink">{value}</span>}
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
