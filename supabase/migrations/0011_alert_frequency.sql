-- Boliwala.com — Sprint 6.3: delivery frequency for saved alerts.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0011_alert_frequency.sql
--
-- The /search alert banner has always shown an Instant / Daily digest / Weekly
-- selector with nothing behind it. Wiring the banner without this column would
-- mean silently discarding the user's choice — the same class of bug as the
-- profile fields in 0009.
--
-- Nothing reads this yet; the alert engine that will is blocked on Resend
-- (Sprint 4.5). Storing it now means the engine inherits real preferences
-- instead of defaulting everyone to instant.

alter table public.alert_subscriptions
  add column if not exists frequency text not null default 'instant';

alter table public.alert_subscriptions
  drop constraint if exists alert_subscriptions_frequency_check;
alter table public.alert_subscriptions
  add constraint alert_subscriptions_frequency_check
  check (frequency in ('instant', 'daily', 'weekly'));

-- 0010 narrowed the client-writable surface to isActive only. Frequency is set
-- at insert time, so it needs no UPDATE grant; changing it means saving the
-- search again.
