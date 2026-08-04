# BOLIWALA.COM — PROJECT MEMORY & HANDOFF

**Purpose:** single source of truth for project state across sessions. If a
context window fills up, open a new session and point it at this file first.

> **Read order for a fresh session:**
> 1. This file (state, gotchas, next action)
> 2. `CLAUDE.md` (behavioural rules — surgical changes, verify everything)
> 3. `boliwala_features.txt` (the real Product Feature List / URD v2.0 — this
>    is the actual scope document, supersedes guesses in the old sprint plan)
> 4. `plans/boliwala-phase1-sprint-plan.md` (master plan — **includes Sprint
>    2.1 and Sprint 2.5, both deferred**, see §4 below)

**Last updated:** 2026-08-04. Auth/signup-credit/alerts work is committed and
pushed (`0b51a5f`). **Sprint 2.1 is now fully built and verified this
session (see §8) — deliberately uncommitted**, same as before: the user
reviews locally first. If you're picking this up fresh: read §8 first (what
actually got built, what was found, what's still open), then §6 only if you
want the original plan for context — §8 supersedes it where they differ.

---

## 1. Quick answers (asked at handoff)

**Is Supabase integrated?** Yes, essentially the whole app now (Sprint 2.1
finished this session). Wired: `@supabase/supabase-js` + `@supabase/ssr`
clients, real email/password auth, signup → profile-row → 5-free-credits,
homepage alerts, profile session/credits/name/phone, **real `/search`**
(live listings/banks, URL-driven filters, real pagination/counts), **real
`/listing/[slug]`** (replaced the static `/listing` mockup — old route now
redirects to `/search`), the full four-state access-gating flow
(guest/member-no-credits/member-with-credits/subscriber) driven by
`lib/access/*` end-to-end, **credit spend/unlock** (via a new
`unlock_field_group` SECURITY DEFINER RPC, see §8.2), **shortlist add/remove**
(search cards, listing page, and profile's Saved Properties tab, all real),
and **view-count tracking** (deduped, trigger-incremented). **Not wired:**
Google OAuth (Sprint 2.5, deferred, unchanged), payments/admin/Channel
Partner build-out (Sprint 3+). Prisma stays dropped — no ORM, direct
`@supabase/supabase-js`.

**Migrations, since there's no ORM?** `supabase/migrations/*.sql` +
`node scripts/apply-sql.mjs <file>` (uses `pg` against `DIRECT_URL`, added
this session as devDependencies). Simple query protocol, whole file in one
`client.query()` call — no manual statement-splitting needed, unlike the old
`prisma/apply-policies.ts`. **The Supabase MCP server is now added and
authenticated** (see gotcha #6 in §5, "Gotchas") — prefer it over this script
for new work once a fresh session confirms its tools are loaded;
`apply-sql.mjs` stays as a working fallback either way.

**How many phases, and what's our status?** Same as before — only
`plans/boliwala-phase1-sprint-plan.md` exists (Sprints 0–5), plus two new
deferred sub-sprints added this session: **2.1** (search/listing page
rebuild) and **2.5** (Google OAuth). See §4.

**Current status, one line:** Sprint 2.1 is done — auth, credits, search,
listing pages, shortlist, unlock/credit-spend, and view tracking are all
real and verified end-to-end against the live DB (see §8 for the full
verification record). Next up: Sprint 2.5 (Google OAuth, still blocked on
client credentials) or Sprint 3 (Payments & Admin Core), per the sequencing
in §4.

---

## 2. Where things are

| | |
|---|---|
| Project root | `C:\Users\hrida\Documents\AA A\boliwala` |
| App | `project/` — Next.js 16 (Turbopack), React 19, TypeScript, Tailwind v4, pnpm |
| Real feature spec | `project/boliwala_features.txt` — Product Feature List / URD v2.0 |
| Sprint plan | `plans/boliwala-phase1-sprint-plan.md` — includes Sprint 2.1 and 2.5 addenda now |
| Supabase clients | `project/lib/supabase/client.ts` (browser), `project/lib/supabase/server.ts` (SSR, cookie-based) |
| Access-gating layer | `project/lib/access/{types,resolve,redact,index}.ts` — ported from the pre-reset backup, unused until Sprint 2.1 wires a real listing page into it |
| Viewer resolver | `project/lib/auth/viewer.ts` — real Supabase session + credit balance, server-only |
| DB migrations | `project/supabase/migrations/*.sql`, run via `node scripts/apply-sql.mjs <file>` |
| GitHub | `github.com/boliwaladevs/boliwala`, branch `main`, public, branch-protected |
| Supabase project ref | `rimyttphaidvlytefvil` (ap-south-1) — schema/RLS live, now also has a working `on_auth_user_created` trigger and a `profiles → auth.users` FK (added this session) |
| Secrets | `project/.env.local` — gitignored, now has a **populated `SUPABASE_SERVICE_ROLE_KEY`** (was empty at last handoff — the user filled it in, unblocking everything server-side this session) |

---

## 3. What's built and working (verified this session)

**Real, tested against the live Supabase project, throwaway test users
created and cleaned up each time:**

- `handle_new_user` trigger on `auth.users` (migrations `0002`, `0004`):
  creates the `profiles` row (id, email, `fullName` from signup metadata),
  reads `free_signup_credits` from `settings`, grants it, writes the
  `credit_transactions` ledger row (`reason: signup_grant`). Verified via
  both the Admin API and the real client-facing `/auth/v1/signup` endpoint —
  the exact call `components/auth-view.tsx` makes.
- `profiles.id → auth.users.id` FK with `ON DELETE CASCADE` (migration
  `0003`) — found missing while testing (deleting a user left an orphaned
  profile + ledger row); now cascades correctly, verified.
- `alert_subscriptions`: added a missing `SELECT` policy scoped to
  `userId = auth.uid()` (it was insert-only before — a signed-in user's own
  "My Alerts" tab could never read back what they'd saved) and tightened the
  `INSERT` check so an authenticated client can't write someone else's
  `userId` (migration `0002`).
- `components/auth-view.tsx`: real `signUp`/`signInWithPassword`/
  `resetPasswordForEmail`, loading states, toasts (added a global `<Toaster
  />` to `app/layout.tsx` — shadcn's toaster existed but wasn't mounted
  anywhere). Google button kept visually present (matches shipped design)
  but disabled — Sprint 2.5.
- New `/reset-password` route + `components/reset-password-view.tsx` for the
  password-reset email link's landing page.
- `app/profile/page.tsx`: now a server component, redirects to `/login` if
  no session, fetches the real profile row, passes it to `ProfileView`.
- `components/profile-view.tsx`: real name/email/credit-balance/member-since
  in the sidebar, real sign-out, "Account Info" tab's Full Name + Phone
  fields save to `profiles` for real. City/PAN/Aadhaar fields left inert
  (no matching DB columns — the shipped mock UI has fields the schema
  doesn't support; didn't add columns speculatively). Saved
  Properties/Alerts/Services tabs **untouched** — still the original mock
  cards, deliberately, since they need real listing data that doesn't exist
  until Sprint 2.1.
- `components/alerts-section.tsx` (homepage): real insert into
  `alert_subscriptions`, works for guests and signed-in users alike, no
  listing dependency — this was the one alert/save-type form in the app that
  wasn't blocked by the search/listing mockup problem.

**Verification performed:** `tsc --noEmit` (only the 3 pre-existing,
unrelated ref-type errors in `call-to-action.tsx`/`hero.tsx`/`projects.tsx`
remain — not touched this session), `pnpm build` (all 15 routes compile,
`/profile` correctly switched from static to dynamic since it now does a
server-side session check), dev server smoke test (all changed routes
200), and a full real signup through the actual public `/auth/v1/signup`
endpoint with `full_name` metadata — profile + 5-credit ledger row created
correctly, then cleaned up.

**Deliberately not touched — still exactly as handed off:**
Shortlist add/remove, credit spend/unlock flow, search filters/pagination,
`/listing` (still not `/listing/[slug]`), admin backend, payments, Channel
Partner portal build-out. See §4.

---

## 4. Sprint plan status

`plans/boliwala-phase1-sprint-plan.md` has two sub-sprints added in an
earlier session:

- **Sprint 2.1 — Search & Listing Page Rebuild. DONE this session, see §8.**
  `property-results.tsx` and `listing-view.tsx` were pure client mockups
  with zero data-fetching; both are now real, along with everything else in
  the URD's Sprint 2.1 scope (shortlist, unlock, view tracking).
- **Sprint 2.5 — Google OAuth.** Still not started. No `GOOGLE_CLIENT_ID`/
  `SECRET` in `.env.local`, Q4 from the old plan never answered. Button is
  UI-present, disabled. Next up per the user's sequencing.

**Sequencing confirmed with the user:** Sprint 2.1 (done) → Sprint 2.5 →
Sprint 3 onward.

---

## 5. Gotchas

1. **`gh` active account drifts back to `hkforprojects`.** Fix: `gh auth
   switch --user boliwaladevs` before pushing.
2. **DB passwords need percent-encoding** (`@` → `%40`) — applies to both
   `DATABASE_URL` and `DIRECT_URL`.
3. **RLS/GRANTs are live and correctly scoped** — verified fresh this
   session, not just assumed: `SELECT *` on `listings` with the anon key
   correctly 401s (column-level GRANTs blocking gated columns), selecting
   only public columns works and returns real seed data (12 live listings, 6
   banks, all 7 settings rows). Every per-user table correctly returns `[]`
   for an unauthenticated request.
4. **`profiles`/`credit_transactions` have no client INSERT policy, by
   design** — credits must never be client-writable. The gap this created
   (nothing was creating the profile row) is now closed by the
   `handle_new_user` trigger, not by loosening RLS.
5. **`.env.local` lives at `project/.env.local`**, gitignored via `.env*`.
   `SUPABASE_SERVICE_ROLE_KEY` is now populated (was the session's hard
   blocker until the user filled it in). There's also a
   `SUPABASE_ANON_PUBLIC_KEY` var the user added alongside the existing
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — not currently referenced by any
   app code; the app uses the `NEXT_PUBLIC_*`-prefixed one (required for
   client-side use in Next.js). Worth asking the user if that second key is
   meant to replace something before it goes stale.
6. **Supabase MCP server — added and authenticated** (user confirmed
   2026-08-04, done in a separate regular terminal via `claude /mcp` while
   this session kept working). Config lives at `boliwala/.mcp.json` (project
   scope, sibling to `project/` — **not inside the git repo**, same as
   `plans/`), confirmed on disk:
   `{"mcpServers":{"supabase":{"type":"http","url":"https://mcp.supabase.com/mcp?project_ref=rimyttphaidvlytefvil&features=..."}}}`.
   **Caveat for whoever reads this next:** MCP servers connect at session
   start — *this* session was already running before authentication
   happened, so its tool list doesn't include the Supabase MCP tools
   (checked, none loaded). A **fresh session** should have them available
   immediately; if not, re-run `claude /mcp` and check the connection status
   there. Once available, prefer it over `scripts/apply-sql.mjs` for new
   migrations/DB inspection per the earlier note in §1.
7. **Test-user hygiene:** all throwaway accounts created while verifying the
   signup trigger this session were deleted via the Admin API afterward — no
   test data left in the live DB. If you create more, same rule.

---

## 6. Sprint 2.1 — execution-ready plan for the next session

Everything below was verified live this session (queried the real DB with
the anon key) so the next agent doesn't have to re-derive it. **Don't commit
until the user says so** — they're reviewing locally first, and want Sprint
2.5's handoff drafted too before it goes in (see §6.6).

### 6.1 The two files being replaced, and exactly what's wrong with them

- **`components/property-results.tsx`** (366 lines, search results) — a
  hardcoded `Property[]` array of 6 fake listings. Filters (property type,
  bank, price, possession, auction date) are checkbox/radio UI with **no
  state, no handlers** — they don't filter anything. The "247 properties"
  count and per-bank counts (`Bank of Baroda: 18`, `SBI: 312`...) are literal
  strings. Pagination buttons (1, 2, 3, ..., 21) don't paginate. Every card
  links to the single static `/listing` route, not a per-property one.
- **`components/listing-view.tsx`** (451 lines, individual listing page) —
  even more hardcoded: property details, auction info, legal status, and
  "Inspection & Bank Contact" are typed directly into JSX (`"Flat No. 303,
  Vithai Apartment, Airoli, Navi Mumbai"`, `"₹60,12,000"`, etc.), not even in
  a data object. The gated section already has the right *shape* (blurred
  preview + "Sign up to view" CTA) — that's good, it means the visual design
  for the four access states doesn't need reinventing, just needs to be
  driven by `lib/access/redact.ts`'s `GateDecision` instead of hardcoded
  blur classes. Three "Similar Auctions" cards at the bottom are also
  hardcoded.

### 6.2 What's already built and ready to consume — don't rebuild these

- `lib/access/{types,resolve,redact,index}.ts` — the gating logic
  (`resolveListingAccess`, `redactListing`, the four `AccessState`s). Ported
  verbatim from the pre-reset backup, typechecks clean, **unit-tested by
  hand this session is not done** — no test runner exists in this codebase
  (client shipped none; adding one is your call, wasn't done previously
  either). Verify via the guest-source leak test instead (§6.4).
- `lib/auth/viewer.ts` — `getViewer(listingId?)`, real Supabase session +
  credit balance + per-listing `unlockedGroups`. Call this from the listing
  page server component to get the `Viewer` to pass into
  `resolveListingAccess()`.
- `lib/data/types.ts` — `Listing`/`Bank` types matching the DB's actual
  camelCase columns (Prisma created real camelCase Postgres columns, not
  snake_case — confirmed by querying the live table directly).
- `lib/supabase/{client,server}.ts` — browser/SSR clients, already used
  elsewhere (auth-view, profile-view).

### 6.3 Real data already live — use it, don't re-seed

Queried directly this session:

- **6 banks**, real names: State Bank of India (SBI), Punjab National Bank
  (PNB), Bank of Baroda (BoB), Canara Bank, Union Bank of India, IDBI Bank.
  The current sidebar hardcodes 5 different fake banks with fake counts —
  replace both the list and the counts with a real query against `banks` +
  an aggregate count of live `listings` per bank.
- **12 live listings**, spread across residential/commercial/industrial/
  agricultural/mixed_use, real cities (Pune, Lucknow, Jaipur, Coimbatore,
  Hyderabad, Mumbai, Nagpur, Chennai, Surat, Bengaluru, Ahmedabad), real
  `slug`s already populated (e.g. `industrial-warehouse-chakan-pune-union`,
  `2bhk-flat-kharghar-navi-mumbai-sbi`) — enough to build and manually test
  `/listing/[slug]` against real rows immediately, no seeding step needed.
  Public columns (`addressLine`, `reservePrice`, `emdAmount`, `auctionDate`,
  etc.) are readable by anon; gated columns (`flatNumber`,
  `authorisedOfficerPhone`, etc.) 401 for anon/authenticated without the
  right access state — exactly the security boundary §6.4 tests.
- **All 7 settings rows** populated (`free_signup_credits: 5`,
  `annual_price: 999`, `credit_cost_flat_floor: 1`, etc.) — read these for
  `PricingSettings`, never hardcode.

### 6.4 Schema gap found this session — decide before building the details table

`listing-view.tsx`'s "Auction Information" table shows **Auction Time**
(separate from date), **Mode** ("Online e-Auction"), **Bid Increase Amount**,
and **Total Outstanding Dues** — none of these exist as columns on
`listings` in `schema.prisma` (which is otherwise still an accurate map of
the live table). Two options, pick one and note the decision here:
(a) drop these fields from the rebuilt page since they're presentational
invention with nothing behind them, or (b) add the columns via a new
`supabase/migrations/000X_*.sql` (same pattern as this session's migrations,
run with `node scripts/apply-sql.mjs <file>`) if the client actually wants
them. Don't silently fabricate values for them.

### 6.5 Build order (each step should be independently verifiable)

1. **`/search` → real data.** Convert `property-results.tsx` (or a new
   server component it delegates to) to query `listings` server-side:
   public columns only, `status = 'live'`, joined to `banks` (PostgREST
   embed: `select=*,bank:banks(*)`). Wire the existing filter UI to actual
   query params (URL-driven, per the old plan's Sprint 1 note — keeps it
   shareable/SEO-friendly and matches how `keyword`/`q` splitting was done
   in Sprint 1.5). Real pagination. Real per-bank/per-city counts — decide
   whether that's N small `count=exact` queries or one aggregate query/RPC;
   either is fine, just don't hardcode.
   → verify: all filter combinations return correct counts against the 12
   live rows; no gated columns appear in the response (check Network tab —
   the query must never select them for a search-card view).
2. **`/listing/[slug]` route.** New dynamic route, server component. Fetch
   the listing by slug (public columns), call `getViewer(listing.id)`, then
   `resolveListingAccess(viewer, settings)`, then `redactListing(listing,
   access)`. Render the `SafeListing` — gated sections render via
   `decision.visible`/`decision.action`, reusing the existing blurred-preview
   visual pattern already in `listing-view.tsx`, just data-driven now.
   Retire the static `/listing` route (redirect to `/search`, or delete it —
   your call, note which).
   → verify: **guest-source leak test** (old plan §3, repeat it here) — view
   a live listing signed out, check page source contains zero gated values
   (`flatNumber`, `authorisedOfficerPhone`, etc. must not appear in the HTML
   at all, not even hidden/blurred via CSS). Then check the four access
   states render correctly by testing as guest / a fresh signup (5 credits,
   `member_with_credits`) / a user with 0 credits / a subscriber (you may
   need to manually insert a test `subscriptions` row for the last one,
   clean it up after).
3. **View-count tracking.** Insert into `listing_views` on each listing page
   load (dedupe by session/IP within some window — the old schema has
   `sessionId`/`ipHash` columns for exactly this). Increment
   `listings.viewCount` — check whether that's a trigger or an app-level
   update; there's no trigger for it yet, so either add one (consistent with
   this session's `handle_new_user` pattern) or do it in the same request.
   → verify: view an listing twice quickly, count increments once (dedupe
   works); view again after the window, increments again.
4. **Shortlist add/remove**, now that real listing IDs exist — wire the
   `Bookmark`/"Save" buttons in both the search cards and the listing page
   to `shortlists` (RLS already supports full CRUD for
   `userId = auth.uid()`, confirmed working last session, no migration
   needed). Also revisit `profile-view.tsx`'s "Saved Properties" tab (still
   the original mock cards, deliberately left alone last session) — wire it
   to a real `shortlists` query now that there's real data to show.
   → verify: save/unsave round-trips, persists across reload, shows up in
   the profile tab.
5. **Credit spend/unlock flow** — the "Sign Up Free to Unlock" / "Unlock for
   1 credit" buttons need a server action: check balance, insert into
   `unlocks`, insert a `credit_transactions` ledger row (`reason: unlock`,
   negative delta), all atomically. Remember: `unlocks` and
   `credit_transactions` have **no client INSERT policy** (by design, same
   as signup credits) — this has to go through a server-side path using
   `SUPABASE_SERVICE_ROLE_KEY` (there's no admin client file yet — add
   `lib/supabase/admin.ts`, service-role, server-only, never imported from a
   client component) or a `SECURITY DEFINER` Postgres function callable via
   RPC that enforces the balance check itself (arguably safer — keeps the
   "never charge twice" `UNIQUE(userId, listingId, fieldGroup)` constraint
   and the balance check atomic in the DB rather than split across an app
   request). Pick one, it's a real design decision, not a detail.
   → verify: unlock spends exactly 1 credit, re-visiting the same listing
   doesn't charge again (idempotent), balance shown in profile updates,
   can't go negative.
6. **Full regression**, same bar as Sprint 1.5 used: typecheck, `pnpm build`,
   guest leak test, all filter combinations, view counter dedupe, all four
   access states, shortlist round-trip, unlock idempotency.

### 6.6 Sprint 2.5 (Google OAuth) — handoff design, not execution

Scope is already written in `plans/boliwala-phase1-sprint-plan.md`'s Sprint
2.5 section (blocked on the client supplying Google OAuth credentials — still
true, nothing changed there this session). Nothing to add here beyond what's
already in that file; the user asked for its "handoff designed" alongside
2.1's, and the plan doc already is that — a fresh agent picking up 2.5 later
should read that section directly, no separate prep needed.

### 6.7 After 2.1

Sprint 3 onward (Payments & Admin Core), re-checked against
`boliwala_features.txt` per §4's reconciliation note — unchanged from
earlier handoffs.

---

## 7. Open questions for the client

Unchanged from last handoff, still open:

- Definitive bank list — mechanism is now real (§8: real `banks` table,
  live per-bank counts on `/search`), but only 6 banks are seeded (SBI, PNB,
  BoB, Canara, Union, IDBI). Old prototype said 18+ in one place, 40+ in
  two others — confirm whether more banks get added before launch.
- Real Indian contact number (a US placeholder number appears in the
  client's actual code)
- Channel Partner login — `boliwala_features.txt` §2.6 says "no partner
  portal or directory at launch," but `app/partner/dashboard` exists in the
  real source as a built page — confirm in/out of scope for launch
- Razorpay activation status
- Google OAuth — required at launch, or fast-follow? (Sprint 2.5)
- Housekeeping: rotate the Supabase DB password (was pasted in a chat
  transcript during the original build)

---

## 8. Sprint 2.1 — completion record (2026-08-04)

Executed end-to-end this session, following §6's build order. Everything
below was verified live against the real Supabase project with throwaway
test users, created and cleaned up each time (checked at the end — zero
leftover test rows). **Not committed** — same as every session, the user
reviews locally first.

### 8.1 Two security bugs found and fixed, outside the original plan

Neither was in scope going in — both surfaced while building the pieces
that touch the same tables/columns, and both were live/exploitable before
this session's fix:

1. **`profiles.creditsBalance` and `profiles.role` were directly
   client-writable.** `own_profile_update`'s RLS policy only checks
   `id = auth.uid()`, no column restriction, and `authenticated` held the
   default Supabase blanket table-level `UPDATE` grant. Any signed-in user
   could `PATCH /rest/v1/profiles` their own `creditsBalance` to anything,
   or set `role: 'admin'`. Fix (migration `0005`): revoke the table-level
   grant entirely, re-grant `UPDATE` on only `fullName`/`phone` (the two
   columns `profile-view.tsx` actually writes) to `authenticated`. A
   column-level revoke alone does **not** work here — the table-level grant
   dominates it; had to revoke table-level and re-grant column-level.
   Verified: real attack attempt (`PATCH` with `creditsBalance: 999999` and
   `role: 'admin'`) now 403s; the legitimate fullName/phone save still 200s.
2. **`listing_views` had RLS disabled entirely** — anon key could read,
   write, or delete any row, including other users' `userId`/`ipHash`.
   Fixed in the same migration: `ENABLE ROW LEVEL SECURITY`, no client
   policies at all — every write goes through the service-role admin client
   (`lib/supabase/admin.ts`, new this session), same pattern as
   `credit_transactions`/`unlocks`.

Two other tables still have RLS disabled — `listing_images` and
`bulk_upload_batches`/`admin_audit_log` — **not fixed**, nothing in Sprint
2.1 touches them, flagged for whoever picks up admin/bulk-upload work.

### 8.2 Migrations added

- `0005_listing_auction_fields_unlock_rpc_and_profile_grant_fix.sql` — the
  profiles grant fix above; four new `listings` columns (`auctionTime`,
  `mode`, `bidIncreaseAmount`, `totalOutstandingDues` — the §6.4 schema
  gap, resolved as "add columns," not "drop fields"); a
  `UNIQUE("userId","listingId","fieldGroup")` constraint on `unlocks` (did
  **not** already exist despite §6.5's step 5 assuming it did — added it);
  `listing_views` RLS enable; and the `unlock_field_group(uuid, "FieldGroup")`
  SECURITY DEFINER RPC — atomic balance-check + charge, idempotent (a
  second call for an already-unlocked group returns the existing unlock
  instead of charging again; a `unique_violation` race on concurrent calls
  is caught and treated the same way), free for active subscribers.
  Verified: charges exactly once, ledger correct, idempotent on repeat and
  on reload, balance floor enforced (`insufficient_credits`).
- `0006_listing_view_count_trigger.sql` — `increment_listing_view_count()`
  trigger on `listing_views` insert, atomic (avoids a read-then-write race
  on concurrent views), same pattern as `handle_new_user`.

### 8.3 New files

- `lib/supabase/admin.ts` — service-role client, server-only. Needed
  because **gated listing columns have no SELECT grant for
  anon/authenticated at all**, by design (confirmed live) — so even
  server-side code running as the visitor's own session can't read
  `flatNumber`/`authorisedOfficerPhone`/etc. to compute the redaction.
  `getListingBySlug` uses this; `resolveListingAccess`/`redactListing`
  still do the actual gating in app code exactly as `lib/access/redact.ts`
  already documented — the admin client just gets the full row to redact,
  same category of exception as `unlock_field_group`.
- `lib/data/listings.ts` — `searchListings`, `getBanksWithCounts`,
  `getListingBySlug`, `getSimilarListings`, `getShortlistedListings`. Search
  functions select an explicit public-only column allowlist (never the
  gated ones) even though they use the ordinary client — defense in depth,
  matches the existing allowlist philosophy in `redact.ts`.
- `lib/data/views.ts` — `recordListingView`, IP-hash-based dedupe (30 min
  window), admin client.
- `lib/access/settings.ts` — `getPricingSettings()`, live from `settings`.
- `lib/search-url.ts` — URL-param helpers so every filter/pagination link
  in `/search` is a plain server-rendered `<Link>`, no client JS needed
  except the sort dropdown and the grid/list toggle.
- `lib/format.ts` — `formatINR`/`formatDateShort`/`formatDateLong`
  (`en-IN` locale — real lakh/crore grouping).
- `app/actions/shortlist.ts`, `app/actions/unlock.ts` — server actions.
- `app/listing/[slug]/page.tsx` — new dynamic route. `app/listing/page.tsx`
  now just `redirect("/search")`.

### 8.4 Verification performed (all against the live 12 listings / 6 banks)

- `tsc --noEmit` and `pnpm build` clean (only the 3 pre-existing unrelated
  ref-type errors remain, untouched).
- **Guest-source leak test**: raw HTML for a live listing, signed out —
  zero occurrences of any gated field name or value.
- **All four access states**, real accounts: guest (3 "Sign up to view"),
  member-with-credits (unlock charges 1 credit, persists across reload, no
  double charge), member-no-credits (balance forced to 0 → "Upgrade" CTAs),
  subscriber (real `subscriptions` row → everything visible, zero charge).
- **Search filters**: location, keyword, property type, possession, bank
  (multi-select), price range, sort, pagination — each verified against
  real counts (e.g. Pune → 2, industrial → 2, bank counts sum to 12).
  Real browser test (Playwright) for the sort dropdown and price-range
  form, not just curl.
- **View-count dedupe**: 3 rapid requests → 1 row, +1 count; backdating
  past the 30-min window → new row, +1 count again.
- **Shortlist round-trip**: save on listing page → appears on profile →
  remove from profile → gone, DB confirms 0 rows.
- Old `/listing` → 307 to `/search`; bad slug → 404.

### 8.5 Deliberately left alone

The "Get email alerts for this search" banner on `/search` is still
non-functional (same as the mockup) — wiring it to `alert_subscriptions`
wasn't in §6.5's build order and would mean inventing the filter-to-JSON
mapping; flagging it rather than guessing. The `alert_subscriptions.filters`
column exists and `alerts-section.tsx` already shows the insert pattern, so
it's a small follow-up whenever it's wanted. WhatsApp button number is
unchanged (already an open question in §7). Alerts/Services tabs on
`/profile` are still mock — only "Saved Properties" was in scope.
