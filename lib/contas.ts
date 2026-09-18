// Regras das contas partilhadas entre o servidor e o /admin (sem dependências de servidor).

export type TipoMovimento = "entrada" | "saida";

export const TIPOS: Record<TipoMovimento, string> = {
  entrada: "Entrada",
  saida: "Saída",
};

/** As inscrições entram sozinhas (pagos × valor) — nunca se registam à mão. */
export const CATEGORIA_INSCRICOES = "Inscrições";

/**
 * Categorias que existem em todas as edições. As restantes são criadas na hora
 * e só aparecem na edição em que foram usadas.
 */
export const CATEGORIAS_FIXAS: Record<TipoMovimento, string[]> = {
  entrada: ["Donativos", "Capital da Associação"],
  saida: ["Alimentação", "Seguros", "Atividades"],
};

/** Lê o valor da coluna Tipo; linhas antigas sem tipo eram todas despesas. */
export function lerTipo(valor: string | undefined): TipoMovimento {
  const limpo = (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return limpo === "entrada" ? "entrada" : "saida";
}

export function ehCategoriaFixa(tipo: TipoMovimento, categoria: string): boolean {
  const alvo = categoria.trim().toLowerCase();
  return CATEGORIAS_FIXAS[tipo].some((c) => c.toLowerCase() === alvo);
}

/** Usa a grafia da categoria fixa quando o nome coincide (ex: "seguros" → "Seguros"). */
export function normalizarCategoria(tipo: TipoMovimento, categoria: string): string {
  const alvo = categoria.trim().toLowerCase();
  return CATEGORIAS_FIXAS[tipo].find((c) => c.toLowerCase() === alvo) ?? categoria.trim();
}
