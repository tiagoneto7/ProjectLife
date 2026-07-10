import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

// TEMPORÁRIO: a cobrar só 0,50€ (mínimo permitido pela Stripe em EUR) para testar em produção.
// Repor para 3500 (35€) antes de lançar a sério.
const VALOR_FIRE_CENTIMOS = 50;

export async function POST(req: NextRequest) {
  const { rowIndex, email, nome } = await req.json().catch(() => ({}));

  if (typeof rowIndex !== "number" || typeof email !== "string" || typeof nome !== "string") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: VALOR_FIRE_CENTIMOS,
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
