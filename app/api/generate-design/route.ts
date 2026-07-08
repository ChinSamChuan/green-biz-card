import { NextResponse } from "next/server";
import { buildDesignPrompt, fallbackDesignSvg, type ContactInput } from "@/lib/green-biz-card";
import { createAdminClient } from "@/lib/supabase/admin";

async function callDalle3(prompt: string) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const json = (await response.json()) as { data?: Array<{ url?: string }> };
  return json.data?.[0]?.url ?? null;
}

export async function POST(request: Request) {
  try {
    const { sessionId } = (await request.json()) as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: session, error: sessionError } = await supabase
      .from("design_sessions")
      .select("*, contact:contacts(*)")
      .eq("id", sessionId)
      .single();

    if (sessionError) throw sessionError;
    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "No active design session - complete payment first" },
        { status: 403 },
      );
    }
    if (session.attempts_remaining <= 0) {
      return NextResponse.json({ error: "No attempts remaining" }, { status: 403 });
    }

    const attemptNumber = 6 - session.attempts_remaining;
    const prompt = buildDesignPrompt(session.contact as ContactInput);
    const imageUrl = (await callDalle3(prompt)) ?? fallbackDesignSvg(prompt, attemptNumber);

    const { data: variant, error: variantError } = await supabase
      .from("design_variants")
      .insert({
        session_id: sessionId,
        attempt_number: attemptNumber,
        prompt_used: prompt,
        image_url: imageUrl,
        image_url_source: process.env.OPENAI_API_KEY ? "openai-dall-e-3" : "local-svg-fallback",
        image_url_confidence: process.env.OPENAI_API_KEY ? 0.86 : 0.72,
        image_url_review_status: "unreviewed",
      })
      .select("*")
      .single();

    if (variantError) throw variantError;

    const { data: updatedSession, error: updateError } = await supabase
      .from("design_sessions")
      .update({ attempts_remaining: session.attempts_remaining - 1 })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    await supabase.from("audit_logs").insert({
      action: "design_generated",
      entity_type: "design_variants",
      entity_id: variant.id,
      metadata: { session_id: sessionId, attempt_number: attemptNumber },
    });

    return NextResponse.json({ variant, session: updatedSession });
  } catch (err) {
    console.error("[api/generate-design]", err);
    return NextResponse.json({ error: "Could not generate design" }, { status: 500 });
  }
}
