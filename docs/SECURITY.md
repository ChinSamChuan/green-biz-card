# Security — Green Biz Card

## Secret Handling
- `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — server-side only (Next.js API routes / Edge Functions); never in client bundle
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-safe; read-only scope
- Stripe webhook endpoint validates `stripe-signature` header on every request

## Permission Model (v1 → lock-down)
| Phase | Policy |
|---|---|
| v1 demo | Permissive RLS: all tables readable and writable anonymously |
| Lock-down sprint | Replace with `auth.uid() = user_id`; anon can only read seed/demo rows |
| Builder admin | Separate `builder_admin` role or service-role key used only in secure server context |

## Approved Tools Rule
- Agent calls named functions only (`build_vcard`, `generate_qr_png`, `call_dalle3`, `create_stripe_checkout`, `write_audit_log`, `notify_builder`)
- No raw SQL execution from client; no arbitrary external HTTP from client
- Every Stripe charge goes through a server-side API route — client only holds the session ID

## Audit Principle
- Every meaningful state change writes a row to `audit_logs` before returning a response
- Audit rows are append-only; no update or delete policy exists on `audit_logs`
- If a write to `audit_logs` fails, the parent action is rolled back

## Honest Stops
- Payments and webhooks: test thoroughly with Stripe CLI before going live; if Stripe webhook fails silently, orders will not be created — monitor webhook dashboard
- If unsure about PCI scope or data residency requirements for a specific country, stop and consult a human before launch
