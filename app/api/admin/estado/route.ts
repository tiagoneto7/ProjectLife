import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, isValidAdminSession } from "@/lib/auth";
import { updateEstado, getInscricaoPorLinha } from "@/lib/sheets";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { ehEstadoValido, pagou } from "@/lib/estados";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const { rowIndex, estado, password, enviarEmail, nota } = await req.json().catch(() => ({}));

  if (!checkAdminPassword(typeof password === "string" ? password : "")) {
    return NextResponse.json({ error: "Password incorreta." }, { status: 401 });
  }

  if (typeof rowIndex !== "number" || typeof estado !== "string" || !ehEstadoValido(estado)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const foiPago = pagou(estado);

  try {
    await updateEstado(
      rowIndex,
      estado,
      foiPago ? "Manual" : "",
      typeof nota === "string" ? nota.trim() : undefined
    );
  } catch (err) {
    console.error("Erro ao atualizar estado na Google Sheet:", err);
    return NextResponse.json({ error: "Não foi possível guardar. Tenta novamente." }, { status: 500 });
  }

  let emailEnviado = false;
  let erroEmail: string | null = null;

  // Só faz sentido em quem pagou mesmo: o email confirma a receção do pagamento,
  // por isso nunca vai para uma vaga social.
  if (enviarEmail === true && foiPago) {
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
