-- Boliwala.com — Sprint 2.1: atomic viewCount increment, same pattern as
-- handle_new_user. A trigger guarantees exactly one increment per
-- listing_views insert even under concurrent requests, avoiding a
-- read-then-write race in app code.

create or replace function public.increment_listing_view_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings set "viewCount" = "viewCount" + 1 where id = new."listingId";
  return new;
end;
$$;

drop trigger if exists on_listing_view_created on public.listing_views;
create trigger on_listing_view_created
  after insert on public.listing_views
  for each row execute procedure public.increment_listing_view_count();
