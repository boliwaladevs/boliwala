-- Boliwala.com — Sprint 6.2: profile "My Details" columns.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0009_profile_details_columns.sql
--
-- /profile has rendered City, PAN and Aadhaar fields since Sprint 2 with no
-- columns behind them — whatever the user typed was silently discarded. This
-- adds the columns.
--
-- PAN and Aadhaar are sensitive personal data and Aadhaar in particular is
-- regulated (Aadhaar Act / UIDAI rules: lawful purpose, consent, retention
-- limits, and security safeguards). Storing them here was a client decision.
-- What this migration does to keep that decision as safe as the schema allows:
--
--   * UPDATE is granted per-column to `authenticated` only, never `anon` —
--     matching the pattern established in 0005, where the table-level UPDATE
--     grant was revoked precisely so new columns cannot become writable by
--     accident.
--   * Reads stay governed by the existing `own_profile` RLS policy
--     (id = auth.uid()), so one user can never read another's PAN or Aadhaar.
--     No new SELECT grant is needed or given.
--   * Format CHECK constraints reject malformed values outright. Garbage in a
--     regulated field is worse than an empty one, and a constraint is the only
--     layer a buggy client cannot skip.
--
-- Still outstanding for whoever owns compliance, and NOT solved here:
-- application-level encryption at rest, a retention/deletion policy, and an
-- access audit trail. Supabase encrypts the volume, which is not the same as
-- protecting the value from anyone holding a valid session or service key.

alter table public.profiles
  add column if not exists city text,
  add column if not exists "panNumber" text,
  add column if not exists "aadhaarNumber" text,
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Format gates. Both allow NULL so the fields stay optional; they only bite
-- when a value is actually supplied.
alter table public.profiles
  drop constraint if exists profiles_pan_format;
alter table public.profiles
  add constraint profiles_pan_format
  check ("panNumber" is null or "panNumber" ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');

-- Aadhaar is 12 digits and never begins with 0 or 1.
alter table public.profiles
  drop constraint if exists profiles_aadhaar_format;
alter table public.profiles
  add constraint profiles_aadhaar_format
  check ("aadhaarNumber" is null or "aadhaarNumber" ~ '^[2-9][0-9]{11}$');

-- 0005 revoked the table-level UPDATE grant, so these are invisible to a
-- client write until named here. anon is deliberately absent.
grant update (city, "panNumber", "aadhaarNumber", preferences)
  on public.profiles to authenticated;

comment on column public.profiles."panNumber" is
  'Sensitive. Own-row read only via RLS own_profile. Format-checked.';
comment on column public.profiles."aadhaarNumber" is
  'Sensitive, regulated under UIDAI rules. Own-row read only via RLS own_profile. Format-checked. See 0009 header for what is still outstanding.';
