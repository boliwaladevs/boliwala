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

**Last updated:** 2026-08-05. Sprint 2.1 (`5f6f771`), Sprint 2.7 (`2ee35a1`),
Sprint 3 (`74ba69a`), and **Sprint 4 are all committed and pushed — see §11
for what Sprint 4 actually built**. **Next session picks up three blocked
items together: Sprint 2.5 (Google OAuth), Sprint 3.5 (Razorpay), and
Sprint 4.5 (Resend email + the C5 headline-stats sign-off) — all still
blocked on the user supplying something** (credentials for the first two,
content sign-off for the third). Check `.env.local` and with the user
before assuming any of the three are unblocked — there's no code to write
until then. If you're picking this up fresh: read §11 first (Sprint 4
completion record), then §10 (Sprint 3), §9 for the original
Sprint 3/3.5 split and why, §8 for Sprint 2.1 + 2.7.

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
   scope, sibling to `project/` — **not inside the git repo**), confirmed on
   disk:
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
8. **`plans/` moved inside the repo, 2026-08-08.** Previously a sibling of
   `project/`, outside git (see the now-corrected note above). Copied into
   `project/plans/` and merged to `main` via PR #1 (`feat_hriday`, opened as
   `nesora-ops`, approved by `boliwaladevs`, merged with `--rebase`) — the
   first PR this repo has ever had, used deliberately to exercise the branch
   protection flow end to end. **`plans/version_control.md` is now the
   canonical reference for how to work with this repo's rules** — admin vs.
   non-admin push, PR/approve/merge commands, the house defaults (merge to
   sync a stale branch, rebase to land a PR), and the recurring `gh`
   account-drift gotcha (same underlying issue as #1 above, generalized).
   Read that file directly rather than duplicating its commands here.

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

### 8.6 Sprint 2.7 — RLS/grant bug fixes (2026-08-04, same day)

The two tables flagged-not-fixed in §8.1 (`listing_images`,
`bulk_upload_batches`/`admin_audit_log`) closed out as their own sprint,
plus two more issues a full `get_advisors` security scan turned up that
weren't on anyone's radar. Migration `0007_lock_down_images_admin_tables_
rls.sql`, applied live, **not yet committed**.

- **`listing_images`, `bulk_upload_batches`, `admin_audit_log`** — all
  three had RLS disabled *and* the default Supabase blanket grant
  (`SELECT`/`INSERT`/`UPDATE`/`DELETE` for `anon`+`authenticated`), so
  anyone with the anon key had full CRUD — could deface listing photos,
  fabricate audit log rows, or tamper with bulk-upload batches. Fixed:
  `listing_images` gets RLS + a public `SELECT` policy scoped to images on
  `status = 'live'` listings (same visibility boundary as `listings`
  itself), no client writes. The other two get RLS + zero policies
  (deny-all), same as `listing_views` — nothing reads/writes them yet;
  Sprint 3's admin backend will use the service-role client.
- **`public._prisma_migrations` — found by `get_advisors`, not by the
  earlier manual RLS check, and had been missed in both Sprint 2.1 and the
  first pass of 2.7.** Same blanket-grant problem, vestigial from before
  Prisma was dropped. RLS enabled, no policies — not dropped, just locked
  down (nothing uses it, no reason to delete it either).
- **`handle_new_user()` and `increment_listing_view_count()` were callable
  directly via `/rest/v1/rpc/<name>`** by anon/authenticated even though
  both are trigger-only functions — `get_advisors` flagged this too.
  `EXECUTE` revoked from `public`/`anon`/`authenticated` on both; verified
  the triggers themselves still fire correctly afterward (trigger
  invocation goes through table/function ownership, not the caller's
  `EXECUTE` grant — signup still grants 5 credits, view-count still
  increments). `unlock_field_group` still shows a `get_advisors` WARN for
  `authenticated` — that one's correct and intentional, it's designed to be
  called directly by signed-in users; not a bug.
- **Verification:** real anon-key attack attempts (`SELECT`/`INSERT` on all
  three newly-locked tables) — reads return `[]`, writes 401 with an RLS
  violation. `get_advisors` re-run clean afterward except the expected
  `rls_enabled_no_policy` INFO-level notices (intentional, deny-all by
  design) and the one intentional `unlock_field_group` WARN.

---

## 9. Sprint 3 — split into 3 (executable) and 3.5 (blocked), 2026-08-04

Done at the user's request, before any Sprint 3 code — planning only,
nothing in this section is built yet. Original Sprint 3 scope, from
`plans/boliwala-phase1-sprint-plan.md` line 218: Razorpay payments, admin
shell, Listings Management, bulk Excel upload.

### 9.1 The actual blocker: Razorpay only

Checked `.env.local` — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_WEBHOOK_SECRET` are all empty (not even test-mode keys). This is
the one genuinely external blocker: order → checkout → webhook
verification → entitlement can't be built or tested without at least test
credentials (self-serve on Razorpay's dashboard, no KYC needed for test
mode — live-mode KYC is a separate, slower thing that R5 in the sprint plan
already correctly says isn't needed until Sprint 5).

Two things the original plan flagged as blockers **turned out not to be**:

- **R2 ("missing admin prototype")** — false alarm. `components/
  admin-view.tsx` already exists, 770 lines, a full static mockup covering
  essentially all of `boliwala_features.txt` §5 (Dashboard, Listings,
  Add/Edit, Bulk Upload, Callbacks, Packages, Payments, Users, Settings,
  Success Fees, Partners, Alerts/Engagement/Campaigns) — same situation as
  `property-results.tsx`/`listing-view.tsx` before Sprint 2.1: a real
  design already sitting in the codebase, zero data-fetching wired to it.
  No design pass needed, no client sign-off needed — same playbook as 2.1.
- **Open question #11 ("sample bulk-upload Excel")** — not a hard blocker.
  Building the parser against a fixed template the client hasn't confirmed
  yet would just be guessing at their format. Better approach, no client
  input needed: a generic column-mapping step (upload → detect headers →
  map each to a `listings` field → preview → validate → commit), which is
  more robust anyway and doesn't assume one fixed template.

### 9.2 Sprint 3 (executable now, no external blocker)

- Admin auth guard — `profiles.role` already has an `admin` enum value,
  just needs a real check + redirect (same pattern as `/profile`'s session
  guard).
- Dashboard — wire the real KPI cards `admin-view.tsx` already has:
  active listings, registered users, callback requests, shortlisters. The
  revenue/subscribers/success-fee KPIs correctly show ₹0/empty until 3.5 —
  don't fake them.
- Listings Management — real CRUD against `listings` (list/search/filter,
  add/edit form with the gated-field toggles, publish/status control,
  view-count column already real from Sprint 2.1).
- Image upload — needs a new Supabase Storage bucket (checked: **none
  exist yet**, `storage.buckets` is empty — this is just setup work, not
  externally blocked). Public read (matches `listing_images`' new RLS
  policy from 2.7), admin/service-role-only write.
- Bulk Excel upload — the column-mapping approach from §9.1, backed by
  `bulk_upload_batches` (already RLS-locked in 2.7, service-role only).

### 9.3 Sprint 3.5 (blocked on Razorpay credentials)

- Razorpay integration itself: ₹999 subscription + ₹9,999 package,
  order → checkout → webhook verification → entitlement, signature
  validation, failure/retry, idempotent webhooks.
- Admin "Payments" page, "Packages" page, Success Fee Tracker (§5.4/5.7 in
  `boliwala_features.txt`) — all downstream of real transaction data,
  currently fake stat cards in `admin-view.tsx` (`₹21,44,000`, `47`
  packages, etc.) that need replacing with real queries once real payments
  exist.
- **Unblocks with:** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (test mode)
  in `.env.local`, and `RAZORPAY_WEBHOOK_SECRET` once a webhook endpoint is
  registered in the Razorpay dashboard pointing at this app.

### 9.4 Sequence after Sprint 2.7

Sprint 2.7 (done) → **Sprint 3** (admin shell, listings management, image
upload, bulk upload — no blocker) → **Sprint 3.5** (Razorpay, whenever
credentials arrive — can run in parallel with Sprint 4 work that doesn't
depend on payments) → Sprint 4 (admin completion: Callback Requests,
Package Purchases [needs 3.5], Settings pricing controls, remaining public
pages, Resend email — Resend is also currently unconfigured, same empty-env
pattern as Razorpay, flagged for whoever picks up Sprint 4) → Sprint 5
(QA/SEO/launch). Sprint 2.5 (Google OAuth) still sits wherever it sits,
still blocked on Google credentials, doesn't block anything above.

---

## 10. Sprint 3 — completion record (2026-08-05)

Built and verified end-to-end this session against the live Supabase
project, real admin test accounts created and cleaned up each time
(including a leftover-artifact sweep at the end — checked zero test rows,
zero orphaned Storage objects). **Committed and pushed.**

### 10.1 What's real now

- **`/admin` is auth-gated for real.** `lib/auth/admin.ts`'s `requireAdmin()`
  — guests redirect to `/login`, signed-in non-admins redirect to `/`,
  verified both with real accounts. There is **no self-service path to
  becoming admin** (by design, since Sprint 2.1 revoked client `role`
  writes) — promote a user via `UPDATE profiles SET role='admin'` through
  the service-role client/SQL only.
- **`components/admin-view.tsx`** (the 770-line mockup found already
  sitting in the repo, see §9.1) is now real for exactly four sections —
  everything else in it (Callbacks, Packages, Payments, Success Fees,
  Users, Partners, Alerts, Email Campaigns, WhatsApp, Segments, Engagement,
  Settings) **is still the original static mockup**, deliberately
  untouched, Sprint 3.5/4 territory:
  - **Dashboard** — all 8 KPI cards are real queries (`lib/data/admin.ts`
    `getDashboardKpis()`), including the money ones (`revenueThisMonth`,
    `successFeesPending`) which correctly show real current zeros rather
    than the mockup's fabricated `₹3,84,000`/`38`/etc. No fabricated trend
    percentages — there's no historical baseline to compute them from yet.
    Two of the three alert banners are wired to real counts (unread
    callbacks, pending partner applications); the third (success fees) only
    shows when non-zero. **Recent Activity feed and the 8-month revenue
    chart are still static/mock** — a real activity feed needs
    `admin_audit_log` to actually be written to, which nothing does yet.
  - **Listings Management** (`components/admin/listings-panel.tsx`) — real
    table, all 4 statuses (draft/live/closed/cancelled, not just `live`
    like the public search), search (title/city/slug) + bank + status
    filters, debounced. "Cancel" (✕) sets `status='cancelled'` rather than
    hard-deleting — shortlists/unlocks/view history may already reference a
    listing, soft delete avoids FK issues and `cancelled` was already a
    real enum value.
  - **Add/Edit Listing** (`components/admin/listing-form-panel.tsx`) — the
    mockup only ever rendered the Images tab; the other three (Property
    Details, Bank & Auction, Gated Fields) had zero content, just tab
    labels. Built all four for real, tabbed, covering every column on
    `listings` including the gated ones. New listings save as a draft
    first, then the panel switches into edit mode for that id so the
    Images tab becomes usable immediately.
  - **Image upload** — new public Supabase Storage bucket `listing-images`
    (5MB limit, jpeg/png/webp only, migration `0008`). Public read (photos
    aren't gated, matches `listing_images`'s own RLS policy from 2.7); no
    client-side Storage write policy at all — every upload/delete goes
    through the service-role client from an admin server action. Verified:
    real upload, real `listing_images` row, the resulting public URL is
    fetchable with zero auth headers (200).
  - **Bulk Excel upload** (`components/admin/bulk-upload-panel.tsx`) — no
    fixed template (§9.1's reasoning): upload any `.xlsx`/`.xls`/`.csv`,
    auto-detect + manually remap columns, preview with per-row validation,
    commit only the valid rows as drafts. **Found and fixed a real bug
    during testing:** the auto-mapping heuristic was exact-match-only, so a
    column literally named "Bank" never matched the field label "Bank
    (name)" and every row failed — fixed to also match after stripping
    parenthetical qualifiers and by substring containment. Verified with a
    real 2-row file (one resolvable bank, one deliberately unresolvable) —
    preview correctly showed 1 valid/1 error, commit created exactly the
    one valid row.
- **`xlsx` (SheetJS) pulled in for parsing.** Installed at `0.18.5` (npm's
  latest) which has two known high-severity advisories (prototype
  pollution, ReDoS) with no fix on npm — SheetJS moved patched releases
  (`>=0.20.2`) to their own CDN after an npm publishing dispute. Installed
  the patched `0.20.3` from `https://cdn.sheetjs.com/xlsx-0.20.3/
  xlsx-0.20.3.tgz` instead (their documented distribution channel since the
  npm move) — `pnpm audit` confirms clean. Re-verified the whole bulk
  upload flow against the new version, no behaviour change.

### 10.2 Data-access pattern used throughout

Same shape as Sprint 2.1's `unlock_field_group`/`listing_views`: every
admin data function in `lib/data/admin.ts` and every mutation in
`app/actions/admin-listings.ts` uses `createAdminClient()` (service-role,
bypasses RLS/column-grants entirely) — **but only ever after
`requireAdmin()` has verified the caller's own session is a real admin.**
The authorization boundary is the app-code check, not a new RLS policy;
`listings` itself still has no INSERT/UPDATE/DELETE policy for any client
role, unchanged from before this session. This was a deliberate choice over
adding an admin-scoped RLS policy — avoids touching the existing,
already-verified public-read security boundary on `listings` at all.

### 10.3 Verification performed

- `tsc --noEmit` and `pnpm build` clean throughout (only the 3 pre-existing
  unrelated ref-type errors remain).
- Non-admin authenticated user visiting `/admin` → redirected to `/`.
  Guest → redirected to `/login`. Real admin → dashboard loads.
- Full create → search/filter → edit → cancel round-trip on a real listing,
  verified against the DB at each step, not just the UI.
- Image upload → real Storage object + DB row → public URL fetchable
  without auth → delete removes both.
- Bulk upload → mapping → preview (catches the bad-bank-name row correctly)
  → commit → verified exactly the valid row landed in `listings` as a
  draft.
- Full artifact sweep at the end: zero leftover test listings, images,
  Storage objects, or admin accounts.

### 10.4 Deliberately left alone (Sprint 3.5/4 territory, not touched)

Callbacks, Packages, Payments, Success Fees, Users, Partners, Alerts, Alert
Engine, Email Campaigns, WhatsApp Tools, Segments, Engagement Analytics,
and the Settings tab in `admin-view.tsx` are all still the original static
mockup — same data (`Priya Mehta`, `₹21,44,000`, `1,842` users, etc.) as
before this session. `callback_requests` and `channel_partner_applications`
already have real, queryable schema (used for the two real dashboard alert
counts) but their full CRUD/workflow tabs are unbuilt. None of this was in
Sprint 3's scope per §9.2. **Superseded by §11/§12: Callbacks and Settings
are now real as of Sprint 4 (2026-08-05). Packages, Payments, Success Fees,
Users, Partners, and the Engagement group are still mock — see §12.4.**

---

## 11. Sprint 4 — split into 4 (executable) and 4.5 (blocked), 2026-08-05

Same exercise as §9, one sprint later. Original Sprint 4 scope, from
`plans/boliwala-phase1-sprint-plan.md` line 229: admin Callback Requests
workflow, admin Package Purchases, admin Settings (pricing controls),
verifying settings propagate everywhere, public Pricing/Services/Channel
Partner enrolment/Contact/About, transactional email via Resend.

### 11.1 Two gaps found while scoping, not in the original plan text

- **No customer-facing callback capture existed anywhere.** `callback_
  requests` had real schema and a real client `INSERT` policy since before
  this session, but zero UI ever wrote to it — the admin workflow tab was
  planned as if leads would just show up. Folded into Sprint 4: had to
  build the capture (a `/contact` page + a listing-page CTA) before the
  admin workflow had anything real to manage.
- **`/contact` didn't exist, but was already linked from two places**
  (`services-view.tsx`'s "Talk to Our Team", and the header's "Free
  Consultation" button — which pointed at `/login`, making no sense for a
  lead-gen CTA). Building `/contact` fixed both dangling/wrong links at
  once, not just added a new page.

### 11.2 The actual blockers: Resend (hard) and C5 sign-off (soft)

- **Resend** — `RESEND_API_KEY`/`RESEND_FROM_EMAIL` both empty in
  `.env.local`, confirmed before starting. Same category of blocker as
  Razorpay was for 3.5: nothing to build against without at least a key,
  and the original plan's R1 risk (DNS verification needed for the sending
  domain) still applies for production, though Resend's sandbox domain
  could unblock dev-only testing without DNS.
- **C5 headline statistics** — confirmed still present and still
  fabricated: `about-view.tsx` (`₹2,100Cr won`, `840+ auctions`) and
  `hero.tsx` (`12,400+ Live Auctions`). This is a content sign-off blocker,
  not a technical one — moved here at the user's request rather than left
  as a caveat inside Sprint 4, since it's genuinely the same shape as the
  other two blockers (waiting on the user/client for something), not a
  simpler in-sprint caveat.
- **Package Purchases admin page** — still soft-blocked on Sprint 3.5 for
  the same reason as before: nothing real to show until real
  `service_packages` data exists.

### 11.3 Sprint 4 (executed 2026-08-05, see §12 for the completion record)

Customer-facing callback capture, admin Callback Requests workflow, admin
Settings (pricing controls) with live propagation, Channel Partner
enrolment form, Services page pricing wiring, Pricing page wiring. About
page left untouched (pure static copy plus the blocked C5 numbers).

### 11.4 Sprint 4.5 (blocked)

| Item | Blocked on |
|---|---|
| Transactional email (Resend) — signup, payment receipt, callback ack | `RESEND_API_KEY`/`RESEND_FROM_EMAIL` + DNS verification for production |
| Headline statistics (C5) — `about-view.tsx`, `hero.tsx` | Client sign-off: real numbers, or explicit approval to ship placeholder/aspirational figures |
| Admin: Package Purchases page | Real `service_packages` data — waits on Sprint 3.5 (Razorpay) |

---

## 12. Sprint 4 — completion record (2026-08-05)

Built and verified end-to-end this session, real accounts and real
submissions, cleaned up after (checked zero leftover test rows). **Committed
and pushed.**

### 12.1 New: the callback-request pipeline, end to end

- **`app/actions/callback.ts`** — `submitCallbackRequest()`, real client
  (RLS-permitted insert, same as `alerts-section.tsx`'s pattern — no
  service-role needed here, `callback_requests` already had a working
  anon+authenticated `INSERT` policy).
- **`/contact`** (`app/contact/page.tsx` + `components/contact-form.tsx`)
  — accepts an optional `?listing=<slug>` param; when present, resolves
  the real listing (public columns only) server-side, shows "Regarding:
  {title}" context, and sets `source: 'listing'` + the real `listingId` on
  submit. Without the param, `source: 'contact'`.
- **Listing page** — new "📞 Request a Callback" button in the action card,
  links to `/contact?listing={slug}`.
- **Header** — "Free Consultation" now points at `/contact` instead of
  `/login` on both the desktop and mobile nav (same fix, both were
  `href="/login"`).
- Verified: guest submits from `/contact` directly → real row, `source:
  'contact'`. Guest clicks through from a listing page → real row with the
  correct `listingId` and `source: 'listing'`, join to the listing's title
  confirmed working in the admin panel.

### 12.2 Admin: Callback Requests and Settings are now real

- **`components/admin/callbacks-panel.tsx`** — real list, search
  (name/phone/email) + status filter, status transitions (New → Contacted
  → Closed) that write `assignedTo` as the acting admin's own id. The
  mockup's status set (New/Called/In Progress/Converted/Closed) didn't
  match the real `CallbackStatus` enum (`new`/`contacted`/`closed` only,
  no "in progress" or "converted") — built against the real enum, not the
  mockup's invented one. Dropped the mockup's "City"/"Budget" columns —
  neither is a real column on `callback_requests` and the new capture form
  doesn't collect them either.
- **`components/admin/settings-panel.tsx`** — the 4 real editable fields
  from `boliwala_features.txt` §5.12 (Free Credits, Annual Price, Service
  Package Price, Success Fee %), writing to the real `settings` table.
  **Replaced, not adapted, the mockup's Settings tab** — it had "Site
  Name"/"Contact Email"/"WhatsApp"/Razorpay-key fields that don't
  correspond to any real `settings` row, and a UI for editing Razorpay
  secrets through a database-backed form would be a real security
  anti-pattern, not just an inaccuracy — secrets belong in env vars, never
  in a table a web form writes to.
- Verified: changed `annual_price` via the real admin panel → confirmed in
  the DB → confirmed live on `/pricing` and `/services` within the same
  request cycle (via `revalidatePath`) → reverted back to 999 as part of
  cleanup, confirmed reverted.

### 12.3 Public pages wired to live settings

- **`/pricing`** (374 lines) and **`components/services-view.tsx`** (500
  lines, via `app/services/page.tsx`) — both converted from fully
  hardcoded (`₹999`, `₹9,999`, `1%`, `5 credits`, in headings, pricing
  cards, the comparison table, *and* the FAQ prose) to reading
  `getPricingSettings()` live, including the per-field-group unlock costs
  (`flat_floor`/`inspection`/`officer_contact`) in the comparison table.
  Per the user's decision in the previous turn: kept as two separate
  pages, not merged.
- **`components/partner-view.tsx`** — the enrolment form had zero submit
  handler before this session (pure mockup). Wired to
  `channel_partner_applications` via a new `app/actions/partner.ts`. One
  schema gap: the form's "Localities to Cover" field has no matching
  column — folded into the real `experience` text column alongside "Tell
  Us About Yourself" rather than dropping the field or fabricating a
  column, so no user input is silently lost.

### 12.4 Still mock, unchanged (confirmed, not just assumed)

Packages, Payments, Success Fees, Users, Partners, Alerts, Alert Engine,
Email Campaigns, WhatsApp Tools, Segments, and Engagement Analytics tabs in
`admin-view.tsx` — all Sprint 3.5/4.5 territory, none of it touched. About
page untouched (still has the blocked C5 headline stats).

### 12.5 A recurring environment problem worth knowing about

Multiple `pnpm dev`/`next dev` background launches accumulated as real
**native Windows processes** across this session that `kill`/`lsof -ti`
from the Bash tool (git-bash/MSYS) could not actually terminate — they'd
silently "succeed" and the process would keep holding its port. Symptom:
a new dev server binds an unexpected port ("Port 3000 is in use..."), or
`.next/dev/lock` refuses to release even after an apparent kill. Fix: use
the **PowerShell tool**, not Bash, to actually kill them —
`Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object
{ $_.CommandLine -match 'next|pnpm.*dev' } | Stop-Process -Force`. Cost
some time mid-session chasing a phantom 404/500 on the new `/contact`
route that turned out to be three stale dev servers, not a real bug.
