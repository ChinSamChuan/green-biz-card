# Test Plan — Green Biz Card

## v1 Success Scenario (manual, end-to-end)
1. Open homepage → seed demo QR and contact visible without login
2. Fill contact form (all fields) → click "Generate QR"
   - **Pass:** QR appears on screen; contacts row exists in Supabase with correct vcard_string and qr_image_url
3. Scan QR with phone → phone prompts to add contact
   - **Pass:** Contact details match what was entered
4. Click "Download PNG" → file saves to disk
   - **Pass:** File is PNG, ≥ 512×512px, not a screenshot crop
5. Click "Design my metal card" → enter shipping address → proceed to Stripe
   - **Pass:** Stripe Checkout page loads with correct amount ($8.99)
6. Complete payment with Stripe test card `4242 4242 4242 4242`
   - **Pass:** Redirected back to design screen; design_sessions row exists with payment_status=paid, attempts_remaining=5
7. Click "Generate Design" up to 5 times
   - **Pass:** Each click produces a new design_variants row; attempts_remaining decrements correctly; on attempt 6 button is disabled with message "No attempts remaining"
8. Click "Accept this design" on any variant
   - **Pass:** orders row created with status=confirmed, accepted_variant_id set, builder_notified=true

## Empty / Error Cases
| Scenario | Expected behaviour |
|---|---|
| Contact form submitted with no name | Inline error: "Full name is required"; no API call made |
| API route /api/qr fails (Storage error) | Error message shown; no broken image displayed |
| Stripe payment declined (card `4000 0000 0000 0002`) | Stripe shows decline; user returned to checkout; no design_session created |
| Stripe webhook arrives out of order | Idempotency: check if session already exists before creating new row |
| DALL-E 3 returns error | Error message on design screen; attempts_remaining NOT decremented |
| User tries to generate design with 0 attempts remaining | Button disabled; "No attempts remaining" copy shown; API route returns 403 |
| Design screen loaded with no active paid session | Message: "No active design session — complete payment first" |

## Regression Checks (after each sprint)
- QR code still scannable after Sprint 3 auth changes
- Seed demo rows still visible on homepage post lock-down
- Stripe webhook still fires correctly after any route changes
