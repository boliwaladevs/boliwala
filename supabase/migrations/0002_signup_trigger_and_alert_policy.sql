-- Boliwala.com — signup profile/credit grant + alert_subscriptions read fix
--
-- Closes two gaps found while wiring Sprint 2 auth: (1) profiles/credit_transactions
-- have no client INSERT policy by design (credits must not be client-writable), but
-- nothing was creating the profile row or granting signup credits either — this adds
-- that as a SECURITY DEFINER trigger on auth.users, the standard Supabase pattern.
-- (2) alert_subscriptions was insert-only (no SELECT policy), so a signed-in user's
-- own "My Alerts" tab could never read back what they saved.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0002_signup_trigger_and_alert_policy.sql

-- ---------------------------------------------------------------------------
-- Signup → profile row + free-credit grant, atomic with the auth.users insert
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits int;
begin
  select (value #>> '{}')::int into v_credits
  from public.settings where key = 'free_signup_credits';
  v_credits := coalesce(v_credits, 5);

  insert into public.profiles (id, email, "creditsBalance", "createdAt", "updatedAt")
  values (new.id, new.email, v_credits, now(), now());

  insert into public.credit_transactions
    (id, "userId", delta, reason, "balanceAfter", "createdAt")
  values
    (gen_random_uuid(), new.id, v_credits, 'signup_grant', v_credits, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- alert_subscriptions — let a signed-in user read their own saved alerts, and
-- stop an authenticated client from being able to insert a row under someone
-- else's userId (the old policy's WITH CHECK (true) allowed any value).
-- ---------------------------------------------------------------------------

drop policy if exists alert_insert on alert_subscriptions;
create policy alert_insert on alert_subscriptions
  for insert to anon, authenticated
  with check ("userId" is null or "userId" = auth.uid());

drop policy if exists own_alert_subscriptions on alert_subscriptions;
create policy own_alert_subscriptions on alert_subscriptions
  for select to authenticated
  using ("userId" = auth.uid());
