import Image from "next/image";
import InscricaoForm from "@/components/InscricaoForm";
import { eventoAtual } from "@/lib/evento";

export const metadata = {
  title: "Inscrição | Fire",
  description: "Inscrição para o campo Fire — Project Life",
};

// Gerada a cada visita: a edição muda sozinha na data limite, sem novo deploy.
export const dynamic = "force-dynamic";

export default function FirePage() {
  const EVENTO = eventoAtual();
  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
          <h1 className="sr-only">Fire</h1>
          <Image
            src="/fire-logo.webp"
            alt="Fire"
            width={180}
            height={180}
            className="flex-none rounded-full"
          />
          <dl className="space-y-1.5 text-center text-inkmuted sm:text-left">
            <div>
              <dt className="sr-only">Data</dt>
              <dd>{EVENTO.datasLabel}</dd>
            </div>
            <div>
              <dt className="sr-only">Morada</dt>
              <dd>{EVENTO.local}</dd>
            </div>
            <div>
              <dt className="sr-only">Valor</dt>
              <dd className="font-semibold text-branddark">{EVENTO.valor}</dd>
            </div>
          </dl>
        </header>

        <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surfacealt p-7">
          <InscricaoForm />
        </div>
      </div>
    </main>
  );
}
