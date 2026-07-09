"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

      const params = new URLSearchParams({
        nome: values.nome,
        email: values.email,
        rowIndex: String(data.rowIndex),
      });
      if (values.menorDe18 === "sim") {
        params.set("menorDe18", values.menorDe18);
        if (values.emailResponsavel) params.set("emailResponsavel", values.emailResponsavel);
      }
      router.push(`/fire/confirmacao?${params.toString()}`);
    } catch {
      setStatus("error");
      setErrorMessage("Não foi possível ligar ao servidor. Verifica a tua ligação e tenta novamente.");
    }
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
        className="w-full rounded-lg bg-brand px-6 py-3 font-bold text-white transition hover:bg-branddark disabled:cursor-not-allowed disabled:bg-line disabled:text-inksoft disabled:hover:bg-line"
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
