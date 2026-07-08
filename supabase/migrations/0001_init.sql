create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text not null,
  job_title text,
  company text,
  email text,
  phone text,
  website text,
  address text,
  vcard_string text,
  qr_image_url text,
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;
drop policy if exists "contacts_v1_read" on contacts;
create policy "contacts_v1_read" on contacts for select using (true);
drop policy if exists "contacts_v1_write" on contacts;
create policy "contacts_v1_write" on contacts for all using (true) with check (true);

create table if not exists design_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  contact_id uuid references contacts(id),
  stripe_payment_intent_id text,
  payment_status text not null default 'pending',
  attempts_remaining integer not null default 5,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_country text,
  shipping_postal_code text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table design_sessions enable row level security;
drop policy if exists "design_sessions_v1_read" on design_sessions;
create policy "design_sessions_v1_read" on design_sessions for select using (true);
drop policy if exists "design_sessions_v1_write" on design_sessions;
create policy "design_sessions_v1_write" on design_sessions for all using (true) with check (true);

create table if not exists design_variants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id uuid references design_sessions(id),
  attempt_number integer not null,
  prompt_used text,
  image_url text,
  image_url_source text,
  image_url_confidence numeric,
  image_url_review_status text default 'unreviewed',
  is_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table design_variants enable row level security;
drop policy if exists "design_variants_v1_read" on design_variants;
create policy "design_variants_v1_read" on design_variants for select using (true);
drop policy if exists "design_variants_v1_write" on design_variants;
create policy "design_variants_v1_write" on design_variants for all using (true) with check (true);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  contact_id uuid references contacts(id),
  session_id uuid references design_sessions(id),
  accepted_variant_id uuid references design_variants(id),
  status text not null default 'confirmed',
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_country text,
  shipping_postal_code text,
  amount_paid_cents integer not null default 899,
  builder_notified boolean not null default false,
  fulfilment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table orders enable row level security;
drop policy if exists "orders_v1_read" on orders;
create policy "orders_v1_read" on orders for select using (true);
drop policy if exists "orders_v1_write" on orders;
create policy "orders_v1_write" on orders for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into contacts (id, full_name, job_title, company, email, phone, website, address, vcard_string, qr_image_url) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Priya Sharma', 'Head of Operations', 'EcoVentures Pte Ltd', 'priya@ecoventures.sg', '+65 9123 4567', 'https://ecoventures.sg', '10 Anson Rd, Singapore 079903', 'BEGIN:VCARD\nVERSION:3.0\nFN:Priya Sharma\nORG:EcoVentures Pte Ltd\nEMAIL:priya@ecoventures.sg\nTEL:+6591234567\nEND:VCARD', null),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'James Okafor', 'Sales Director', 'GreenLoop Corp', 'james@greenloop.io', '+1 415 555 0192', 'https://greenloop.io', '240 Kent Ave, Brooklyn NY 11249', 'BEGIN:VCARD\nVERSION:3.0\nFN:James Okafor\nORG:GreenLoop Corp\nEMAIL:james@greenloop.io\nTEL:+14155550192\nEND:VCARD', null),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Mei Lin Tan', 'Sustainability Lead', 'Bamboo Works Ltd', 'mei@bamboworks.co', '+60 12 345 6789', 'https://bamboworks.co', 'Jalan Ampang, 50450 KL, Malaysia', 'BEGIN:VCARD\nVERSION:3.0\nFN:Mei Lin Tan\nORG:Bamboo Works Ltd\nEMAIL:mei@bamboworks.co\nTEL:+60123456789\nEND:VCARD', null);

insert into design_sessions (id, contact_id, stripe_payment_intent_id, payment_status, attempts_remaining, shipping_name, shipping_address, shipping_city, shipping_country, shipping_postal_code, status) values
  ('b1000000-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'pi_demo_001', 'paid', 3, 'Priya Sharma', '10 Anson Rd', 'Singapore', 'SG', '079903', 'active'),
  ('b1000000-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'pi_demo_002', 'paid', 0, 'James Okafor', '240 Kent Ave', 'Brooklyn', 'US', '11249', 'completed');

insert into design_variants (id, session_id, attempt_number, prompt_used, image_url, image_url_source, image_url_confidence, image_url_review_status, is_accepted) values
  ('c1000000-0001-0001-0001-000000000001', 'b1000000-0001-0001-0001-000000000001', 1, 'Minimalist green metal card with leaf motif for EcoVentures', null, 'openai-dall-e-3', 0.91, 'unreviewed', false),
  ('c1000000-0002-0002-0002-000000000002', 'b1000000-0002-0002-0002-000000000002', 1, 'Bold dark metal card with recycled-material texture for GreenLoop', null, 'openai-dall-e-3', 0.88, 'approved', true);

insert into orders (id, contact_id, session_id, accepted_variant_id, status, shipping_name, shipping_address, shipping_city, shipping_country, shipping_postal_code, amount_paid_cents, builder_notified, fulfilment_status) values
  ('d1000000-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', 'b1000000-0002-0002-0002-000000000002', 'c1000000-0002-0002-0002-000000000002', 'confirmed', 'James Okafor', '240 Kent Ave', 'Brooklyn', 'US', '11249', 899, true, 'in_production');