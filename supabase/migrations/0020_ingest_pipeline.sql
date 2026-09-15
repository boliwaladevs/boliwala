-- Boliwala.com — W-INGEST: schema for the Maharashtra bulk ingest pipeline.
--
-- Apply with: node scripts/apply-sql.mjs supabase/migrations/0020_ingest_pipeline.sql
--
-- The site is built and blocked on inventory: 22 listings against a competitor
-- indexing ~96k. This migration is everything the database needs before a
-- ~10,000-row Maharashtra import can land — provenance, an idempotency key,
-- re-auction round tracking, district filtering, a bucket for notice PDFs, and
-- the indexes without which the existing search collapses at that row count.
--
-- ---------------------------------------------------------------------------
-- THE GRANT RULE THIS MIGRATION MUST NOT BREAK
-- ---------------------------------------------------------------------------
--
-- public.listings does NOT carry a table-level SELECT grant. anon and
-- authenticated hold SELECT on a hand-maintained list of named columns (see
-- 0016's preamble, and 0005 for the add-column-then-grant pattern). That column
-- list is the credit gate enforced at the database, underneath the
-- application's own redaction in lib/access/redact.ts.
--
-- The consequence for every column added below: **a new column is invisible to
-- the public site until it is named in a `grant select (...)`**, and it fails
-- silently — PostgREST returns "permission denied for table listings" for the
-- whole row, not a null for the one column. So each column here is classified
-- deliberately, and the private ones are listed in a comment rather than simply
-- omitted, so a later reader can tell the difference between "private on
-- purpose" and "forgotten".

-- ---------------------------------------------------------------------------
-- 1. Public columns — granted to anon and authenticated.
-- ---------------------------------------------------------------------------
--
-- district              Maharashtra needs district-level filtering. Navi Mumbai
--                       is not a district: it straddles Thane (Airoli, Vashi,
--                       Nerul, Belapur) and Raigad (Kharghar, Kamothe, Panvel,
--                       Ulwe). Free-text `city` cannot express that, which is
--                       the specific thing the competitor gets wrong.
-- auctionRoundNo        Which round this is. Defaults to 1.
-- previousReservePrice  The prior round's reserve, carried forward by the
--                       loader. Together these two power "4th round, 13% below
--                       the first" — the badge the competitor paywalls.
-- noticePdfPath         Storage key inside the listing-docs bucket. Distinct
--                       from "noticeUrl", which is the external source link:
--                       under the 1 GB free-tier cap only priority districts
--                       get a mirrored copy, and the rest keep the link alone.
-- sourcePortal          "BAANKNET", "IBAPI", … — shown as a provenance label.
-- lastVerifiedAt        When this row was last confirmed against its source.
--                       Every competitor claims "100% verified"; a real
--                       timestamp is the only version of that claim that can be
--                       substantiated, so it is public on purpose.

alter table public.listings
  add column if not exists district text,
  add column if not exists "auctionRoundNo" integer not null default 1,
  add column if not exists "previousReservePrice" numeric,
  add column if not exists "noticePdfPath" text,
  add column if not exists "sourcePortal" text,
  add column if not exists "lastVerifiedAt" timestamptz;

grant select (district, "auctionRoundNo", "previousReservePrice", "noticePdfPath", "sourcePortal", "lastVerifiedAt")
  on public.listings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Private columns — deliberately NOT granted.
-- ---------------------------------------------------------------------------
--
-- These are readable only by the service-role client, exactly like the eight
-- gated columns ("flatNumber", floor, inspection*, authorisedOfficer*,
-- "bankContact") and "createdBy". There is no `grant select` for them below and
-- that is not an oversight.
--
-- sourceUrl             The deep link back to the portal record. Internal: it
--                       is the map to our own sources.
-- sourceRef             The notice reference number as printed.
-- dedupeHash            The idempotency key. See section 3.
-- extractionConfidence  Lowest per-field confidence from the LLM extraction
--                       step, 0..1. Drives the auto-publish gate.
-- qcStatus              auto | needs_review | approved | rejected
-- ingestedAt            When the pipeline first created this row.

alter table public.listings
  add column if not exists "sourceUrl" text,
  add column if not exists "sourceRef" text,
  add column if not exists "dedupeHash" text,
  add column if not exists "extractionConfidence" numeric,
  add column if not exists "qcStatus" text,
  add column if not exists "ingestedAt" timestamptz;

alter table public.listings
  drop constraint if exists listings_qc_status_check;
alter table public.listings
  add constraint listings_qc_status_check
  check ("qcStatus" is null or "qcStatus" in ('auto', 'needs_review', 'approved', 'rejected'));

-- ---------------------------------------------------------------------------
-- 3. The idempotency key.
-- ---------------------------------------------------------------------------
--
-- dedupeHash is sha256 over normalised(lender name | address line | pincode |
-- area), computed in scripts/ingest/lib/dedupe.mjs. It deliberately EXCLUDES
-- the auction date: a re-auction of the same property must collide with the
-- existing row so the loader can bump "auctionRoundNo" and carry the old
-- reserve into "previousReservePrice", rather than inserting a near-duplicate.
-- That collision is the feature, not a problem to be worked around.
--
-- Total rather than partial, and that is load-bearing. Postgres treats NULLs as
-- distinct in a unique index, so the 22 pre-pipeline rows with no hash coexist
-- fine. A partial index (`where "dedupeHash" is not null`) would look tidier and
-- would break the loader: PostgREST emits `on conflict ("dedupeHash")`, and
-- Postgres cannot infer a *partial* index from that without the index predicate
-- repeated in the statement — which PostgREST has no way to express. The upsert
-- would fail with "no unique or exclusion constraint matching the ON CONFLICT
-- specification".

create unique index if not exists listings_dedupe_hash_key
  on public.listings ("dedupeHash");

-- ---------------------------------------------------------------------------
-- 4. Search indexes — the part that has to land BEFORE the bulk import.
-- ---------------------------------------------------------------------------
--
-- lib/data/listings.ts:116 runs
--   or(city.ilike.%x%, locality.ilike.%x%, state.ilike.%x%)
-- and :120 runs
--   or(title.ilike.%x%, addressLine.ilike.%x%)
--
-- A leading-wildcard ilike cannot use a btree index, so today both are
-- sequential scans. At 22 rows that is free. At 10,000 it is the page's whole
-- response time, and it degrades linearly as districts are added.
--
-- Trigram GIN indexes make a leading-wildcard ilike indexable. Postgres
-- BitmapOrs the separate per-column indexes for the or() above, so the existing
-- query code needs no rewrite — this is a pure storage-layer fix.
--
-- state is left unindexed on purpose: it is effectively a single value
-- ("Maharashtra") across the whole corpus, so a trigram index on it would be
-- scanned in full and buy nothing.

create extension if not exists pg_trgm;

create index if not exists listings_city_trgm     on public.listings using gin (city gin_trgm_ops);
create index if not exists listings_locality_trgm on public.listings using gin (locality gin_trgm_ops);
create index if not exists listings_title_trgm    on public.listings using gin (title gin_trgm_ops);
create index if not exists listings_address_trgm  on public.listings using gin ("addressLine" gin_trgm_ops);

-- Matches the shape of the existing listings_city_status_idx: every search is
-- filtered to status='live' first, so the facet column leads and status follows.
create index if not exists listings_district_status_idx on public.listings (district, status);

-- ---------------------------------------------------------------------------
-- 5. Storage bucket for sale-notice PDFs.
-- ---------------------------------------------------------------------------
--
-- Public read, no client write policy — all uploads go through the service-role
-- client from scripts/ingest/5-mirror-pdfs.mjs, the same pattern 0008 uses for
-- listing-images and every other admin write path.
--
-- PDFs are freely public by decision (MEMORY.md §D.3), so no signed URLs.
--
-- 10 MB rather than listing-images' 5 MB: scanned Marathi notices from the
-- co-operative banks run large, and a rejected upload at the end of an
-- overnight run is expensive to notice.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-docs', 'listing-docs', true, 10485760, array['application/pdf'])
on conflict (id) do nothing;
