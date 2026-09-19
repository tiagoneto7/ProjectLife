import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { atualizarMovimento, criarMovimento } from "@/lib/sheets";
import {
  CATEGORIA_INSCRICOES,
  PRIMEIRA_EDICAO_NO_SITE,
  ehCategoriaInscricoes,
  normalizarCategoria,
  type TipoMovimento,
} from "@/lib/contas";

const texto = (valor: unknown, max: number) =>
  typeof valor === "string" ? valor.trim().slice(0, max) : "";

/** Cria um movimento novo, ou atualiza um existente quando vem `rowIndex`. */
export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const corpo = await req.json().catch(() => ({}));
  const { rowIndex, tipo, valorCentimos, edicao } = corpo;
  const data = texto(corpo.data, 20);
  const titulo = texto(corpo.titulo, 200);
  const categoria = texto(corpo.categoria, 60);

  const tipoValido = tipo === "entrada" || tipo === "saida";
  const linhaValida = rowIndex === undefined || (Number.isInteger(rowIndex) && rowIndex >= 2);

  if (
    !tipoValido ||
    !linhaValida ||
    !data ||
    !titulo ||
    !categoria ||
    typeof valorCentimos !== "number" ||
    !Number.isFinite(valorCentimos) ||
    valorCentimos <= 0 ||
    typeof edicao !== "number" ||
    !Number.isFinite(edicao)
  ) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // Desde que há inscrições pelo site, são calculadas a partir dos inscritos —
  // registá-las à mão contava-as duas vezes. Só as edições anteriores as levam à mão.
  if (
    ehCategoriaInscricoes(categoria) &&
    (tipo !== "entrada" || edicao >= PRIMEIRA_EDICAO_NO_SITE)
  ) {
    return NextResponse.json(
      { error: "As inscrições entram sozinhas — escolhe outra categoria." },
      { status: 400 }
    );
  }

  const movimento = {
    tipo: tipo as TipoMovimento,
    data,
    titulo,
    categoria: ehCategoriaInscricoes(categoria)
      ? CATEGORIA_INSCRICOES
      : normalizarCategoria(tipo, categoria),
    pagoPor: tipo === "saida" ? texto(corpo.pagoPor, 80) : "",
    valorCentimos: Math.round(valorCentimos),
    comprovativo: texto(corpo.comprovativo, 500),
    edicao,
    nota: texto(corpo.nota, 500),
  };

  try {
    if (rowIndex !== undefined) {
      await atualizarMovimento(rowIndex, movimento);
      return NextResponse.json({ ok: true });
    }
    const criado = await criarMovimento(movimento);
    return NextResponse.json({ ok: true, movimento: criado });
  } catch (err) {
    console.error("Erro ao guardar o movimento na Google Sheet:", err);
    return NextResponse.json(
      { error: 'Não foi possível guardar. Confirma que a aba "Contas" existe na Sheet.' },
      { status: 500 }
    );
  }
}
