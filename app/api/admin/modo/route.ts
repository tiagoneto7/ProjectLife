import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  checkAdminPassword,
  isValidAdminSession,
  tokenDeLeitura,
} from "@/lib/auth";

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8, // 8 horas, como no login
};

/** Liga o modo de edição (com a password de administração) ou volta a só leitura. */
export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const { ativar, password } = await req.json().catch(() => ({}));

  if (ativar === false) {
    const leitura = tokenDeLeitura();
    if (!leitura) {
      return NextResponse.json(
        { error: "Não há acesso de leitura configurado (READONLY_PASSWORD)." },
        { status: 400 }
      );
    }
    const res = NextResponse.json({ ok: true, papel: "leitura" });
    res.cookies.set(ADMIN_SESSION_COOKIE, leitura, COOKIE);
    return res;
  }

  const editor = checkAdminPassword(typeof password === "string" ? password : "");
  if (!editor) {
    return NextResponse.json({ error: "Password incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, papel: "editor" });
  res.cookies.set(ADMIN_SESSION_COOKIE, editor, COOKIE);
  return res;
}
