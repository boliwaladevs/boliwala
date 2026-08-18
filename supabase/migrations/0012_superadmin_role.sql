-- Boliwala.com — Sprint 6.10: superadmin role.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0012_superadmin_role.sql
--
-- Adding an enum value has to be its own migration: Postgres will not let a
-- newly added label be *used* in the same transaction that added it, and
-- scripts/apply-sql.mjs sends each file as one implicit transaction. The
-- trigger and settings that depend on this live in 0013.
--
-- superadmin sits above admin. Today the two have identical capability in the
-- panel; the distinction exists so the owner account can be told apart from
-- staff admins, and so admin-management screens can later refuse to demote or
-- delete a superadmin.

alter type "Role" add value if not exists 'superadmin';
