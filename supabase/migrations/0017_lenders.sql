-- Boliwala.com — W4.1: banks become lenders.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0017_lenders.sql
--
-- SARFAESI auctions are not run only by banks. NBFCs, asset reconstruction
-- companies and housing finance companies all sell under the same act, and the
-- inventory the client is preparing will contain them. The schema currently
-- says "bank" everywhere, which would force every non-bank seller to be filed
-- under a name that is simply wrong.
--
-- Done now, at 12 listings and 6 lenders. The same rename against 50,000 rows
-- with images and documents hanging off them is a different job.
--
-- Renames, not copies: `alter table ... rename` preserves the primary key, the
-- foreign key, every index, both RLS policies and — importantly — the
-- column-level SELECT grant that 0016 documents, because grants follow the
-- column through a rename.

alter table public.banks rename to lenders;
alter table public.listings rename column "bankId" to "lenderId";

-- The constraint and policy names still say "bank" after the rename; Postgres
-- does not touch them. Rename them too, so nothing in the schema reads as a
-- leftover.
alter table public.lenders rename constraint banks_pkey to lenders_pkey;
alter table public.listings rename constraint "listings_bankId_fkey" to "listings_lenderId_fkey";
alter policy banks_public_read on public.lenders rename to lenders_public_read;

-- ---------------------------------------------------------------------------
-- What kind of lender it is. Named in the same PascalCase-quoted style as the
-- other enums in this schema.
--
-- The default is 'bank' rather than nothing, which also backfills the six
-- existing rows in place: every lender on the platform today genuinely is a
-- bank, and most of the inventory will be too.
-- ---------------------------------------------------------------------------

create type "LenderType" as enum ('bank', 'nbfc', 'arc', 'hfc');

alter table public.lenders add column "lenderType" "LenderType" not null default 'bank';

comment on table public.lenders is
  'Sellers under SARFAESI: banks, NBFCs, ARCs and housing finance companies. Renamed from "banks" in 0017 — the platform is not bank-only.';

-- Search filters by type, so index it. Six rows today; this is for the 50k case.
create index lenders_type_idx on public.lenders ("lenderType");

-- No temporary `banks` view is created. immediate_plan.md W4.1 offers one as a
-- bridge if something still depends on the old name mid-migration; nothing
-- does, because the application code lands in the same commit range and the
-- admin panel is the only writer.
