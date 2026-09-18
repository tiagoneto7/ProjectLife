/**
 * Estados de pagamento de uma inscrição, tal como ficam na coluna T da Sheet.
 *
 * "Vaga social" é alguém que não pagou mas está confirmado na mesma — conta
 * como validado em tudo (emails, equipas, listas), mas não entra na receita.
 *
 * Fica num módulo próprio (sem o googleapis do lib/sheets.ts) para poder ser
 * usado também nos componentes de cliente.
 */
export const ESTADOS = {
  pago: "Pago",
  social: "Vaga social",
  pendente: "Pendente",
} as const;

export type Estado = (typeof ESTADOS)[keyof typeof ESTADOS];

const normaliza = (estado: string) => estado.trim().toLowerCase();

/** Pagou mesmo — é o único caso que conta para a receita. */
export function pagou(estado: string): boolean {
  return normaliza(estado) === normaliza(ESTADOS.pago);
}

/** Vaga social: não pagou, mas a inscrição está validada à mesma. */
export function ehVagaSocial(estado: string): boolean {
  return normaliza(estado) === normaliza(ESTADOS.social);
}

/** Confirmado para o campo, tenha pago ou não. */
export function estaValidado(estado: string): boolean {
  return pagou(estado) || ehVagaSocial(estado);
}

export function ehEstadoValido(estado: string): boolean {
  return (Object.values(ESTADOS) as string[]).some((e) => normaliza(e) === normaliza(estado));
}
