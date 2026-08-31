-- Boliwala.com — W3: make the table grants say the same thing the RLS policies say.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0016_grants_match_policies.sql
--
-- Every table created before this migration carries Postgres's default blanket
-- grant for anon and authenticated — SELECT, INSERT, UPDATE, DELETE, TRUNCATE,
-- REFERENCES and TRIGGER on everything, including admin_audit_log and payments.
-- RLS is the only thing standing in the way. That is one mistake away from a
-- breach: a table shipped with RLS off, or a policy written wider than intended,
-- and the anon key can write to it.
--
-- This narrows every grant to what that table's policies actually expect. RLS
-- stays exactly as it is; this is the second lock, not a replacement.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO
-- ---------------------------------------------------------------------------
--
-- immediate_plan.md W3 originally carried a draft that did:
--
--   REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
--
-- That is worse than doing nothing: it hands anon write access to every table
-- in the schema and leans entirely on RLS. The plan already says not to run it.
--
-- More importantly — and this was **not** in the plan — three tables already
-- carry hand-made **column-level** grants that are load-bearing:
--
--   listings              anon/authenticated SELECT on 27 named columns only.
--                         The gated fields (flat number, floor, inspection
--                         details, officer contact) are NOT selectable. This is
--                         the credit gate enforced at the database, underneath
--                         the application's own redaction.
--   profiles              authenticated UPDATE on exactly six columns:
--                         fullName, phone, city, panNumber, aadhaarNumber,
--                         preferences. NOT role. NOT creditsBalance.
--   alert_subscriptions   authenticated UPDATE on "isActive" only.
--
-- A table-level `REVOKE UPDATE ON profiles FROM authenticated` would silently
-- destroy that column list, and a table-level `GRANT UPDATE` would let any
-- signed-in user set their own role to superadmin or top up their own credits.
-- So: **no table-level UPDATE is revoked or granted on those three tables.**

-- ---------------------------------------------------------------------------
-- 1. The three privileges nothing legitimate uses, removed schema-wide.
--    TRUNCATE empties a table outright. REFERENCES lets a client add a foreign
--    key to a table it does not own. TRIGGER lets it attach code that runs on
--    someone else's write. No client code path needs any of them.
-- ---------------------------------------------------------------------------

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- And for every table created from here on, so W5's and W6's new tables do not
-- land straight back at the permissive default.
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Public-read reference data. Policy: read by anyone.
-- ---------------------------------------------------------------------------

revoke insert, update, delete on public.banks from anon, authenticated;
revoke insert, update, delete on public.settings from anon, authenticated;
revoke insert, update, delete on public.listing_images from anon, authenticated;
grant select on public.banks, public.settings, public.listing_images to anon, authenticated;

-- listings: SELECT is already column-scoped and must stay that way. Only the
-- write privileges are removed.
revoke insert, update, delete on public.listings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Write-only intake. Policy: anyone may insert, nobody may read back.
--    An enquiry pipeline that the anon key can read is a customer list leak.
-- ---------------------------------------------------------------------------

revoke all on public.callback_requests from anon, authenticated;
revoke all on public.channel_partner_applications from anon, authenticated;
grant insert on public.callback_requests to anon, authenticated;
grant insert on public.channel_partner_applications to anon, authenticated;
-- contact_sales_enquiries was already narrowed this way by 0014.

-- ---------------------------------------------------------------------------
-- 4. Own-row reads for a signed-in user. anon has no policy on any of these,
--    so anon gets nothing at all.
-- ---------------------------------------------------------------------------

revoke all on public.credit_transactions from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.service_packages from anon, authenticated;
revoke all on public.subscriptions from anon, authenticated;
revoke all on public.unlocks from anon, authenticated;

grant select on public.credit_transactions to authenticated;
grant select on public.payments to authenticated;
grant select on public.service_packages to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.unlocks to authenticated;

-- Rows in unlocks and credit_transactions are written by unlock_field_group(),
-- which is SECURITY DEFINER and runs as its owner — it does not need the caller
-- to hold INSERT. Subscriptions, payments and service_packages are written only
-- by the admin panel through the service-role client.

-- ---------------------------------------------------------------------------
-- 5. Shortlists — the one table a user genuinely writes to directly.
--    Policy own_shortlists is FOR ALL, scoped to auth.uid(). The app selects,
--    inserts and deletes; it never updates a shortlist row, so UPDATE is not
--    granted even though the policy would permit it.
-- ---------------------------------------------------------------------------

revoke all on public.shortlists from anon, authenticated;
grant select, insert, delete on public.shortlists to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Alert subscriptions. anon may create one (that is the "alert me" box on a
--    signed-out search); reading and changing them is the owner's only.
--    Deletion goes through the admin client after an ownership check, and there
--    is no delete policy, so DELETE goes.
-- ---------------------------------------------------------------------------

revoke select, delete on public.alert_subscriptions from anon;
revoke delete on public.alert_subscriptions from authenticated;
grant insert on public.alert_subscriptions to anon, authenticated;
grant select on public.alert_subscriptions to authenticated;
-- No UPDATE line: authenticated's column-level UPDATE on "isActive" must survive.

-- ---------------------------------------------------------------------------
-- 7. Profiles. A signed-out visitor has no business here at all. A signed-in
--    one reads their own row and updates six columns of it — a grant made by
--    0005 that this migration must not disturb.
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon;
revoke insert, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
-- Rows are created by handle_new_user() (SECURITY DEFINER, on auth.users) and
-- removed by cascade when auth.admin.deleteUser() runs. Neither needs a grant.

-- ---------------------------------------------------------------------------
-- 8. Admin-internal tables. RLS is already deny-all (0007); the grants should
--    not have been the only thing making that true.
-- ---------------------------------------------------------------------------

revoke all on public.admin_audit_log from anon, authenticated;
revoke all on public.bulk_upload_batches from anon, authenticated;
revoke all on public.listing_views from anon, authenticated;

-- _prisma_migrations: already gone from this database — `to_regclass` returns
-- null — so there is nothing to drop. Noted here because the plan asks for it.
