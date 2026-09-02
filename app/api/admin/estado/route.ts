import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, isValidAdminSession } from "@/lib/auth";
import { updateEstado, getInscricaoPorLinha } from "@/lib/sheets";
import { sendPaymentConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const { rowIndex, estado, password, enviarEmail } = await req.json().catch(() => ({}));

  if (!checkAdminPassword(typeof password === "string" ? password : "")) {
    return NextResponse.json({ error: "Password incorreta." }, { status: 401 });
  }

  if (typeof rowIndex !== "number" || typeof estado !== "string") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    await updateEstado(rowIndex, estado);
  } catch (err) {
    console.error("Erro ao atualizar estado na Google Sheet:", err);
    return NextResponse.json({ error: "Não foi possível guardar. Tenta novamente." }, { status: 500 });
  }

  let emailEnviado = false;
  let erroEmail: string | null = null;

  if (enviarEmail === true && estado.toLowerCase() === "pago") {
    try {
      const inscrito = await getInscricaoPorLinha(rowIndex);
      if (inscrito) {
        await sendPaymentConfirmationEmail(inscrito);
        emailEnviado = true;
      }
    } catch (err) {
      console.error("Erro ao enviar email de confirmação de pagamento:", err);
      erroEmail = "Estado guardado, mas não foi possível enviar o email.";
    }
  }

  return NextResponse.json({ ok: true, emailEnviado, erroEmail });
}
