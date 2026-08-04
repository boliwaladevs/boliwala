-- profiles.id had no foreign key to auth.users at all (Prisma can't model
-- cross-schema references, so it was never created). Found while testing the
-- signup trigger from 0002: deleting a user via the Admin API left an
-- orphaned profiles row (and its credit_transactions rows, which already
-- cascade from profiles per schema.prisma). Adding the FK here closes that
-- gap for both tables in one place.

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;
