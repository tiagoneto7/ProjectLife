import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { updateEstado, getInscricaoPorLinha } from "@/lib/sheets";
import { sendPaymentConfirmationEmail, sendCoordinatorPaymentNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripeClient();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Assinatura inválida no webhook do Stripe:", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const rowIndex = Number(paymentIntent.metadata?.rowIndex);

    if (rowIndex) {
      try {
        await updateEstado(rowIndex, "Pago");
      } catch (err) {
        console.error("Erro ao marcar Estado como Pago na Sheet:", err);
      }

      try {
        const inscrito = await getInscricaoPorLinha(rowIndex);
        if (inscrito) {
          await sendPaymentConfirmationEmail(inscrito);
          await sendCoordinatorPaymentNotification(inscrito);
        }
      } catch (err) {
        console.error("Erro ao enviar emails de confirmação de pagamento:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
