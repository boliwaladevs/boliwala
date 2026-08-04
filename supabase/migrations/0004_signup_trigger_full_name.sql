-- Capture full_name from auth signup metadata into profiles. The signup form
-- collects it (components/auth-view.tsx) but 0002's trigger only set email.

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

  insert into public.profiles (id, email, "fullName", "creditsBalance", "createdAt", "updatedAt")
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', v_credits, now(), now());

  insert into public.credit_transactions
    (id, "userId", delta, reason, "balanceAfter", "createdAt")
  values
    (gen_random_uuid(), new.id, v_credits, 'signup_grant', v_credits, now());

  return new;
end;
$$;
