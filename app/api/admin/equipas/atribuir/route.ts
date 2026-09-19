import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, erroSemPermissaoParaEditar } from "@/lib/auth";
import { atualizarEquipaInscrito } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const semPermissao = erroSemPermissaoParaEditar(token);
  if (semPermissao) {
    return NextResponse.json({ error: semPermissao.error }, { status: semPermissao.status });
  }

  const { rowIndex, equipaId } = await req.json().catch(() => ({}));

  if (typeof rowIndex !== "number" || typeof equipaId !== "string") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    await atualizarEquipaInscrito(rowIndex, equipaId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao atribuir equipa na Google Sheet:", err);
    return NextResponse.json({ error: "Não foi possível guardar. Tenta novamente." }, { status: 500 });
  }
}
