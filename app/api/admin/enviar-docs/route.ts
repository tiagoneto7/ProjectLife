import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, isValidAdminSession } from "@/lib/auth";
import { getInscricoes } from "@/lib/sheets";
import { sendDocumentosFinais } from "@/lib/email";

// TEMPORÁRIO: enquanto testamos o conteúdo do email, envia sempre só para este endereço,
// independentemente da lista real de inscritos validados. Remover antes de enviar a sério.
const EMAIL_DE_TESTE = "tineto@sapo.pt";

export async function POST(req: NextRequest) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return NextResponse.json({ error: "Sessão inválida. Volta a entrar." }, { status: 401 });
  }

  const { password } = await req.json().catch(() => ({}));

  if (!checkAdminPassword(typeof password === "string" ? password : "")) {
    return NextResponse.json({ error: "Password incorreta." }, { status: 401 });
  }

  try {
    const inscritos = await getInscricoes();
    const validados = inscritos.filter((i) => i.estado.toLowerCase() === "pago");

    const emailsReais = new Set<string>();
    for (const inscrito of validados) {
      emailsReais.add(inscrito.email);
      if (inscrito.menorDe18 === "Sim" && inscrito.emailResponsavel) {
        emailsReais.add(inscrito.emailResponsavel);
      }
    }

    await sendDocumentosFinais([EMAIL_DE_TESTE]);

    return NextResponse.json({
      ok: true,
      totalReal: emailsReais.size,
      enviadoPara: [EMAIL_DE_TESTE],
    });
  } catch (err) {
    console.error("Erro ao enviar documentos finais:", err);
    return NextResponse.json({ error: "Não foi possível enviar os emails." }, { status: 500 });
  }
}
