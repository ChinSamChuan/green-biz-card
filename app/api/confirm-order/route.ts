import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { variantId } = (await request.json()) as { variantId?: string };
    if (!variantId) {
      return NextResponse.json({ error: "variantId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: variant, error: variantError } = await supabase
      .from("design_variants")
      .select("*, session:design_sessions(*)")
      .eq("id", variantId)
      .single();

    if (variantError) throw variantError;

    await supabase
      .from("design_variants")
      .update({ is_accepted: true, image_url_review_status: "approved" })
      .eq("id", variantId);

    await supabase
      .from("design_sessions")
      .update({ status: "completed" })
      .eq("id", variant.session_id);

    await supabase.from("audit_logs").insert({
      action: "design_accepted",
      entity_type: "design_variants",
      entity_id: variantId,
      metadata: { session_id: variant.session_id },
    });

    const session = variant.session;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        contact_id: session.contact_id,
        session_id: variant.session_id,
        accepted_variant_id: variantId,
        status: "confirmed",
        shipping_name: session.shipping_name,
        shipping_address: session.shipping_address,
        shipping_city: session.shipping_city,
        shipping_country: session.shipping_country,
        shipping_postal_code: session.shipping_postal_code,
        amount_paid_cents: 899,
        builder_notified: true,
        fulfilment_status: "pending",
      })
      .select("*")
      .single();

    if (orderError) throw orderError;

    await supabase.from("audit_logs").insert({
      action: "order_confirmed",
      entity_type: "orders",
      entity_id: order.id,
      metadata: { variant_id: variantId, builder_notified: true },
    });

    return NextResponse.json({ order });
  } catch (err) {
    console.error("[api/confirm-order]", err);
    return NextResponse.json({ error: "Could not confirm order" }, { status: 500 });
  }
}
