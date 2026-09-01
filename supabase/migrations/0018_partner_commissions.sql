-- Boliwala.com — W6.1: the channel partner commission model.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0018_partner_commissions.sql
--
-- (Numbered 0018, not the 0017 immediate_plan.md guessed: W2 took 0015 for the
-- manual-payment column, W3 took 0016 for the grants, W4 took 0017 for lenders.)
--
-- A commission has to attach to a revenue event. There is no Razorpay and there
-- will be none before launch, so the only revenue events that exist are the
-- manual grants built in W2.5 — an admin taking payment offline and opening
-- access by hand. This schema hangs off those.
--
-- Three tables, one lifecycle:
--
--   partner_referrals    someone arrived on a partner's link, and later signed up
--   partner_commissions  that person paid for something, so the partner earned
--   partner_payouts      the partner was actually paid
--
-- Nothing here computes a tier automatically. Product spec §5.9 has an admin
-- assign Associate / Silver / Gold on approval, and the thresholds have not been
-- decided — so the tier is stored, not derived, and no threshold is invented.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- What kind of revenue a commission came from. `success_fee` exists in the
-- vocabulary because product spec §5.10 asks for a success-fee commission rate,
-- but nothing can ever write it yet: no table records an auction being won or a
-- fee falling due. The value is here so the enum does not need altering later;
-- the code path is deliberately unbuilt.
create type "CommissionSource" as enum ('annual_subscription', 'service_package', 'success_fee');

create type "CommissionStatus" as enum ('accrued', 'approved', 'paid');
create type "PayoutStatus" as enum ('pending', 'paid');
create type "PartnerTier" as enum ('associate', 'silver', 'gold');

-- ---------------------------------------------------------------------------
-- A partner's referral code, and their tier, live on the profile.
--
-- Both are nullable and only a channel_partner has them: a code is issued when
-- an application is approved, and a tier is assigned by an admin at the same
-- moment. Putting them here rather than in a partner_profiles table keeps the
-- one-row-per-person shape the rest of the app already assumes.
-- ---------------------------------------------------------------------------

alter table public.profiles add column "referralCode" text unique;
alter table public.profiles add column "partnerTier" "PartnerTier";

comment on column public.profiles."referralCode" is
  'Issued when a channel partner application is approved. Null for everyone else. Appears in referral links as /?ref=<code>.';

-- ---------------------------------------------------------------------------
-- partner_referrals — one row per person who arrived on a partner's link and
-- then created an account. A click alone is not stored: it lives in a cookie
-- until it turns into a signup, so this table cannot be inflated by traffic.
-- ---------------------------------------------------------------------------

create table public.partner_referrals (
  id                  uuid primary key,
  "partnerId"         uuid not null references public.profiles(id) on delete cascade,
  -- The code as it was used, kept alongside the id: if a partner's code is ever
  -- reissued, the history still shows which link brought this person in.
  "refCode"           text not null,
  "referredProfileId" uuid not null references public.profiles(id) on delete cascade,
  "landedAt"          timestamp not null,
  "convertedAt"       timestamp,
  "conversionType"    "CommissionSource",
  "createdAt"         timestamp not null default current_timestamp,
  -- One person is referred once. A second partner cannot claim them later.
  unique ("referredProfileId")
);

create index partner_referrals_partner_idx on public.partner_referrals ("partnerId");

-- ---------------------------------------------------------------------------
-- partner_commissions — what a partner earned, and where it is in its life.
--
-- `ratePct`, `grossAmount` and `commissionAmount` are all stored rather than
-- recomputed on read. Rates change; a commission agreed in September must not
-- silently re-price itself in November. Product spec §5.10 says as much:
-- "changes apply to new commissions only".
-- ---------------------------------------------------------------------------

