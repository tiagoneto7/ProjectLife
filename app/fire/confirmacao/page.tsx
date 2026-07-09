import Image from "next/image";
import { redirect } from "next/navigation";
import InscricaoConfirmada from "@/components/InscricaoConfirmada";

export const metadata = {
  title: "Inscrição confirmada | Fire",
  description: "Inscrição confirmada para o campo Fire — Project Life",
};

export default function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const nome = typeof searchParams.nome === "string" ? searchParams.nome : "";
  const email = typeof searchParams.email === "string" ? searchParams.email : "";
  const rowIndex = Number(searchParams.rowIndex);
  const menorDe18 = typeof searchParams.menorDe18 === "string" ? searchParams.menorDe18 : undefined;
  const emailResponsavel =
    typeof searchParams.emailResponsavel === "string" ? searchParams.emailResponsavel : undefined;

  if (!nome || !email || !Number.isFinite(rowIndex)) {
    redirect("/fire");
  }

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
          <InscricaoConfirmada
            nome={nome}
            email={email}
            rowIndex={rowIndex}
            menorDe18={menorDe18}
            emailResponsavel={emailResponsavel}
          />
        </div>
      </div>
    </main>
  );
}
