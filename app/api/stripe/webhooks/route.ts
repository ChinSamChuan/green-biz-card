import { constructWebhookEvent } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

function shippingFromSession(session: Stripe.Checkout.Session) {
  const sessionWithCollectedInfo = session as Stripe.Checkout.Session & {
    collected_information?: { shipping_details?: Stripe.Checkout.Session.ShippingDetails };
  };
  const details =
    sessionWithCollectedInfo.collected_information?.shipping_details ?? session.shipping_details;
  const address = details?.address;

  return {
    shipping_name: details?.name ?? "",
    shipping_address: [address?.line1, address?.line2].filter(Boolean).join(", "),
    shipping_city: address?.city ?? "",
    shipping_country: address?.country ?? "",
    shipping_postal_code: address?.postal_code ?? "",
  };
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err) {
    console.error("[stripe/webhooks] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const contactId = session.metadata?.contactId;
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.id;

      if (!contactId || session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      const { data: existing } = await supabase
        .from("design_sessions")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();

      if (!existing) {
        const { data: designSession, error } = await supabase
          .from("design_sessions")
          .insert({
            contact_id: contactId,
            stripe_payment_intent_id: paymentIntentId,
            payment_status: "paid",
            attempts_remaining: 5,
            status: "active",
            ...shippingFromSession(session),
          })
          .select("*")
          .single();

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "payment_succeeded",
          entity_type: "design_sessions",
          entity_id: designSession.id,
          metadata: {
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
          },
        });
      }
    }
  } catch (err) {
    console.error(`[stripe/webhooks] error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
