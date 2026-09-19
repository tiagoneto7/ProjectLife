import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Fire | Project Life",
  description:
    "O FIRE é o evento anual da Project Life para adolescentes e jovens a partir dos 12 anos.",
};

function BotaoInscrever() {
  return (
    <Link
      href="/fire/inscrever"
      className="inline-block rounded-lg bg-brand px-7 py-3.5 font-bold text-white transition hover:bg-branddark"
    >
      Inscrever-me
    </Link>
  );
}

export default function FirePage() {
  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10 flex justify-center">
          <h1 className="sr-only">Fire</h1>
          <Image
            src="/fire-logo.webp"
            alt="Fire"
            width={180}
            height={180}
            className="flex-none rounded-full"
          />
        </header>

        <div className="space-y-5 text-[17px] leading-relaxed text-inkmuted">
          <p>
            Com 15 anos de história, o FIRE é um evento anual promovido pela Project Life, dirigido
            a adolescentes e jovens a partir dos 12 anos.
          </p>
          <p>
            Este evento reúne atividades desportivas, palestras sobre temas atuais (hábitos de vida
            saudáveis, cidadania, resiliência e inteligência emocional) e momentos de convívio,
            incluindo noites temáticas, cinema ao ar livre e outras dinâmicas.
          </p>
          <p>
            O FIRE tem uma identidade cristã, e os seus valores são partilhados e vividos ao longo
            de todo o evento.
          </p>
        </div>

        <div className="mt-10 text-center">
          <BotaoInscrever />
        </div>
      </div>
    </main>
  );
}
