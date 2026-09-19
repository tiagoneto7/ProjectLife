import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { eventoAtual, fichaDaEdicao } from "@/lib/evento";
import { getInscricaoPorLinha } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const { rowIndex, email, nome } = await req.json().catch(() => ({}));

  if (typeof rowIndex !== "number" || typeof email !== "string" || typeof nome !== "string") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    // Cobra o valor da edição em que a pessoa se inscreveu (coluna X).
    const inscrito = await getInscricaoPorLinha(rowIndex).catch(() => null);
    const valorCentimos = (inscrito?.edicao ? fichaDaEdicao(inscrito.edicao) : eventoAtual())
      .valorCentimos;

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: valorCentimos,
      currency: "eur",
      payment_method_types: ["mb_way", "card"],
      description: `Inscrição Fire — ${nome}`,
      metadata: { rowIndex: String(rowIndex), email, nome },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Erro ao criar PaymentIntent no Stripe:", err);
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 });
  }
}
