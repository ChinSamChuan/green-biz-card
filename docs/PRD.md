# PRD — Green Biz Card

## Problem
Professionals waste money and paper on traditional business cards. There is no quick, self-serve tool to generate a contact QR code *and* order a premium metal card in one flow.

## Target User
- Individual professional who wants a reusable metal card fast
- Corporate HR / office manager ordering cards for multiple confirmed staff

## Core Objects
| Object | What it is |
|---|---|
| Contact | Name, title, company, email, phone, website, address → vCard |
| Design Session | Paid ($8.99) session; up to 5 AI design attempts; linked to a contact |
| Design Variant | One AI-generated card image; stores prompt, image URL, confidence |
| Order | Confirmed design + shipping address → builder fulfils as metal card |
| Audit Log | Every meaningful action recorded |

## MVP Must-Haves (v1)
- [ ] Contact form → vCard QR code rendered on screen
- [ ] One-click high-res PNG download of QR code
- [ ] Contact row persisted to Supabase on generation
- [ ] Stripe checkout for $8.99 unlocks a design session
- [ ] AI design generator: up to 5 attempts, each variant saved
- [ ] Accept design → order row created, builder notified
- [ ] All above works without requiring user login

## Non-Goals (v1)
- User accounts / login wall
- Bulk / corporate CSV upload
- Order fulfilment tracking beyond "confirmed"
- Refunds or order editing

## Success Criteria
A visitor opens the app, fills in their contact details, downloads their QR PNG, pays $8.99 via Stripe, generates a card design (≤ 5 attempts), accepts it, and an order row appears in Supabase — all within one browser session and without creating an account.
