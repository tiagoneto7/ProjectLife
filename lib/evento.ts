/**
 * Dados do FIRE e regra de mudança de edição.
 *
 * As datas do FIRE (início e fim) mandam em tudo: o texto "11, 12 e 13 de
 * Setembro", o check-in/check-out do email e quando o FIRE conta como
 * terminado (fim + DIAS_APOS_FIM) saem daqui. Para mudar as datas, muda só
 * `inicio` e `fim`.
 *
 * Só o ano muda de edição para edição: a edição "atual" é o ano de hoje, e
 * passa sozinha para a seguinte a 1 de janeiro (site, emails, Sheet e /admin).
 */
const FIRE = {
  inicio: { dia: 11, mes: 9, hora: "16h30" },
  fim: { dia: 13, mes: 9, hora: "16h00" },
  local: "Rua Constantina Fernandes Nº 15, Poceirão",
  valor: "35€",
  valorCentimos: 3500,
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** "11, 12 e 13 de Setembro, 2026" (ou "30 de Setembro a 2 de Outubro, 2026"). */
function datasDoFire(ano: number): string {
  const { inicio, fim } = FIRE;
  if (inicio.mes !== fim.mes) {
    return `${inicio.dia} de ${MESES[inicio.mes - 1]} a ${fim.dia} de ${MESES[fim.mes - 1]}, ${ano}`;
  }
  const dias = Array.from({ length: fim.dia - inicio.dia + 1 }, (_, i) => inicio.dia + i);
  const lista = dias.length > 1 ? `${dias.slice(0, -1).join(", ")} e ${dias[dias.length - 1]}` : `${dias[0]}`;
  return `${lista} de ${MESES[fim.mes - 1]}, ${ano}`;
}

/** "11.09.2026, pelas 16h30" */
function diaEHora(d: { dia: number; mes: number; hora: string }, ano: number): string {
  const dd = String(d.dia).padStart(2, "0");
  const mm = String(d.mes).padStart(2, "0");
  return `${dd}.${mm}.${ano}, pelas ${d.hora}`;
}

export type Evento = {
  edicao: number;
  datasLabel: string;
  checkIn: string;
  checkOut: string;
  local: string;
  valor: string;
  valorCentimos: number;
};

/** Dados de uma edição: os fixos do FIRE com o ano dessa edição. */
export function fichaDaEdicao(ano: number): Evento {
  return {
    edicao: ano,
    datasLabel: datasDoFire(ano),
    checkIn: diaEHora(FIRE.inicio, ano),
    checkOut: diaEHora(FIRE.fim, ano),
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

/** Dias de folga depois do último dia do FIRE antes de o dar como terminado. */
export const DIAS_APOS_FIM = 3;

/**
 * Se o FIRE de `ano` já terminou — só `DIAS_APOS_FIM` dias depois do último dia
 * (ex: 13/09 + 3 → terminado a partir de 17/09). Anos passados já terminaram.
 */
export function fireTerminou(ano: number, agora: Date = new Date()): boolean {
  const fim = Date.UTC(ano, FIRE.fim.mes - 1, FIRE.fim.dia + DIAS_APOS_FIM, 23, 59, 59, 999);
  return agora.getTime() > fim;
}
