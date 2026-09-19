import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, erroSemPermissaoParaEditar } from "@/lib/auth";
import { sendPedidoFeedback } from "@/lib/email";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const semPermissao = erroSemPermissaoParaEditar(token);
  if (semPermissao) {
    return NextResponse.json({ error: semPermissao.error }, { status: semPermissao.status });
  }

  const { password, emails } = await req.json().catch(() => ({}));

  if (!checkAdminPassword(typeof password === "string" ? password : "")) {
    return NextResponse.json({ error: "Password incorreta." }, { status: 401 });
  }

  if (!Array.isArray(emails) || emails.some((e) => typeof e !== "string")) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const destinatarios = Array.from(new Set(emails as string[]));
  if (destinatarios.length === 0) {
    return NextResponse.json({ error: "Escolhe pelo menos um destinatário." }, { status: 400 });
  }

  try {
    await sendPedidoFeedback(destinatarios);
    return NextResponse.json({ ok: true, total: destinatarios.length });
  } catch (err) {
    console.error("Erro ao enviar os pedidos de feedback:", err);
    return NextResponse.json({ error: "Não foi possível enviar os emails." }, { status: 500 });
  }
}
