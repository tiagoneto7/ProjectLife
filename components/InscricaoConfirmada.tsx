"use client";

import { useState } from "react";
import FirePayment from "@/components/FirePayment";

type Props = {
  nome: string;
  email: string;
  rowIndex: number;
  menorDe18?: string;
  emailResponsavel?: string;
  initialPago?: boolean;
};

export default function InscricaoConfirmada({
  nome,
  email,
  rowIndex,
  menorDe18,
  emailResponsavel,
  initialPago = false,
}: Props) {
  const [paid, setPaid] = useState(initialPago);

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
          <p className="mb-5 text-xs text-inksoft">
            Para que a tua inscrição seja validada, escolhe uma das formas de pagamento abaixo:
          </p>

          <div className="rounded-xl border border-[#cfe3a0] bg-brand/10 p-5">
            <h3 className="text-sm font-semibold text-ink">Pagamento com Cartão ou MB WAY</h3>
            <p className="mt-1.5 text-sm text-inkmuted">
              Pagamento processado imediatamente — assim que confirmado, a tua inscrição fica
              automaticamente validada.
            </p>

            <div className="mt-3.5">
              <FirePayment rowIndex={rowIndex} email={email} nome={nome} onPaid={() => setPaid(true)} />
            </div>
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-inksoft">
            <span className="h-px flex-1 bg-line" />
            ou, se preferires
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h3 className="text-sm font-semibold text-ink">Pagamento manual</h3>

            <div className="mt-3 space-y-2">
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

            <div className="mt-4 space-y-2.5 border-t border-dashed border-line pt-3.5">
              <div className="flex items-center gap-2.5">
                <MiniNumber>1</MiniNumber>
                <p className="flex-1 text-xs text-inkmuted">
                  Envia-nos o comprovativo ou uma captura de ecrã pelo Whatsapp ou email.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <MiniNumber>2</MiniNumber>
                <p className="flex-1 text-xs text-inkmuted">
                  Aguarda que validemos o pagamento e entremos em contacto contigo.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-inksoft">
            Podes continuar mais tarde através do link 'Pagar Agora' enviado no email.
          </p>
        </>
      )}
    </div>
  );
}

function MiniNumber({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.3px] border-branddark text-[10px] font-bold text-branddark">
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
