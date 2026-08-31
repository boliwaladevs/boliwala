-- Boliwala.com — W2.1: the Contact Sales enquiry table.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0014_contact_sales_enquiries.sql
--
-- There is no payment integration and there will be none before launch
-- (Razorpay is deferred — deferred_plan.md D4). Every plan and every service
-- package is therefore sold by a person: the site captures an enquiry, an
-- admin works it, and an admin grants the entitlement by hand. This table is
-- that pipeline, and it is the only revenue event W6's commission engine will
-- have to attach to.
--
-- Deliberately separate from callback_requests. A callback is "phone me about
-- this listing"; this is "I want to buy a plan" — different lifecycle, different
-- follow-up, and mixing them would bury the sales pipeline inside a support
-- queue.

-- ---------------------------------------------------------------------------
-- Enums. Named in the PascalCase-quoted style the rest of the schema uses
-- (inherited from the Prisma era — see MEMORY.md §1), so a reader does not have
-- to learn two conventions.
-- ---------------------------------------------------------------------------

create type "SalesEnquiryPlan" as enum ('annual_subscription', 'service_package');
create type "SalesEnquiryStatus" as enum ('new', 'contacted', 'converted', 'closed');

create table public.contact_sales_enquiries (
  id            uuid primary key,
  name          text not null,
  email         text,
  phone         text not null,
  plan          "SalesEnquiryPlan" not null,
  message       text,
  status        "SalesEnquiryStatus" not null default 'new',
  notes         text,
  -- Which admin worked it. Nullable: an enquiry exists before anyone picks it
  -- up. ON DELETE SET NULL so removing a staff account never deletes the
  -- sales record with it.
  "handledBy"   uuid references public.profiles(id) on delete set null,
  "createdAt"   timestamp not null default current_timestamp,
  "updatedAt"   timestamp not null default current_timestamp
);

-- The admin list is "newest first", and the sidebar badge counts status = 'new'.
create index contact_sales_enquiries_created_idx on public.contact_sales_enquiries ("createdAt" desc);
create index contact_sales_enquiries_status_idx on public.contact_sales_enquiries (status);

-- ---------------------------------------------------------------------------
-- RLS. Insert-only for clients, exactly like callback_requests: a signed-out
-- visitor must be able to ask to buy something, and nobody outside the admin
-- panel has any business reading the sales pipeline.
--
-- Note this is stricter than immediate_plan.md W2.1 sketched. That asked for
-- SELECT/UPDATE policies for admin and superadmin; there is no such policy
-- anywhere in this schema, because the admin panel does not read through RLS —
-- it reads with the service-role client (lib/supabase/admin.ts), which bypasses
-- RLS entirely. Adding role-checking policies would grant real reach to the
-- anon key while changing nothing about how the panel works. Deny-all for
-- anon/authenticated is the same shape 0007 gave the other admin-internal
-- tables.
-- ---------------------------------------------------------------------------

alter table public.contact_sales_enquiries enable row level security;

create policy contact_sales_insert on public.contact_sales_enquiries
  for insert to anon, authenticated
  with check (true);

-- Table-level grants: the default blanket grant on a new public table hands
-- anon and authenticated everything, and RLS is then the only thing standing in
-- the way. Narrow it here rather than relying on that (W3 does this schema-wide).
revoke all on public.contact_sales_enquiries from anon, authenticated;
grant insert on public.contact_sales_enquiries to anon, authenticated;
