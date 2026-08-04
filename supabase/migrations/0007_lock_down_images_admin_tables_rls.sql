-- Boliwala.com — Sprint 2.7: close the three remaining RLS-disabled tables
-- flagged (not fixed) at the end of Sprint 2.1. All three still carry
-- Postgres's default blanket grant (SELECT/INSERT/UPDATE/DELETE) for
-- anon/authenticated with RLS off — meaning right now anyone with the anon
-- key can deface listing photos, fabricate admin_audit_log entries, or
-- tamper with bulk_upload_batches. None of this was exploited by app code
-- (nothing reads/writes these tables yet), but the hole is live.

-- ---------------------------------------------------------------------------
-- listing_images — public read (only for live listings, matching the same
-- visibility boundary as listings itself), no client writes. Uploads happen
-- through the admin/bulk-upload backend (Sprint 3+), service-role only.
-- ---------------------------------------------------------------------------

alter table public.listing_images enable row level security;

create policy public_read_listing_images on public.listing_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images."listingId" and l.status = 'live'
    )
  );

-- ---------------------------------------------------------------------------
-- bulk_upload_batches, admin_audit_log — pure admin-internal tables, no
-- legitimate client access ever. RLS on, zero policies: deny-all for
-- anon/authenticated regardless of the table-level grant. The future admin
-- backend reads/writes these via the service-role client, same pattern as
-- listing_views.
-- ---------------------------------------------------------------------------

alter table public.bulk_upload_batches enable row level security;
alter table public.admin_audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- _prisma_migrations — vestigial from before Prisma was dropped (see main
-- MEMORY.md §1), but still live with the same default blanket grant and RLS
-- disabled. Nothing reads/writes it anymore; lock it down rather than drop
-- it, since deleting isn't necessary to close the hole.
-- ---------------------------------------------------------------------------

alter table public._prisma_migrations enable row level security;

-- ---------------------------------------------------------------------------
-- handle_new_user (0002) and increment_listing_view_count (0006) are
-- trigger-only functions — SECURITY DEFINER without an explicit EXECUTE
-- revoke means anon/authenticated could call them directly via
-- /rest/v1/rpc/<name>, outside their trigger context (caught by Supabase's
-- own advisor). Revoking direct EXECUTE doesn't affect the triggers
-- themselves — trigger firing goes through table/function ownership, not
-- the caller's EXECUTE grant — verified signup and view-count tracking
-- still work after this revoke. unlock_field_group is deliberately exempt:
-- it's designed to be called directly by authenticated users.
-- ---------------------------------------------------------------------------

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.increment_listing_view_count() from public, anon, authenticated;
