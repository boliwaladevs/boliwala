-- Boliwala.com — welcome-email idempotency stamp.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0019_welcome_email_sent.sql
--
-- Supabase Auth mails a confirmation on password signup, because that flow has
-- an address to confirm. A Google account has none — Google already verified
-- it — so Supabase sends such a user nothing at all, and they have no way to
-- tell that the missing verification email is correct rather than lost. The
-- app sends that one welcome message itself (lib/email/welcome.ts).
--
-- This column is how it stays sent exactly once. The alternative — comparing
-- auth.users.created_at against now() inside the OAuth callback — double-sends
-- whenever the round trip is slow and silently stops working if the window is
-- ever tuned. A stamp is not a heuristic.
--
-- Deliberately NOT added to the column-level UPDATE grant from 0016. Only the
-- service-role client writes it; a signed-in user editing their own profile has
-- no business clearing it and re-triggering a send.

alter table public.profiles
  add column if not exists "welcomeEmailSentAt" timestamptz;

comment on column public.profiles."welcomeEmailSentAt" is
  'Set when the Google-signup welcome email was sent. Null means not yet sent. Service-role writes only.';
