import InscricaoForm from "@/components/InscricaoForm";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-ember-glow" />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
        <header className="mb-10 text-center">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-gold">
            Project Life
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold italic text-parchment">
            Fire
          </h1>
          <dl className="mt-6 space-y-1.5 text-haze">
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
              <dd className="text-gold font-medium">35€</dd>
            </div>
          </dl>
        </header>

        <div className="rounded-2xl border border-white/10 bg-charcoal/60 p-7 backdrop-blur-sm">
          <InscricaoForm />
        </div>

        <footer className="mt-8 text-center text-sm text-haze">
          Dúvidas? +351 962 032 936 · projectlife4all@gmail.com
          <br />
          <a
            href="https://linktr.ee/project_life_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ember hover:text-embersoft"
          >
            linktr.ee/project_life_
          </a>
        </footer>
      </div>
    </main>
  );
}
