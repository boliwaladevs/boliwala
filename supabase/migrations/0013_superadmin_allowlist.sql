-- Boliwala.com — Sprint 6.10: superadmin allowlist, applied at signup.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0013_superadmin_allowlist.sql
--
-- The owner account signs in with Google, which means its profile row is
-- created by handle_new_user() on first sign-in — with the default role. There
-- is no window in which to promote it by hand before someone uses it, and
-- promoting by hand after the fact is exactly the kind of step that gets
-- forgotten on a fresh environment.
--
-- So the allowlist is data, not code: an email in settings.superadmin_emails
-- gets role 'superadmin' the moment its profile is created, whether it signs
-- up with Google or with a password. Adding another owner later is an UPDATE,
-- not a deployment.

insert into public.settings (key, value, "updatedAt")
values ('superadmin_emails', '["boliwaladevs@gmail.com"]'::jsonb, now())
on conflict (key) do update set value = excluded.value, "updatedAt" = now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits int;
  v_role "Role" := 'user';
begin
  select (value #>> '{}')::int into v_credits
  from public.settings where key = 'free_signup_credits';
  v_credits := coalesce(v_credits, 5);

  -- Case-insensitive: Google may hand back a differently-cased address than
  -- the one typed into the allowlist.
  if exists (
    select 1
    from public.settings s,
         jsonb_array_elements_text(s.value) as allowed(email)
    where s.key = 'superadmin_emails'
      and lower(allowed.email) = lower(new.email)
  ) then
    v_role := 'superadmin';
  end if;

  insert into public.profiles (id, email, "fullName", role, "creditsBalance", "createdAt", "updatedAt")
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', v_role, v_credits, now(), now());

  insert into public.credit_transactions
    (id, "userId", delta, reason, "balanceAfter", "createdAt")
  values
    (gen_random_uuid(), new.id, v_credits, 'signup_grant', v_credits, now());

  return new;
end;
$$;

-- Promote the owner account if it already exists (it does not at time of
-- writing, but this keeps the migration correct if re-run after a manual
-- signup).
update public.profiles
set role = 'superadmin', "updatedAt" = now()
where lower(email) in (
  select lower(e) from public.settings s, jsonb_array_elements_text(s.value) e
  where s.key = 'superadmin_emails'
)
and role <> 'superadmin';
