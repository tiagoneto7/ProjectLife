/**
 * Estados de pagamento de uma inscrição, tal como ficam na coluna T da Sheet.
 *
 * "Vaga social" é alguém que não pagou mas vem ao FIRE na mesma — recebe os
 * emails e entra nas equipas como quem pagou, mas não entra na receita.
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

/** Vaga social: não pagou, mas vem ao FIRE na mesma. */
export function ehVagaSocial(estado: string): boolean {
  return normaliza(estado) === normaliza(ESTADOS.social);
}

/** Vem ao FIRE: pagou ou tem vaga social. */
export function estaConfirmado(estado: string): boolean {
  return pagou(estado) || ehVagaSocial(estado);
}

export function ehEstadoValido(estado: string): boolean {
  return (Object.values(ESTADOS) as string[]).some((e) => normaliza(e) === normaliza(estado));
}
