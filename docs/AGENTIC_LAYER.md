# Agentic Layer — Green Biz Card

## Risk Levels & Actions

### Low — Auto (no approval needed)
| Action | Trigger | Tool |
|---|---|---|
| Generate vCard string | Contact form submit | `build_vcard` |
| Generate QR PNG | vCard ready | `generate_qr_png` |
| Build AI design prompt | Session active | `build_design_prompt` |
| Write audit log entry | Any meaningful action | `write_audit_log` |

### Medium — Light Approval
| Action | Trigger | Tool |
|---|---|---|
| Call AI image API | User clicks Generate | `call_dalle3` — decrements attempts, logged |
| Mark variant accepted | User clicks Accept | `accept_design_variant` — sets is_accepted, writes order |

### High — Always Approval
| Action | Trigger | Tool |
|---|---|---|
| Create Stripe Checkout session | User initiates payment | `create_stripe_checkout` — builder reviews pricing config |
| Notify builder of new order | Order confirmed | `notify_builder` (Supabase realtime / email) |

### Critical — Human Only
| Action | Who |
|---|---|
| Issue Stripe refund | Builder manually in Stripe dashboard |
| Delete order record | Builder manually in Supabase |
| Change card price | Builder edits Stripe product — never in code without review |

## Audit Log Fields
`action`, `entity_type`, `entity_id`, `user_id`, `metadata` (includes attempt_number, stripe_pi_id, image_url), `created_at`

## v1 vs Later
- **v1:** auto QR + AI design; human builder fulfils card order
- **Later:** automated fulfilment API call on order confirmed
