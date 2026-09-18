import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { atualizarEquipa, eliminarEquipa } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const { id, nome, cor, monitores, lugar, eliminar } = await req.json().catch(() => ({}));

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    if (eliminar === true) {
      await eliminarEquipa(id);
      return NextResponse.json({ ok: true });
    }

    if (typeof nome !== "string" || !nome.trim() || typeof cor !== "string" || !cor.trim()) {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const listaMonitores = Array.isArray(monitores)
      ? monitores
          .filter((m): m is string => typeof m === "string")
          // A vírgula é o separador na Sheet, por isso não pode aparecer num nome.
          .map((m) => m.replace(/,/g, " ").trim().slice(0, 80))
          .filter(Boolean)
          .slice(0, 10)
      : [];
    const lugarFinal = Number.isInteger(lugar) && lugar > 0 && lugar <= 50 ? lugar : 0;

    await atualizarEquipa(id, nome.trim(), cor.trim(), listaMonitores, lugarFinal);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao atualizar equipa na Google Sheet:", err);
    return NextResponse.json({ error: "Não foi possível guardar. Tenta novamente." }, { status: 500 });
  }
}
