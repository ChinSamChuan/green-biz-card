# Tasks — Green Biz Card

## Gantt Overview
```
Sprint 1 (DB + QR)       : Week 1
Sprint 2 (Stripe + AI)   : Week 1–2   ← v1 functional milestone
Sprint 3 (Lock it down)  : Week 2–3
Sprint 4 (Order mgmt)    : Week 3–4
```

---

## Sprint 1 — DB + QR Engine
**Goal:** App loads with seed data; contact form generates and displays a real QR code; PNG downloadable.

- [ ] Apply migration SQL to Supabase (contacts, design_sessions, design_variants, orders, audit_logs + seed rows)
- [ ] Next.js project scaffold on Vercel; env vars configured
- [ ] Homepage renders seed contact + QR demo (no login required)
- [ ] Contact info form: full_name, job_title, company, email, phone, website, address
- [ ] API route `POST /api/qr` → builds vCard → generates QR PNG → uploads to Supabase Storage → writes contacts row → returns image URL
- [ ] QR displayed on screen (loading / error / success states handled)
- [ ] "Download PNG" button fetches full-res image (not screenshot); works
- [ ] Audit log entry written: `qr_generated`
- [ ] Empty state: form blank on load; error state: missing required field shows inline message

**Definition of Done:** A real contact form submission creates a contacts row in Supabase AND renders a scannable QR code that adds the contact to a phone — confirmed by manual scan test.

---

## Sprint 2 — Stripe Checkout + AI Design Generator ✦ v1 functional
**Goal:** End-to-end paid flow works: pay → design → accept → order confirmed.

- [ ] Stripe product created ($8.99); `STRIPE_SECRET_KEY` + webhook secret in env
- [ ] API route `POST /api/checkout` → creates Stripe Checkout session with shipping address collection → returns session URL
- [ ] Stripe webhook `POST /api/stripe-webhook` → on `payment_intent.succeeded` → creates design_sessions row (payment_status=paid, attempts_remaining=5)
- [ ] Design screen: loads active session; shows attempts remaining; "Generate Design" button
- [ ] API route `POST /api/generate-design` → validates attempts_remaining > 0 → builds prompt from contact fields → calls DALL-E 3 → saves design_variants row → decrements attempts_remaining
- [ ] Design variants carousel: shows all attempts; each has "Accept this design" button
- [ ] API route `POST /api/confirm-order` → sets variant.is_accepted=true → creates orders row → writes audit log `order_confirmed` → sets builder_notified=true via Supabase realtime
- [ ] Error states: payment failure, DALL-E error, attempts exhausted (0 remaining = disabled button + message)
- [ ] Loading states on all async actions
- [ ] Stripe CLI tested locally; webhook delivery confirmed

**Definition of Done:** One browser session completes the full flow — contact form → QR download → Stripe payment → 1+ AI designs generated → design accepted → orders row exists in Supabase with status=confirmed. Verified with Stripe test card.

---

## Sprint 3 — Lock It Down
**Goal:** Real users can own their data; anonymous access removed from sensitive rows.

- [ ] Enable Supabase Auth (email + magic link)
- [ ] Sign-up / log-in pages (not the homepage)
- [ ] `user_id` populated from `auth.uid()` on all new rows
- [ ] Replace permissive RLS policies with owner-scoped (`auth.uid() = user_id`) on all tables
- [ ] Seed rows get `user_id = null`; ensure they still render in demo without breaking
- [ ] "My Orders" page: lists the authenticated user's orders
- [ ] Builder admin route: gated to builder's UID; lists all orders + fulfilment status

**Definition of Done:** A logged-in user can only read/edit their own rows; a different test account sees zero of the first user's data — confirmed by manual Supabase query check.

---

## Sprint 4 — Order Management + Notifications
**Goal:** Builder has a dashboard; buyers get email confirmations; corporate bulk ordering starts.

- [ ] Admin order dashboard: table of all orders, sortable by date / fulfilment_status
- [ ] Fulfilment status update: builder can set in_production / shipped / delivered
- [ ] Email to buyer on order confirmed (Resend or SendGrid; server-side only)
- [ ] Design change log: per order, show all variants attempted
- [ ] Corporate CSV upload: parse staff contacts → batch QR generation → bulk design sessions

**Definition of Done:** Builder can update an order's fulfilment status and the change is reflected immediately in the admin view; buyer receives an email within 60 seconds of order confirmation.
