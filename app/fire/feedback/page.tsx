import Image from "next/image";
import FeedbackForm from "@/components/FeedbackForm";
import { edicaoAtual } from "@/lib/evento";

export const metadata = {
  title: "Feedback | Fire",
  description: "Conta-nos como foi o teu FIRE — Project Life",
};

// Gerada a cada visita: a edição do feedback muda com a data.
export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
          <Image
            src="/fire-logo.webp"
            alt="Fire"
            width={180}
            height={180}
            className="flex-none rounded-full"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-ink">Como foi o teu FIRE?</h1>
            <p className="mt-3 text-inkmuted">
              Queremos saber a tua opinião para que nos possas ajudar a preparar a próxima edição.
            </p>
            <p className="mt-1 text-xs text-inksoft">FIRE {edicaoAtual()}</p>
          </div>
        </header>

        <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surfacealt p-7">
          <FeedbackForm />
        </div>
      </div>
    </main>
  );
}
