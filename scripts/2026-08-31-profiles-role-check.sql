-- Constrain public.profiles.role to the four real roles.
--
-- NOT APPLIED. Written during the 2026-08-31 loop window under MEMORY.md
-- §37.1 rule 3: no unattended schema changes against production. Apply it
-- yourself when you are happy with it.
--
-- Why: §37.3 established that the only constraints on public.profiles are
-- profiles_pkey, profiles_id_fkey, profiles_pan_format and
-- profiles_aadhaar_format. There is no CHECK on `role`, so any string can be
-- written to it. "One email, one role" is now enforced at both login doors
-- (lib/auth/landing.ts), and both doors decide by comparing `role` against
-- these four values — a typo'd or invented role silently becomes a customer
-- at the customer door and is refused everywhere else. This closes that.
--
-- Live distribution when this was written: user x3, channel_partner x1,
-- superadmin x1 — 5 rows total, so the constraint should validate cleanly.

-- 1. Confirm nothing violates it first. Expect zero rows.
select id, email, role
from public.profiles
where role is null
   or role not in ('user', 'channel_partner', 'admin', 'superadmin');

-- 2. Only if the above returned nothing:
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'channel_partner', 'admin', 'superadmin'));

-- Rollback:
-- alter table public.profiles drop constraint profiles_role_check;
