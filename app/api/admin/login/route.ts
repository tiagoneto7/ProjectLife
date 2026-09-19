import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, entrarNoAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));

  const sessao = entrarNoAdmin(typeof password === "string" ? password : "");
  if (!sessao) {
    return NextResponse.json({ error: "Password incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, papel: sessao.papel });
  res.cookies.set(ADMIN_SESSION_COOKIE, sessao.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}
