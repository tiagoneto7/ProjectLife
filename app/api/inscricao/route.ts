import { NextRequest, NextResponse } from "next/server";
import { inscricaoSchema } from "@/lib/validation";
import { appendInscricaoToSheet } from "@/lib/sheets";
import { sendConfirmationEmail, sendCoordinatorNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = inscricaoSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  // honeypot: se vier preenchido, finge sucesso mas não faz nada (bot)
  if (parsed.data.empresa) {
    return NextResponse.json({ ok: true });
  }

  let rowIndex: number;
  try {
    rowIndex = await appendInscricaoToSheet(parsed.data);
  } catch (err) {
    console.error("Erro ao escrever na Google Sheet:", err);
    return NextResponse.json(
      { error: "Não foi possível guardar a inscrição. Tenta novamente em breve." },
      { status: 500 }
    );
  }

  try {
    await sendConfirmationEmail(parsed.data);
  } catch (err) {
    // A inscrição já está guardada, por isso não falhamos o pedido todo —
    // só registamos o erro para investigar depois.
    console.error("Erro ao enviar email de confirmação:", err);
  }

  try {
    await sendCoordinatorNotification(parsed.data);
  } catch (err) {
    console.error("Erro ao enviar notificação ao coordenador:", err);
  }

  return NextResponse.json({ ok: true, rowIndex });
}
