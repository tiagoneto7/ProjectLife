import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { criarDespesa } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const { data, descricao, categoria, pagoPor, valorCentimos, comprovativo, edicao } = await req
    .json()
    .catch(() => ({}));

  if (
    typeof data !== "string" ||
    !data.trim() ||
    typeof descricao !== "string" ||
    !descricao.trim() ||
    typeof valorCentimos !== "number" ||
    !Number.isFinite(valorCentimos) ||
    valorCentimos <= 0 ||
    typeof edicao !== "number" ||
    !Number.isFinite(edicao)
  ) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const despesa = await criarDespesa({
      data: data.trim(),
      descricao: descricao.trim(),
      categoria: typeof categoria === "string" ? categoria.trim() : "",
      pagoPor: typeof pagoPor === "string" ? pagoPor.trim() : "",
      valorCentimos: Math.round(valorCentimos),
      comprovativo: typeof comprovativo === "string" ? comprovativo.trim() : "",
      edicao,
    });
    return NextResponse.json({ ok: true, despesa });
  } catch (err) {
    console.error("Erro ao guardar a despesa na Google Sheet:", err);
    return NextResponse.json(
      { error: "Não foi possível guardar. Confirma que a aba \"Despesas\" existe na Sheet." },
      { status: 500 }
    );
  }
}
