-- Boliwala.com — W2.5: let `payments` record a payment taken outside Razorpay.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0015_manual_payments.sql
--
-- Every plan is sold by hand before launch: an admin agrees the price with the
-- client, takes the money directly, and grants the entitlement in the panel.
-- That is a real payment, and it has to land somewhere queryable or the revenue
-- KPIs stay at zero while money is actually coming in.
--
-- `payments` is the right table for it — it already carries userId, type,
-- amount, currency and status. The only thing standing in the way is
-- "razorpayOrderId" being NOT NULL, which assumes every payment came through a
-- gateway. A manually collected payment has no order id, and inventing one
-- ("manual-<uuid>") would put a lie in a column named after a specific
-- provider. Making it nullable is the honest fix: the Razorpay columns are
-- simply empty for payments Razorpay never handled.

alter table public.payments alter column "razorpayOrderId" drop not null;

comment on column public.payments."razorpayOrderId" is
  'Null for payments collected outside Razorpay — an admin granting an entitlement after taking payment directly. All three razorpay* columns are null together in that case.';
