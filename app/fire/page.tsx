import Image from "next/image";
import InscricaoForm from "@/components/InscricaoForm";

export const metadata = {
  title: "Inscrição | Fire",
  description: "Inscrição para o campo Fire — Project Life",
};

export default function FirePage() {
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
              <dd>11, 12 e 13 de Setembro, 2026</dd>
            </div>
            <div>
              <dt className="sr-only">Morada</dt>
              <dd>Rua Constantina Fernandes Nº 15, Poceirão</dd>
            </div>
            <div>
              <dt className="sr-only">Valor</dt>
              <dd className="font-semibold text-branddark">35€</dd>
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
