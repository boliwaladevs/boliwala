-- Boliwala.com — Sprint 6.1/6.3: let a user manage their own saved alerts.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0010_alert_subscriptions_update_policy.sql
--
-- alert_subscriptions had policies for INSERT (anon + authenticated, guest rows
-- allowed via "userId" is null) and SELECT (authenticated, own rows only), but
-- none for UPDATE. With RLS enabled and no UPDATE policy, every update is
-- denied — and PostgREST reports that as a successful call affecting zero
-- rows, so the "My Alerts" toggle would have appeared to work and silently
-- done nothing.
--
-- Deliberately authenticated-only. A guest can create an alert but cannot
-- manage one, because there is no way to prove they own an email address until
-- there is an email flow to confirm it (Sprint 4.5). Guest unsubscribe belongs
-- with that sprint, via a signed token in the email footer, not here.

drop policy if exists own_alert_update on public.alert_subscriptions;
create policy own_alert_update on public.alert_subscriptions
  for update to authenticated
  using ("userId" = auth.uid())
  with check ("userId" = auth.uid());

-- Only isActive is client-writable. Without this, a user could rewrite the
-- filters or email on their own row — harmless today, but it would let a row
-- drift away from what the audit trail says was subscribed to, and email is
-- the field an attacker would want to change if they got a session.
revoke update on public.alert_subscriptions from anon, authenticated;
grant update ("isActive") on public.alert_subscriptions to authenticated;
