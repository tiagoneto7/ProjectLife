import { createHash } from "crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

function expectedToken(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function checkAdminPassword(password: string): string | null {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) return null;
  return expectedToken(adminPassword);
}

export function isValidAdminSession(token: string | undefined): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !token) return false;
  return token === expectedToken(adminPassword);
}
