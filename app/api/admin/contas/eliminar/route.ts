import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { eliminarMovimento } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
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
