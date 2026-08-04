-- Boliwala.com — Sprint 3: Storage bucket for listing photos. Public bucket
-- (photos aren't gated — matches the public SELECT policy already on the
-- listing_images metadata table, migration 0007). No client-side INSERT/
-- UPDATE/DELETE policy on storage.objects: all writes go through the
-- service-role client from admin server actions, same pattern as every
-- other admin-only write path this session.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
