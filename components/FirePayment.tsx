"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type Props = {
  rowIndex: number;
  email: string;
  nome: string;
  onPaid: () => void;
};

export default function FirePayment({ rowIndex, email, nome, onPaid }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/stripe/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex, email, nome }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data.error ?? "Não foi possível iniciar o pagamento.");
          return;
        }
        setClientSecret(data.clientSecret);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível ligar ao servidor. Tenta novamente.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stripePromise) return null;

  if (error) {
    return <p className="mt-2.5 text-sm text-red-600">{error}</p>;
  }

  if (!clientSecret) {
    return <p className="mt-2.5 text-sm text-inksoft">A preparar formas de pagamento…</p>;
  }

  return (
    <div className="mt-2.5 rounded-xl border border-line bg-surfacealt p-4">
      <Elements stripe={stripePromise} options={{ clientSecret, locale: "pt" }}>
        <PaymentForm onPaid={onPaid} />
      </Elements>
    </div>
  );
}

function PaymentForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pollStatus(paymentIntentId: string, attempt = 0) {
    if (attempt > 40) {
      setWaiting(false);
      setError("Ainda não recebemos a confirmação. Se já aprovaste no MB WAY, aguarda mais um pouco — vamos validar manualmente em breve.");
      return;
    }

    const res = await fetch(`/api/stripe/status?paymentIntentId=${paymentIntentId}`);
    const data = await res.json();

    if (data.status === "succeeded") {
      setWaiting(false);
      onPaid();
      return;
    }

    if (data.status === "requires_payment_method" || data.status === "canceled") {
      setWaiting(false);
      setError("O pagamento não foi concluído. Tenta novamente.");
      return;
    }

    setTimeout(() => pollStatus(paymentIntentId, attempt + 1), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (confirmError) {
      setError(confirmError.message ?? "Não foi possível concluir o pagamento.");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onPaid();
      return;
    }

    if (paymentIntent?.status === "processing") {
      setWaiting(true);
      pollStatus(paymentIntent.id);
      return;
    }
  }

  if (waiting) {
    return (
      <p className="text-center text-sm text-inkmuted">
        A aguardar que aproves o pagamento na app MB WAY…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement options={{ paymentMethodOrder: ["mb_way", "card"] }} />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-branddark disabled:opacity-60"
      >
        {submitting ? "A processar…" : "Confirmar pagamento"}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </form>
  );
}
