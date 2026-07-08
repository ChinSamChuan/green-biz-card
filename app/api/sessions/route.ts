import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const checkoutSessionId = searchParams.get("checkoutSessionId");
    const supabase = createAdminClient();
    let paymentIntentId = checkoutSessionId;

    if (checkoutSessionId?.startsWith("cs_")) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
      paymentIntentId =
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : checkoutSessionId;
    }

    let query = supabase
      .from("design_sessions")
      .select("*, contact:contacts(*), variants:design_variants(*)")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false });

    if (contactId) query = query.eq("contact_id", contactId);
    if (paymentIntentId) query = query.eq("stripe_payment_intent_id", paymentIntentId);

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;

    return NextResponse.json({ session: data });
  } catch (err) {
    console.error("[api/sessions]", err);
    return NextResponse.json({ error: "Could not load design session" }, { status: 500 });
  }
}
