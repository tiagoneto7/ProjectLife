/**
 * Dados do FIRE e regra de mudança de edição.
 *
 * Dias, local e valor são sempre os mesmos — só o ano muda. A edição "atual"
 * não se escreve à mão: é o ano de hoje, e passa sozinha para a seguinte a
 * 1 de janeiro (site, emails, Sheet e /admin ao mesmo tempo).
 */
const FIRE = {
  dias: "11, 12 e 13 de Setembro",
  local: "Rua Constantina Fernandes Nº 15, Poceirão",
  valor: "35€",
  valorCentimos: 3500,
};

export type Evento = {
  edicao: number;
  datasLabel: string;
  local: string;
  valor: string;
  valorCentimos: number;
};

/** Dados de uma edição: os fixos do FIRE com o ano dessa edição. */
export function fichaDaEdicao(ano: number): Evento {
  return {
    edicao: ano,
    datasLabel: `${FIRE.dias}, ${ano}`,
    local: FIRE.local,
    valor: FIRE.valor,
    valorCentimos: FIRE.valorCentimos,
  };
}

/**
 * A que edição pertence uma inscrição feita nesta data: à do próprio ano.
 * A edição muda a 1 de janeiro (depois do FIRE, o botão de inscrição esconde-se).
 */
export function edicaoDaData(data: Date): number {
  return Number.isNaN(data.getTime()) ? new Date().getUTCFullYear() : data.getUTCFullYear();
}

/** A edição que está a receber inscrições neste momento. */
export function edicaoAtual(agora: Date = new Date()): number {
  return edicaoDaData(agora);
}

/** Dados da edição que está a receber inscrições neste momento. */
export function eventoAtual(agora: Date = new Date()): Evento {
  return fichaDaEdicao(edicaoAtual(agora));
}
