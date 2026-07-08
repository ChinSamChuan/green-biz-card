# Intelligence Layer — Green Biz Card

## Messy Input → Structured Output
User types free-form contact details (job title, address variants) → server normalises into vCard 3.0 spec before storage.

## AI Design Generation
**Trigger:** User clicks "Generate Design" inside a paid session.

**Auto-structured prompt (JSON example):**
```json
{
  "style": "minimalist metal card",
  "color_hint": "green and dark",
  "text_elements": ["Priya Sharma", "Head of Operations", "EcoVentures", "priya@eco.sg"],
  "material_feel": "brushed metal",
  "logo_space": true
}
```
→ Sent to DALL-E 3; image URL returned and stored with source, confidence, review_status.

## Events Tracked
- `qr_generated` — contact row created
- `design_generated` — variant row created (attempt #N)
- `design_accepted` — variant.is_accepted = true
- `order_confirmed` — order row created
- `payment_succeeded` — Stripe webhook received

## Scoring Rules (v1 — rule-based)
- `attempts_remaining` decremented server-side on each generation (not client-enforced)
- If `attempts_remaining = 0`, generation endpoint returns 403
- `image_url_confidence` stored from model metadata; values < 0.7 flagged for builder review

## v1 vs Later
| v1 | Later |
|---|---|
| Fixed prompt template from contact fields | User style preferences (color, layout) |
| Rule-based attempt gating | Usage analytics per session |
| Manual builder review | Auto-flag low-confidence designs |