create table public.partner_commissions (
  id                 uuid primary key,
  "partnerId"        uuid not null references public.profiles(id) on delete cascade,
  "referralId"       uuid references public.partner_referrals(id) on delete set null,
  "sourceType"       "CommissionSource" not null,
  -- The row that produced the money: a subscriptions.id or a service_packages.id.
  -- Deliberately not a foreign key — it points at one of two tables.
  "sourceId"         uuid,
  "grossAmount"      numeric not null,
  "ratePct"          numeric not null,
  "commissionAmount" numeric not null,
  status             "CommissionStatus" not null default 'accrued',
  "payoutId"         uuid,
  "createdAt"        timestamp not null default current_timestamp,
  "approvedAt"       timestamp,
  "approvedBy"       uuid references public.profiles(id) on delete set null
);

create index partner_commissions_partner_idx on public.partner_commissions ("partnerId");
create index partner_commissions_status_idx on public.partner_commissions (status);

-- ---------------------------------------------------------------------------
-- partner_payouts — a batch of approved commissions actually paid out.
-- ---------------------------------------------------------------------------

create table public.partner_payouts (
  id            uuid primary key,
  "partnerId"   uuid not null references public.profiles(id) on delete cascade,
  "periodStart" timestamp not null,
  "periodEnd"   timestamp not null,
  "totalAmount" numeric not null,
  status        "PayoutStatus" not null default 'pending',
  "paidAt"      timestamp,
  reference     text,
  "createdAt"   timestamp not null default current_timestamp
);

create index partner_payouts_partner_idx on public.partner_payouts ("partnerId");

alter table public.partner_commissions
  add constraint "partner_commissions_payoutId_fkey"
  foreign key ("payoutId") references public.partner_payouts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS. This is a new leak surface and is treated like the listing gate: a
-- partner sees their own rows and nothing else, and the admin panel reads
-- everything through the service-role client, which bypasses RLS.
--
-- Money data belonging to one partner appearing in another partner's dashboard
-- would be worse than the listing leak this project already guards against, so
-- scripts/access-matrix-test.mjs gains a third tally for exactly these cases
-- (W6.7).
-- ---------------------------------------------------------------------------

alter table public.partner_referrals enable row level security;
alter table public.partner_commissions enable row level security;
alter table public.partner_payouts enable row level security;

create policy own_partner_referrals on public.partner_referrals
  for select to authenticated using ("partnerId" = auth.uid());

create policy own_partner_commissions on public.partner_commissions
  for select to authenticated using ("partnerId" = auth.uid());

create policy own_partner_payouts on public.partner_payouts
  for select to authenticated using ("partnerId" = auth.uid());

-- Grants, in the W3 style: a new table still inherits Postgres's blanket grant
-- for anon and authenticated, and 0016's ALTER DEFAULT PRIVILEGES only strips
-- TRUNCATE/REFERENCES/TRIGGER. Everything else has to be revoked here.
revoke all on public.partner_referrals from anon, authenticated;
revoke all on public.partner_commissions from anon, authenticated;
revoke all on public.partner_payouts from anon, authenticated;

grant select on public.partner_referrals to authenticated;
grant select on public.partner_commissions to authenticated;
grant select on public.partner_payouts to authenticated;

-- ---------------------------------------------------------------------------
-- Commission settings. Product spec §5.10 asks for three editable rates, all
-- applying globally to new commissions only.
--
-- The two live rates are the client's confirmed numbers (2026-09-01): 10% of an
-- annual subscription, 15% of a service package. They are NOT placeholders.
--
-- The success-fee rate is seeded at 0 because there is nothing to charge it
-- against — no table records a success fee — and a non-zero rate on an unbuilt
-- flow would be a number nobody could explain.
--
-- The tier thresholds are seeded as null, not as invented numbers. The client
-- is deciding them; until then an admin assigns tiers by hand, which is what
-- product spec §5.9 describes anyway.
-- ---------------------------------------------------------------------------

insert into public.settings (key, value, "updatedAt") values
  ('commission_rate_subscription', '10'::jsonb,   current_timestamp),
  ('commission_rate_package',      '15'::jsonb,   current_timestamp),
  ('commission_rate_success_fee',  '0'::jsonb,    current_timestamp),
  ('partner_tier_silver_min',      'null'::jsonb, current_timestamp),
  ('partner_tier_gold_min',        'null'::jsonb, current_timestamp),
  ('referral_attribution_days',    '30'::jsonb,   current_timestamp)
on conflict (key) do nothing;
