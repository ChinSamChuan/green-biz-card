# Data Model — Green Biz Card

## contacts
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid nullable | owner scope (post lock-down) |
| full_name | text NOT NULL | |
| job_title | text | |
| company | text | |
| email | text | |
| phone | text | |
| website | text | |
| address | text | |
| vcard_string | text | server-generated |
| qr_image_url | text | Supabase Storage URL |
| created_at | timestamptz | default now() |

## design_sessions
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| contact_id | uuid FK → contacts | |
| stripe_payment_intent_id | text | |
| payment_status | text | pending / paid / failed |
| attempts_remaining | integer | default 5 |
| shipping_name / address / city / country / postal_code | text | |
| status | text | active / completed |
| created_at | timestamptz | |

## design_variants *(contains AI fields)*
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| session_id | uuid FK → design_sessions | |
| attempt_number | integer | 1–5 |
| prompt_used | text | |
| image_url | text | **AI value** |
| image_url_source | text | e.g. `openai-dall-e-3` |
| image_url_confidence | numeric | 0–1 model confidence |
| image_url_review_status | text | unreviewed / approved / rejected |
| is_accepted | boolean | default false |
| created_at | timestamptz | |

## orders
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| contact_id | uuid FK → contacts | |
| session_id | uuid FK → design_sessions | |
| accepted_variant_id | uuid FK → design_variants | |
| status | text | confirmed |
| shipping_name/address/city/country/postal_code | text | |
| amount_paid_cents | integer | 899 |
| builder_notified | boolean | |
| fulfilment_status | text | pending / in_production / shipped / delivered |
| created_at | timestamptz | |

## audit_logs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| action | text | e.g. qr_generated, design_accepted, order_confirmed |
| entity_type | text | contacts / orders / design_variants |
| entity_id | uuid | |
| metadata | jsonb | extra context |
| created_at | timestamptz | |

**RLS:** All tables have permissive v1 policies (select + all = true). Lock-down sprint replaces with `auth.uid() = user_id`.
