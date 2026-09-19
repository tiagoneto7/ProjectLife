import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, erroSemPermissaoParaEditar } from "@/lib/auth";
import { criarEquipa } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const semPermissao = erroSemPermissaoParaEditar(token);
  if (semPermissao) {
    return NextResponse.json({ error: semPermissao.error }, { status: semPermissao.status });
  }

  const { nome, cor, edicao } = await req.json().catch(() => ({}));

  if (
    typeof nome !== "string" ||
    !nome.trim() ||
    typeof cor !== "string" ||
    !cor.trim() ||
    typeof edicao !== "number" ||
    !Number.isFinite(edicao)
  ) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const equipa = await criarEquipa(nome.trim(), cor.trim(), edicao);
    return NextResponse.json({ ok: true, equipa });
  } catch (err) {
    console.error("Erro ao criar equipa na Google Sheet:", err);
    return NextResponse.json({ error: "Não foi possível guardar. Tenta novamente." }, { status: 500 });
  }
}
