# Architecture — Green Biz Card

## Stack
- **Frontend:** Next.js 14 (App Router) on Vercel
- **Database + Auth:** Supabase (Postgres + RLS + Storage)
- **Payments:** Stripe Checkout + webhooks
- **AI Design:** OpenAI DALL-E 3 via server-side API route
- **QR Generation:** `qrcode` npm package (server-side, returns PNG buffer)

## Now vs Later
| Now (v1) | Later |
|---|---|
| Anonymous contact → QR → PNG download | User accounts + order history |
| Stripe $8.99 checkout | Bulk/corporate pricing |
| AI design (5 tries) → accept → order | Fulfilment status tracking |
| Builder notified via Supabase realtime | Admin dashboard |

## Key User Action — Step by Step
1. User fills contact form → Next.js API route builds vCard string
2. vCard → `qrcode` lib → PNG buffer → stored in Supabase Storage; URL written to `contacts` row
3. QR displayed; download button triggers full-res PNG fetch
4. User clicks "Design my metal card" → enters shipping address → Stripe Checkout session created server-side
5. Stripe webhook (`payment_intent.succeeded`) → server creates `design_sessions` row (attempts_remaining = 5)
6. Design screen calls `/api/generate-design` → OpenAI DALL-E 3 → image URL stored as `design_variants` row; attempts_remaining decremented
7. User accepts a variant → `/api/confirm-order` creates `orders` row; logs to `audit_logs`; Supabase triggers notify
8. Builder receives notification; fulfils metal card order offline

## Layer Sequence
1. **Data first** — tables, constraints, RLS policies
2. **App logic** — form, QR API, Stripe webhook, design API, order API
3. **Smart features** — AI design generation on top; core QR + order flow runs without it
