import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, erroSemPermissaoParaEditar } from "@/lib/auth";
import { eliminarMovimento } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const semPermissao = erroSemPermissaoParaEditar(token);
  if (semPermissao) {
    return NextResponse.json({ error: semPermissao.error }, { status: semPermissao.status });
  }

  const { rowIndex } = await req.json().catch(() => ({}));

  // A linha 1 é o cabeçalho — nunca pode ser alvo.
  if (typeof rowIndex !== "number" || !Number.isInteger(rowIndex) || rowIndex < 2) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    await eliminarMovimento(rowIndex);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao eliminar o movimento na Google Sheet:", err);
    return NextResponse.json({ error: "Não foi possível eliminar. Tenta novamente." }, { status: 500 });
  }
}
