/**
 * Dados do FIRE e regra de arquivo por edição.
 *
 * É o único sítio onde a data do evento está definida — muda aqui de ano para
 * ano e o site, os emails e o arquivo do /admin acompanham.
 */
export const EVENTO = {
  /** Ano da edição que está a ser organizada. */
  edicao: 2026,
  /** Dia e mês em que a edição termina (o ano vem de `edicao`). */
  fim: { dia: 13, mes: 9 },

  datasLabel: "11, 12 e 13 de Setembro, 2026",
  local: "Rua Constantina Fernandes Nº 15, Poceirão",
  valor: "35€",
  valorCentimos: 3500,
};

/** Dias depois do fim do FIRE em que as inscrições dessa edição fecham. */
export const DIAS_ATE_ARQUIVAR = 5;

/**
 * Instante (inclusive) em que fecham as inscrições da edição de `ano`.
 * Ex: FIRE a terminar a 13/09 fecha as inscrições no fim do dia 18/09.
 */
export function fechoDasInscricoes(ano: number): Date {
  return new Date(
    Date.UTC(ano, EVENTO.fim.mes - 1, EVENTO.fim.dia + DIAS_ATE_ARQUIVAR, 23, 59, 59, 999)
  );
}

/**
 * A que edição pertence uma inscrição feita nesta data: à edição desse ano se
 * ainda for dentro do prazo, senão já conta para a edição seguinte.
 */
export function edicaoDaData(data: Date): number {
  if (Number.isNaN(data.getTime())) return EVENTO.edicao;

  const ano = data.getUTCFullYear();
  return data.getTime() <= fechoDasInscricoes(ano).getTime() ? ano : ano + 1;
}

/** A edição que está a receber inscrições neste momento. */
export function edicaoAtual(agora: Date = new Date()): number {
  return edicaoDaData(agora);
}
