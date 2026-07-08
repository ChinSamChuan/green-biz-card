import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { buildVcard, normalizeContact, type ContactInput } from "@/lib/green-biz-card";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactInput;
    const contact = normalizeContact(body);

    if (!contact.full_name) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const vcard = buildVcard(contact);
    const png = await QRCode.toBuffer(vcard, {
      type: "png",
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    const filePath = `qr/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("qr-codes")
      .upload(filePath, png, { contentType: "image/png", upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from("qr-codes").getPublicUrl(filePath);
    const qr_image_url = publicUrl.publicUrl;

    const { data, error } = await supabase
      .from("contacts")
      .insert({ ...contact, vcard_string: vcard, qr_image_url })
      .select("*")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      action: "qr_generated",
      entity_type: "contacts",
      entity_id: data.id,
      metadata: { full_name: contact.full_name },
    });

    return NextResponse.json({ contact: data, qr_image_url, vcard });
  } catch (err) {
    console.error("[api/qr]", err);
    return NextResponse.json(
      { error: "Could not generate QR code. Check Supabase storage and credentials." },
      { status: 500 },
    );
  }
}
