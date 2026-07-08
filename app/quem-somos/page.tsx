export const metadata = {
  title: "Quem Somos | Project Life",
  description: "Conhece a Associação Project Life e o projeto Fire.",
};

export default function QuemSomosPage() {
  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-center text-3xl font-semibold text-ink">Quem Somos</h1>

        <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-inkmuted">
          <p>
            A Project Life é uma associação de solidariedade social e ajuda humanitária, sem fins
            lucrativos, dedicada ao desenvolvimento de projetos que criam novas oportunidades, a
            nível nacional e internacional e hoje, destacamos o projeto FIRE.
          </p>
          <p>
            Com 15 anos de história, o FIRE é um evento anual promovido pela Project Life, dirigido
            a adolescentes e jovens a partir dos 12 anos.
          </p>
          <p>
            Este evento reúne atividades desportivas, palestras sobre temas atuais — como hábitos de
            vida saudáveis, cidadania, resiliência e inteligência emocional — e momentos de
            convívio, incluindo noites temáticas, cinema ao ar livre e outras dinâmicas.
          </p>
          <p>
            O FIRE tem uma identidade cristã, e os seus valores são partilhados e vividos ao longo
            de todo o evento.
          </p>
        </div>
      </div>
    </main>
  );
}
