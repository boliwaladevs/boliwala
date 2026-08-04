-- Boliwala.com — Sprint 2.1 prep: auction-detail columns, unlock RPC, and a
-- profiles grant fix found while wiring the unlock flow.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0005_listing_auction_fields_unlock_rpc_and_profile_grant_fix.sql

-- ---------------------------------------------------------------------------
-- Security fix: profiles.creditsBalance and profiles.role were directly
-- client-updatable by any authenticated user. own_profile_update only checks
-- id = auth.uid(), with no column restriction, and anon/authenticated held
-- the standard Supabase blanket table-level UPDATE grant — so a signed-in
-- user could set their own creditsBalance or self-promote to admin via a
-- direct PostgREST call. A column-level REVOKE alone doesn't fix this: the
-- table-level grant dominates it. The real fix is revoking the table-level
-- UPDATE grant entirely and re-granting only the columns profile-view.tsx
-- actually writes (fullName, phone) to authenticated.
-- ---------------------------------------------------------------------------

revoke update on public.profiles from anon, authenticated;
grant update ("fullName", phone) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- listings — auction-detail columns shown in listing-view.tsx with nothing
-- behind them (§6.4 of the handoff). Public/presentational, not gated.
-- ---------------------------------------------------------------------------

alter table public.listings
  add column if not exists "auctionTime" text,
  add column if not exists "mode" text default 'Online e-Auction',
  add column if not exists "bidIncreaseAmount" numeric,
  add column if not exists "totalOutstandingDues" numeric;

grant select ("auctionTime", "mode", "bidIncreaseAmount", "totalOutstandingDues")
  on public.listings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- unlocks — never charge the same (user, listing, field group) twice, and
-- give the RPC below something to catch a race on.
-- ---------------------------------------------------------------------------

alter table public.unlocks
  add constraint unlocks_user_listing_group_key unique ("userId", "listingId", "fieldGroup");

-- ---------------------------------------------------------------------------
-- listing_views had RLS disabled — anon key could read/write/delete any row,
-- including other users' userId/ipHash. No client policies: all writes go
-- through the service-role admin client from the server, same as
-- credit_transactions/unlocks.
-- ---------------------------------------------------------------------------

alter table public.listing_views enable row level security;

-- ---------------------------------------------------------------------------
-- unlock_field_group — atomic balance-check + charge for the credit-spend
-- flow. SECURITY DEFINER so it can bypass RLS on profiles/unlocks/
-- credit_transactions the same way handle_new_user does. Idempotent: calling
-- it again for an already-unlocked group returns the existing unlock instead
-- of charging twice. Active subscribers unlock free (cost 0, still recorded
-- in unlocks so unlockedGroups/getViewer sees it), consistent with
-- resolveListingAccess never presenting a "spend" action to a subscriber.
-- ---------------------------------------------------------------------------

create or replace function public.unlock_field_group(p_listing_id uuid, p_field_group "FieldGroup")
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost int;
  v_balance int;
  v_unlock_id uuid;
  v_existing_spent int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select "creditsSpent" into v_existing_spent from public.unlocks
    where "userId" = v_user_id and "listingId" = p_listing_id and "fieldGroup" = p_field_group;
  if found then
    select "creditsBalance" into v_balance from public.profiles where id = v_user_id;
    return jsonb_build_object('creditsSpent', v_existing_spent, 'newBalance', v_balance, 'alreadyUnlocked', true);
  end if;

  if exists (
    select 1 from public.subscriptions
    where "userId" = v_user_id and status = 'active' and "expiresAt" > now()
  ) then
    v_cost := 0;
  else
    select (value #>> '{}')::int into v_cost
      from public.settings
      where key = case p_field_group
        when 'flat_floor' then 'credit_cost_flat_floor'
        when 'inspection' then 'credit_cost_inspection'
        when 'officer_contact' then 'credit_cost_officer_contact'
      end;
    v_cost := coalesce(v_cost, 1);
  end if;

  select "creditsBalance" into v_balance from public.profiles where id = v_user_id for update;

  if v_cost > 0 and v_balance < v_cost then
    raise exception 'insufficient_credits';
  end if;

  v_unlock_id := gen_random_uuid();

  begin
    insert into public.unlocks (id, "userId", "listingId", "fieldGroup", "creditsSpent", "createdAt")
    values (v_unlock_id, v_user_id, p_listing_id, p_field_group, v_cost, now());
  exception when unique_violation then
    -- Concurrent call for the same group already inserted first; treat as
    -- success rather than double-charging.
    select "creditsSpent" into v_existing_spent from public.unlocks
      where "userId" = v_user_id and "listingId" = p_listing_id and "fieldGroup" = p_field_group;
    select "creditsBalance" into v_balance from public.profiles where id = v_user_id;
    return jsonb_build_object('creditsSpent', v_existing_spent, 'newBalance', v_balance, 'alreadyUnlocked', true);
  end;

  if v_cost > 0 then
    v_balance := v_balance - v_cost;
    update public.profiles set "creditsBalance" = v_balance, "updatedAt" = now() where id = v_user_id;

    insert into public.credit_transactions (id, "userId", delta, reason, "refId", "balanceAfter", "createdAt")
    values (gen_random_uuid(), v_user_id, -v_cost, 'unlock', v_unlock_id, v_balance, now());
  end if;

  return jsonb_build_object('creditsSpent', v_cost, 'newBalance', v_balance, 'alreadyUnlocked', false);
end;
$$;

-- New functions get EXECUTE granted to anon/authenticated/service_role by
-- default (Supabase's default privileges for the public schema) — revoke
-- anon explicitly since this must be a signed-in-only call (the function's
-- own auth.uid() check would reject anon anyway, but least-privilege here
-- costs nothing).
grant execute on function public.unlock_field_group(uuid, "FieldGroup") to authenticated;
revoke execute on function public.unlock_field_group(uuid, "FieldGroup") from public, anon;
