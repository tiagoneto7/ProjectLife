import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, isValidAdminSession } from "@/lib/auth";
import { sendDocumentosFinais } from "@/lib/email";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
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
    await sendDocumentosFinais(destinatarios);
    return NextResponse.json({ ok: true, total: destinatarios.length });
  } catch (err) {
    console.error("Erro ao enviar documentos finais:", err);
    return NextResponse.json({ error: "Não foi possível enviar os emails." }, { status: 500 });
  }
}
