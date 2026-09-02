import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { criarEquipa } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const { nome, cor } = await req.json().catch(() => ({}));

  if (typeof nome !== "string" || !nome.trim() || typeof cor !== "string" || !cor.trim()) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const equipa = await criarEquipa(nome.trim(), cor.trim());
    return NextResponse.json({ ok: true, equipa });
  } catch (err) {
    console.error("Erro ao criar equipa na Google Sheet:", err);
    return NextResponse.json({ error: "Não foi possível guardar. Tenta novamente." }, { status: 500 });
  }
}
