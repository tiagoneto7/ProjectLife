"use client";

import { useState } from "react";
import FirePayment from "@/components/FirePayment";

type Props = {
  nome: string;
  email: string;
  rowIndex: number;
  menorDe18?: string;
  emailResponsavel?: string;
};

export default function InscricaoConfirmada({
  nome,
  email,
  rowIndex,
  menorDe18,
  emailResponsavel,
}: Props) {
  const [paid, setPaid] = useState(false);

  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-ink">Inscrição confirmada</h2>
        <p className="mt-3 text-inkmuted">
          Enviámos um email de confirmação para <strong className="text-ink">{email}</strong>.
        </p>
        {menorDe18 === "sim" &&
          emailResponsavel &&
          emailResponsavel.toLowerCase() !== email.toLowerCase() && (
            <p className="mt-1 text-xs text-inksoft">cc {emailResponsavel}</p>
          )}
      </div>

      <hr className="my-6 border-line" />

      {paid ? (
        <div className="rounded-xl bg-brand/15 px-4 py-3 text-center text-branddark">
          <p className="font-semibold">Pagamento confirmado</p>
          <p className="mt-1 text-sm">A tua inscrição encontra-se validada.</p>
        </div>
      ) : (
        <>
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
                Efetua o pagamento de <strong>35€</strong>
              </p>

              <FirePayment rowIndex={rowIndex} email={email} nome={nome} onPaid={() => setPaid(true)} />

              <p className="mt-3 text-xs text-inksoft">Ou, se preferires:</p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm">
                  <BankIcon className="h-5 w-5 flex-none text-inkmuted" />
                  <div>
                    <p className="font-medium text-ink">Transferência Bancária</p>
                    <p className="text-xs text-inkmuted">PT50001800036195088702043</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm">
                  <CashIcon className="h-5 w-5 flex-none text-inkmuted" />
                  <p className="font-medium text-ink">Pagamento em mãos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-[18px] flex items-center gap-3.5">
            <StepNumber>2</StepNumber>
            <p className="flex-1">
              Se pagares por transferência, envia o comprovativo para o nosso Whatsapp ou email.
            </p>
          </div>

          <div className="mt-[18px] flex items-center gap-3.5">
            <StepNumber>3</StepNumber>
            <p className="flex-1">
              Aguarda que validemos o pagamento e entremos em contacto contigo para mais novidades.
            </p>
          </div>
        </>
      )}

      <p className="mt-10 text-center text-xs text-inksoft">Para te preparares, consulta o regulamento:</p>
      <a
        href="/regulamento-fire.pdf"
        download
        className="mt-1 block text-center text-sm font-medium text-branddark hover:underline"
      >
        Regulamento (PDF)
      </a>
    </div>
  );
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-[1.5px] border-branddark text-xs font-bold text-branddark">
      {children}
    </div>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 10l9-6 9 6M4 10v9M20 10v9M9 19v-6h6v6M4 19h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="6.5" width="19" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
