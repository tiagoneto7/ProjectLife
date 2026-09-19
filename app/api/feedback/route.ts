import { NextRequest, NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/validation";
import { guardarFeedback } from "@/lib/sheets";
import { edicaoAtual } from "@/lib/evento";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: primeiro }, { status: 400 });
  }

  // honeypot: finge sucesso mas não guarda nada (bot)
  if (parsed.data.empresa) {
    return NextResponse.json({ ok: true });
  }

  try {
    const simNao = (v: string) => (v === "sim" ? "Sim" : v === "nao" ? "Não" : "");

    await guardarFeedback({
      nome: parsed.data.nome,
      gostou: parsed.data.gostou,
      melhorar: parsed.data.melhorar,
      mensagem: parsed.data.mensagem,
      oQueFoi: parsed.data.oQueFoi,
      volta: simNao(parsed.data.volta),
      ambiente: simNao(parsed.data.ambiente),
      atividades: simNao(parsed.data.atividades),
      comida: simNao(parsed.data.comida),
      espaco: simNao(parsed.data.espaco),
      avaliacao: parsed.data.avaliacao,
      edicao: edicaoAtual(),
    });
  } catch (err) {
    console.error("Erro ao guardar o feedback na Google Sheet:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar. Tenta novamente em breve." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
