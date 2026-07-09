import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Variável de ambiente STRIPE_SECRET_KEY em falta.");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}
