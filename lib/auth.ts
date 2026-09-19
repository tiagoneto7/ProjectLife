import { createHash } from "crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

/**
 * Dois níveis de acesso ao /admin, cada um com a sua password:
 * - editor (ADMIN_PASSWORD): vê e altera tudo;
 * - leitura (READONLY_PASSWORD): vê tudo, não altera nada.
 * O papel fica no próprio token da sessão, que é um hash da password — não dá
 * para passar de leitura a editor mexendo no cookie.
 */
export type PapelAdmin = "editor" | "leitura";

function tokenEditor(password: string) {
  // Mesmo formato de antes, para as sessões de editor já abertas continuarem válidas.
  return createHash("sha256").update(password).digest("hex");
}

function tokenLeitura(password: string) {
  return createHash("sha256").update(`leitura:${password}`).digest("hex");
}

/** Valida a password de editor (também usada para confirmar ações sensíveis). */
export function checkAdminPassword(password: string): string | null {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) return null;
  return tokenEditor(adminPassword);
}

/** Login: aceita a password de editor ou a de leitura e devolve o token com o papel. */
export function entrarNoAdmin(password: string): { token: string; papel: PapelAdmin } | null {
  const editor = checkAdminPassword(password);
  if (editor) return { token: editor, papel: "editor" };

  const leituraPassword = process.env.READONLY_PASSWORD;
  if (leituraPassword && password === leituraPassword) {
    return { token: tokenLeitura(leituraPassword), papel: "leitura" };
  }
  return null;
}

/** Token de uma sessão de leitura, para desligar o modo de edição. */
export function tokenDeLeitura(): string | null {
  const readonlyPassword = process.env.READONLY_PASSWORD;
  return readonlyPassword ? tokenLeitura(readonlyPassword) : null;
}

export function papelDaSessao(token: string | undefined): PapelAdmin | null {
  if (!token) return null;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && token === tokenEditor(adminPassword)) return "editor";
  const leituraPassword = process.env.READONLY_PASSWORD;
  if (leituraPassword && token === tokenLeitura(leituraPassword)) return "leitura";
  return null;
}

/** Pode ver o /admin (editor ou leitura). */
export function isValidAdminSession(token: string | undefined): boolean {
  return papelDaSessao(token) !== null;
}

/**
 * Para as rotas que alteram dados: devolve o erro a responder, ou null se a
 * sessão for de editor. Esconder os botões não chega — é aqui que se garante.
 */
export function erroSemPermissaoParaEditar(
  token: string | undefined
): { error: string; status: number } | null {
  const papel = papelDaSessao(token);
  if (papel === "editor") return null;
  if (papel === "leitura") return { error: "Tens acesso só de leitura.", status: 403 };
  return { error: "Sessão inválida. Volta a entrar.", status: 401 };
}
