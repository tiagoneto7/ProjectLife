// Regras das contas partilhadas entre o servidor e o /admin (sem dependências de servidor).

export type TipoMovimento = "entrada" | "saida";

export const TIPOS: Record<TipoMovimento, string> = {
  entrada: "Entrada",
  saida: "Saída",
};

/**
 * As inscrições entram sozinhas (pagos × valor) a partir da primeira edição
 * feita pelo site. Nas anteriores não há inscritos no sistema, por isso aí o
 * total de inscrições regista-se à mão, como entrada nesta categoria.
 */
export const CATEGORIA_INSCRICOES = "Inscrições";
export const PRIMEIRA_EDICAO_NO_SITE = 2026;

export function ehCategoriaInscricoes(categoria: string): boolean {
  return categoria.trim().toLowerCase() === CATEGORIA_INSCRICOES.toLowerCase();
}

/**
 * Categorias que existem em todas as edições. As restantes são criadas na hora
 * e só aparecem na edição em que foram usadas.
 */
export const CATEGORIAS_FIXAS: Record<TipoMovimento, string[]> = {
  entrada: ["Donativos"],
  saida: ["Alimentação", "Seguros", "Atividades", "Outros"],
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
