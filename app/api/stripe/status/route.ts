import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const paymentIntentId = req.nextUrl.searchParams.get("paymentIntentId");

  if (!paymentIntentId) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return NextResponse.json({ status: paymentIntent.status });
  } catch (err) {
    console.error("Erro ao consultar estado do pagamento:", err);
    return NextResponse.json({ error: "Não foi possível consultar o pagamento." }, { status: 500 });
  }
}
