# BOLIWALA.COM — PROJECT MEMORY & HANDOFF

> **🔄 UPDATE RULE (MANDATORY):** On every code change and commit, the following files
> MUST be updated to reflect the current state:
> - `MEMORY.md` — update the relevant sprint section, add new sections as needed
> - `project_calendar.html` — mark completed sprints, update timelines
> - `SPRINT_CALENDAR.md` — mark completed tasks `[x]`, update statuses and dates
>
> This rule is non-negotiable. No commit goes out without these three files in sync.

**Purpose:** single source of truth for project state across sessions. If a
context window fills up, open a new session and point it at this file first.

> **Read order for a fresh session:**
> 1. This file (state, gotchas, next action)
> 2. `CLAUDE.md` (behavioural rules — surgical changes, verify everything)
> 3. `boliwala_features.txt` (the real Product Feature List / URD v2.0 — this
>    is the actual scope document, supersedes guesses in the old sprint plan)
> 4. `plans/boliwala-phase1-sprint-plan.md` (master plan — **includes Sprint
>    2.1 and Sprint 2.5, both deferred**, see §4 below)

**Last updated:** 2026-08-09.

> **15 SEP LAUNCH PLAN & SCOPE AUDIT**
> A comprehensive `SCOPE_AUDIT.md` was run on 9 Aug, finding 22 unscoped URD features (Channel Partner portal, Marketing engine, full Profile, Capacitor APK).
> Following this, `SPRINT_CALENDAR.md` and `project_calendar.html` were rebuilt into a **5-week compressed timeline** to deliver all remaining sprints (Sprint 6 through 13) by the non-negotiable **15 September 2026** launch date.
> There is no Phase 2 — everything ships.

**Recent History:** Sprints 2.1 (`5f6f771`), 2.7 (`2ee35a1`),
3 (`74ba69a`), 4 (`54714f8`), 2.5 (`c48559d`) and 5 (`0b88cb6`, docs in
`d6d952d`) are all committed and pushed.

**If you're picking this up fresh, read §14 and §15 first** — §14 is the
Sprint 5/5.5 split plus this machine's environment quirks (no `project/`
subdirectory, pnpm PATH, disk pressure), §15 is what Sprint 5 built and
the four things it found but deliberately did not fix. Then §11/§12
(Sprint 4), §10 (Sprint 3), §9 (the 3/3.5 split), §8 (2.1 + 2.7),
§13 (2.5).

**Current Unblocked Work:** Sprint 6 (Profile My Alerts, My Details, `/search` alerts, `/partner/dashboard` protection, dead code cleanup, data audit, DB password rotation) is **UNBLOCKED** and starts immediately.

**Blocked Work:** The remaining sprints wait on the client. **All credentials MUST arrive by 17 August** for the 15 Sep launch to be possible:

| Blocked work | Waiting on |
|---|---|
| Sprint 3.5 — Razorpay integration | `RAZORPAY_KEY_ID` / `_KEY_SECRET` / `_WEBHOOK_SECRET` |
| Sprint 4.5 — Resend transactional email | `RESEND_API_KEY` / `RESEND_FROM_EMAIL`, plus DNS |
| Sprint 5.5 — Content & Legal | Privacy Policy, Terms, contact numbers, brand assets |
| Sprints 7, 8, 9, 10, 11 | Blocked on Sprint 3.5 (Razorpay) completion |

Re-check `.env.local` before assuming any of these cleared. **The 20 Aug
M3 "production launch" milestone is not reachable** while payments and
email do not exist and Privacy/Terms have no copy — see §14.5.

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
- **Sprint 2.5 — Google OAuth. Prerequisites confirmed 2026-08-09, execution
  starting now.** `.env.local` has `GOOGLE_OAUTH_CLIENT_ID`/
  `GOOGLE_OAUTH_CLIENT_SECRET` (note: `OAUTH_` in the name, not
  `GOOGLE_CLIENT_ID` as the old plan text assumed — cosmetic, the app never
  reads these directly since Supabase's dashboard holds its own copy of the
  same creds). Verified live, not just user-reported: Supabase's public
  `/auth/v1/settings` endpoint returns `"google": true`; user-supplied GCP
  screenshots show Publishing status **In production**, User type
  **External**, and OAuth client `1041401822894-cs5...` matching the
  `.env.local` client ID exactly. **Not independently verified:** the
  client's Authorized redirect URI (should be
  `https://rimyttphaidvlytefvil.supabase.co/auth/v1/callback`) and
  Supabase's own URL Configuration (Site URL/Redirect URLs) — no screenshot
  covered either; flagged to the user as the most likely failure point if
  something breaks at actual login time. Q4 (required at launch vs.
  fast-follow) still unanswered but doesn't block building. Button is still
  UI-present/disabled, no `/auth/callback` route yet — both are this
  sprint's actual work, starting now.

**Sequencing confirmed with the user:** Sprint 2.1 (done) → Sprint 2.5
(starting) → Sprint 3 onward.

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

---

## 13. Sprint 2.5 — Google OAuth, completion record (2026-08-09)

**Executed and verified live this session. Not yet committed** — same
"user reviews locally first" convention as every prior sprint.

### 13.1 Prerequisite verification, before writing any code

Checked independently rather than taking the user's word for it:
`.env.local` has real `GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET`
(note the `OAUTH_` in the name — cosmetic, the app never reads these
directly, Supabase's dashboard holds its own copy); Supabase's public
`/auth/v1/settings` endpoint returned `"google": true`; user-supplied GCP
screenshots showed Publishing status **In production**, User type
**External**, client ID matching `.env.local` exactly. User then confirmed
the GCP Authorized redirect URI is exactly
`https://rimyttphaidvlytefvil.supabase.co/auth/v1/callback`, and answered
the long-open Q4: **Google OAuth is required at launch**, not a
fast-follow.

### 13.2 What was built

- `components/auth-view.tsx` — `handleGoogleLogin()` calls
  `supabase.auth.signInWithOAuth({ provider: 'google', options: {
  redirectTo: '${origin}/auth/callback' } })`; the button is no longer
  disabled.
- `app/auth/callback/route.ts` (new) — exchanges the OAuth `code` for a
  session via `exchangeCodeForSession`, redirects to `/profile` on
  success, `/login` on failure.
- No changes needed to `handle_new_user` (migration `0004`) — it's an
  `AFTER INSERT ON auth.users` trigger, provider-agnostic, already fires
  correctly for OAuth signups with zero modification. Confirmed this
  structurally guarantees no double-grant on repeat logins (a second
  Google login updates the existing `auth.users` row rather than
  inserting a new one, so the trigger can't fire twice) — not just
  empirically observed once.

### 13.3 Verification performed

- `tsc --noEmit` / `pnpm build` clean (same 3 pre-existing unrelated
  ref-type errors as every prior session, untouched).
- Real browser test via the dev server: clicking "Google" correctly
  redirected to Google's real sign-in screen scoped to "continue to
  rimyttphaidvlytefvil.supabase.co" — confirms client ID/secret/redirect
  URI/provider-enablement all correctly linked, before any manual login
  was attempted.
- **Real Google sign-in, done by the user** (`ops@nesora.co.in`, "Hriday
  Kampani") — verified directly against the live DB afterward: one
  `auth.users` row with `provider: google`, one `profiles` row
  (`creditsBalance: 5`, `fullName` populated from Google's profile data),
  **exactly one** `credit_transactions` row (`reason: signup_grant`,
  `delta: +5`, `balanceAfter: 5`) — no duplicate grant.
- Added `.claude/launch.json` (`pnpm -C project dev`, port 3000) this
  session so the dev server can be previewed via the browser tool going
  forward — didn't exist before.

### 13.4 Test account — resolved

`ops@nesora.co.in` ("Hriday Kampani") is the user's own real account, not
a throwaway — user confirmed 2026-08-09, explicitly keep it, do not
delete. Different from every prior sprint's test-user hygiene rule (which
applies to accounts created purely to exercise a flow then discarded);
this one stays in the live DB.

**Sprint 2.5 status: done, verified, committed.** Next up per §4's
original sequencing: Sprint 3.5 (Razorpay) or Sprint 4.5 (Resend + C5
sign-off) — both still blocked on the user, per §9.3/§11.4. Nothing left
unblocked to build until one of those lands.

---

## 14. Sprint 5 — split into 5 (executable) and 5.5 (blocked), 2026-08-09

Same exercise as §9 (Sprint 3) and §11 (Sprint 4), one sprint later.
Original Sprint 5 scope, from `plans/boliwala-phase1-sprint-plan.md`
line 238: cross-device/browser QA, responsive audit, PWA manifest +
service worker, SEO (per-listing metadata, OG images, `sitemap.xml`,
`robots.txt`, JSON-LD, canonicals), re-run the four-state gating matrix +
guest-source leak test, Lighthouse/Core Web Vitals/image optimisation,
Razorpay live-key switchover, production deploy, client walkthrough +
handover docs.

### 14.1 Environment state, verified this session before scoping

This is a **fresh clone on a different machine** than every prior sprint
(`C:\Users\AARYAN KALE\OneDrive\Documents\Aaryan\Programs\boliwala`, not
the `C:\Users\hrida\...` path in §2), and the layout differs from what §2
describes: **there is no `project/` subdirectory — the app is at the repo
root.** `app/`, `components/`, `lib/`, `supabase/` are all top-level.
Any command in earlier sections written as `pnpm -C project ...` (e.g.
§13.3's `.claude/launch.json` note) needs the `-C project` dropped here.
`.claude/` does not exist in this clone at all.

Setup done this session to make the repo runnable:

- **`env (1).download` → renamed to `.env.local`.** The user had
  downloaded the env file into the repo root under that name. It was
  **untracked and NOT gitignored** — `.gitignore`'s `.env*` pattern does
  not match a filename starting with `env`, so a `git add -A` would have
  committed `SUPABASE_SERVICE_ROLE_KEY` and both DB connection strings
  (passwords inline) to a **public** repo. Renaming fixed both problems at
  once: the app can now read it, and `.env*` now matches it (verified with
  `git check-ignore -v .env.local`).
- **pnpm was not installed** (only npm/node v22.12.0). `corepack prepare`
  fails with `EPERM` on this machine — it tries to write to
  `C:\Program Files\nodejs` without admin. Working install:
  `npm install -g pnpm` (prefix is the user-writable `%APPDATA%\npm`).
  That dir is **not on PATH** for the tool shells, so every pnpm call
  needs `$env:Path = "C:\Users\AARYAN KALE\AppData\Roaming\npm;" +
  $env:Path` prefixed, and must go through the **PowerShell tool** —
  `pnpm` is not resolvable from the Bash tool at all.
- **`C:` was 100% full — 40 KB free**, which is what actually blocked the
  first install attempt (`ERR_PNPM_ENOSPC`). Cleared npm's own cache
  (`npm cache clean --force` + removing `%LOCALAPPDATA%\npm-cache`,
  1.54 GB, regenerable) → 1.66 GB free, enough to install. **Still tight:
  ~1.5 GB free after `node_modules`.** Other reclaimable caches measured
  and left alone for the user to decide on: `C:\Windows\Temp` 1.65 GB,
  `%LOCALAPPDATA%\Temp` 0.63 GB, `%LOCALAPPDATA%\pnpm` 0.34 GB, pip cache
  0.13 GB. Worth flagging: `node_modules` now lives **inside a
  OneDrive-synced folder**, which is both a sync-churn and a
  disk-pressure problem.

**Baseline after setup, matching §13.3's numbers exactly** (so nothing
regressed between machines): `tsc --noEmit` → the same 3 pre-existing
ref-type errors in `call-to-action.tsx`/`hero.tsx`/`projects.tsx`, nothing
else; `pnpm build` → clean, all 18 routes compile.

### 14.2 Findings that change the scope, not in the original plan text

All four found by inspecting this clone, none of them previously recorded:

- **`next.config.mjs` sets `typescript: { ignoreBuildErrors: true }`.**
  This is why "3 pre-existing type errors" and "`pnpm build` clean" have
  coexisted in every handoff since Sprint 2 — the build literally prints
  `Skipping validation of types`. Shipping a production launch with
  typechecking disabled is a Sprint 5 quality item in its own right, and
  the 3 errors are small ref-typing fixes, not deep ones.
- **`next.config.mjs` also sets `images: { unoptimized: true }`**, and
  the homepage hero still loads **raw PNGs totalling ~9.8 MB**
  (`hously-background.png` 5.76 MB + `hously-foreground.png` 4.02 MB),
  plus `exterior.png` 870 KB, `desk.png` 655 KB,
  `premium_property_bg.png` 679 KB. Sprint 1.5's §T3 recorded converting
  the hero art to WebP (10.16 MB → 627 KB) — **that conversion is not
  present in this codebase.** Either it was lost in the reset that dropped
  Prisma, or it only ever existed in the old `project/` tree. Sprint 5's
  "image optimisation / Core Web Vitals" line item is therefore much
  larger than a polish pass: it is the single biggest CWV problem on the
  site and has to be redone.
- **`app/layout.tsx` references four icon files that do not exist.**
  `/icon-light-32x32.png`, `/icon-dark-32x32.png`, `/icon.svg`, and
  `/apple-icon.png` are all declared in the `metadata.icons` block;
  `public/` contains **only** an `images/` folder. All four 404 today.
  This overlaps the long-open "brand assets (logo SVG, favicon, OG image)"
  question — see 14.4.
- **SEO is at zero, not partial.** Exactly one `export const metadata` in
  the entire app (the root layout) and **zero** `generateMetadata`
  functions. No `sitemap.ts`, no `robots.ts`, no `manifest`, no
  `opengraph-image`, no JSON-LD, no canonicals anywhere. Every one of the
  18 routes currently serves the same title and description.

### 14.3 Sprint 5 (executable now, no external blocker)

Ordered by launch impact. Each carries its own verification, per
CLAUDE.md §4.

1. **Re-run the security matrix first, before changing anything** — the
   four access states and the guest-visible-source leak test (old plan
   §3, last run in Sprint 2.1 §8.4). This is a fresh clone against the
   same live DB; establishing that the revenue-critical boundary still
   holds is the precondition for trusting any later "still passes" claim.
   → verify: gated field names absent from guest HTML, 4 access states
   render correctly.
2. **SEO foundation.** `app/sitemap.ts` (static routes + all
   `status = 'live'` listings), `app/robots.ts`, per-route `metadata`, and
   `generateMetadata` on `/listing/[slug]` (real title/description/OG from
   the listing's public columns only — **never a gated field**).
   Canonicals throughout. All URLs derived from `NEXT_PUBLIC_SITE_URL` so
   the domain cutover is a one-env-var change, not a code change.
   → verify: `/sitemap.xml` and `/robots.txt` return 200 with correct
   content; two different listings return two different titles; no gated
   value appears in any `<meta>` tag.
3. **JSON-LD** structured data on listing pages (`RealEstateListing` /
   `Product`, plus `Organization` on the homepage), public fields only.
   → verify: valid JSON parses out of the rendered HTML.
4. **Image optimisation** — the 14.2 item. Convert the hero PNGs to
   WebP/AVIF, drop `images: { unoptimized: true }`, size and lazy-load
   correctly.
   → verify: measured before/after byte counts recorded here, same as
   Sprint 1.5 did.
5. **Icons + PWA manifest.** Generate the four missing icon files and
   `app/manifest.ts`. Service worker last — old plan R7 names PWA offline
   as the first thing to cut if time runs short.
   → verify: all four icon URLs 200; manifest validates.
6. **Re-enable typechecking** — fix the 3 ref errors, remove
   `ignoreBuildErrors`.
   → verify: `pnpm build` passes *with* type validation on.
7. **Responsive / cross-browser QA** at 375 / 768 / 1280 across all 18
   routes, and **Lighthouse / CWV** measured after items 4–6 land.
8. **Handover docs.**

### 14.4 Sprint 5.5 (blocked)

Verified empirically against `.env.local` this session, not assumed from
the previous handoff — every one of these is still genuinely blocked:

| Item | Blocked on | Evidence checked |
|---|---|---|
| Razorpay live-key switchover | **Sprint 3.5 first** — the integration itself was never built — *and* credentials | `RAZORPAY_KEY_ID` / `_KEY_SECRET` / `_WEBHOOK_SECRET` all empty. Double blocker: there is no live-key "switchover" to perform until there is an integration to switch. |
| Transactional email (Resend) | `RESEND_API_KEY` / `RESEND_FROM_EMAIL` + DNS verification (R1) | Both empty. Carried unchanged from §11.4. |
| Privacy Policy + Terms pages | Client copy | `components/footer.tsx:79,82` link both to `href="#"`; no `/privacy` or `/terms` route exists. Old plan §7 item 14. |
| C5 headline statistics | Client sign-off | Unchanged from §11.2 — still fabricated in `hero.tsx` and `about-view.tsx`. |
| Real contact number / WhatsApp deep link (C3) | Client | `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_CONTACT_PHONE` both empty. |
| Production domain cutover + registrar | Client | `NEXT_PUBLIC_SITE_URL` is still `http://localhost:3000`. Mitigated by design in 14.3 item 2 — every generated URL reads this var, so cutover is one env change. |
| Brand assets (real logo SVG, favicon, OG image) | Client | Overlaps 14.3 item 5. **Not hard-blocking** — placeholders generated from the existing `hously-logo.svg` and brand tokens unblock the build; swapping in real assets later is a file replacement, no code change. Flagged so placeholders don't get mistaken for final brand. |
| Production deploy + client walkthrough | Everything above | Terminal step. |

### 14.5 What this means for the 20 Aug M3 launch date

Sprint 5's *own* QA/SEO/performance work is unblocked and is what's being
executed now. But **M3 as originally defined — "production launch" — is
not reachable** while payments (3.5) do not exist, email (4.5) does not
exist, and Privacy/Terms have no copy. Those are three separate waits on
the client, and 3.5 in particular is a build sprint, not a switch-flip.
Recorded here rather than discovered at the deadline.

---

## 15. Sprint 5 — completion record (2026-08-09)

Items 1–7 of §14.3 executed and verified this session. **Not committed** —
same "user reviews locally first" convention as every prior sprint.
Item 8 (handover docs) is deliberately deferred: a handover document is
written against a launched system, and launch is blocked (§14.4).

### 15.1 Security re-verified first, and it holds

Two re-runnable scripts now live in the repo so no future session has to
rebuild them:

- **`scripts/leak-test.mjs`** — reads the real gated values for every live
  listing with the service-role key, then fetches each listing page with
  no cookies and asserts neither the gated column keys nor their actual
  values appear in the HTML. **12/12 listings PASS**, 96 column-key checks,
  96 non-empty value checks. Re-run after every subsequent change this
  session, and again against the **production build** (`next start`) — same
  result. Usage: `node scripts/leak-test.mjs http://localhost:3000`.
- **`scripts/access-matrix-test.mjs`** — drives `resolveListingAccess()`
  through 7 viewer shapes covering all four states, with pricing read live
  from the `settings` table rather than assumed. **49 assertions, all
  PASS.** Includes the two cases that cost money if they regress: an
  already-unlocked group is never re-charged, and a subscriber is never
  charged. Needs Node's type stripping to load the app's `.ts` modules:
  `node --experimental-strip-types --import ./scripts/ts-resolve-hook.mjs scripts/access-matrix-test.mjs`.
- **`scripts/ts-resolve-hook.mjs`** — 20-line resolve hook that retries
  extensionless relative imports as `.ts`. Exists so the matrix test can
  exercise the real `lib/access/` modules instead of a copy, without
  adding `.ts` extensions to application source to suit a test runner.

Also confirmed by `git log`: `lib/access/`, `lib/auth/viewer.ts` and
`app/actions/unlock.ts` have not changed since `5f6f771` (Sprint 2.1) —
the same commit whose §8.4 record documents the full four-state
end-to-end run with real accounts. So the logic under test is byte-identical
to what was last verified against live sessions.

**Two findings from the first run, both false positives — worth knowing
about because the naive version of this test reports them as leaks:**

1. The bare substring `floor` appears in every listing page. It is the
   field-group id `flat_floor` and its label "Flat number & floor", sitting
   right next to `"value":null`. The test now matches the serialised key
   form (`"floor":`) instead.
2. `flatNumber` on `agricultural-land-ajmer-road-jaipur-bob` is
   `"Khasra 210"`, which appears in the page — because the **public**
   `addressLine` is `"Khasra 210, Village Bhankrota"`. The redaction layer
   is correct; the seed data has a gated field duplicating public data.
   **Not a security bug, but a real monetisation bug:** a buyer spends a
   credit on `flat_floor` for that listing and receives a string already
   visible for free. The test now reports this category separately rather
   than failing on it. Worth raising with the client alongside the other
   data questions.

### 15.2 SEO — built from zero

Before this session: one `export const metadata` in the whole app (the root
layout), zero `generateMetadata`, no sitemap/robots/manifest/canonicals.

- **`lib/seo.ts`** — `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`, trailing
  slash stripped), `absoluteUrl()`, and a `pageMetadata()` builder that
  attaches a canonical plus OG/Twitter tags. **Every absolute URL the site
  emits now derives from this one place**, so the production domain
  cutover is an env-var change and nothing else — see §14.4.
- **Root layout** — `metadataBase`, a `%s — Boliwala.com` title template,
  `openGraph`/`twitter` defaults, `robots: index/follow`, and
  `lang="en-IN"` (was `en`).
- **`app/sitemap.ts`** — 8 static routes + every live listing, `revalidate
  = 3600`. **20 entries** confirmed. Wrapped in try/catch so a DB blip
  degrades to the static routes rather than serving a crawler a 500.
- **`app/robots.ts`** — disallows `/admin`, `/profile`,
  `/partner/dashboard`, `/auth/`, `/reset-password`; points at the sitemap.
- **`generateMetadata` on `/listing/[slug]`** — real per-listing title,
  description (bank, locality, reserve price, EMD, auction date, all
  `formatINR`/`formatDateLong`), canonical, and OG image from the first
  listing photo. **Public columns only**, with a comment saying why.
  Titles came out at 71+ chars on the first pass because the seeded titles
  already name the city; now the city is appended only when missing, giving
  50–56 chars.
- **Per-route metadata** on all 13 remaining routes — indexable ones get
  real descriptions, the six authenticated/auth surfaces get `noIndex`.
  `/search`'s canonical points at the bare path so filter-param
  permutations consolidate instead of competing.
- **`getListingBySlug` is now wrapped in React `cache()`.** Without it,
  adding `generateMetadata` would have doubled the DB query on every
  listing page render, since both it and the page component fetch by slug.

### 15.3 JSON-LD

`components/json-ld.tsx` — escapes `<` so a `</script>` inside a title or
description cannot close the tag early. Emits `RealEstateListing` (with
`PostalAddress`, an `Offer` carrying reserve price / INR / `validThrough`,
and the bank as seller) on listing pages, plus `Organization` and `WebSite`
with a `SearchAction` on the homepage. All blocks verified to parse.

Built from **named public fields only** — never a spread, and never
`safeListing.gated`, which holds real values for a subscriber. Dropped
`datePosted` after first emitting it: it means "when the listing was
published", and filling it with the auction date would have published
incorrect structured data. `Organization` carries no `telephone` or
`sameAs` because the real contact number and social handles are still open
(C3) and inventing them would publish false contact details.

### 15.4 Image optimisation — the biggest measured win

`next.config.mjs` had `images: { unoptimized: true }`, and the homepage
shipped raw PNGs. Converted the three images that live code actually
references to WebP with ffmpeg (`libwebp -quality 82`), switched
`hero.tsx` and `philosophy.tsx` to `next/image`, and enabled the optimizer
with `formats: ["image/avif", "image/webp"]`.

Source files:

| File | Before | After |
|---|---|---|
| `hously-background.png` | 5,626 KB | 94 KB webp |
| `hously-foreground.png` | 3,926 KB | 328 KB webp |
| `exterior.png` | 850 KB | 637 KB webp |

What a browser at a 1920px viewport actually downloads:

| | Before | After |
|---|---|---|
| background | 5,761,457 B (png) | 18,062 B (avif) |
| foreground | 4,020,097 B (png) | 116,534 B (avif) |
| exterior | 870,902 B (png) | 77,633 B (avif, 640w) |
| **total** | **10,652,456 B** | **212,229 B — 98.0% smaller** |

Details worth keeping:

- Alpha survives the conversion (`yuva420p` on both hero layers, verified
  with ffprobe) — the foreground is a building cut-out and would have
  broken visibly otherwise.
- The background is `priority` (it is the LCP element). The foreground is
  explicitly `loading="lazy"`: at scroll 0 it is translated fully below the
  fold and only slides up as you scroll, so preloading it would compete
  with the LCP image. This matches Sprint 1.5's T3 decision.
- Both hero images had descriptive `alt` text ("Sky Background", "Building
  Foreground") and are now `alt=""` — they are decorative, and an empty alt
  is what stops a screen reader announcing them.
- `remotePatterns` added for the Supabase Storage host. Listing photos in
  the public `listing-images` bucket are still rendered with a plain
  `<img>` in `listing-view.tsx`, so nothing needs it *yet* — but the moment
  anyone switches that to `next/image` it would 400 without this.
- **Deliberately not deleted:** `desk.png`, `premium_property_bg.png`,
  `hously-1..4.png` (1.6 MB total). `hously-1/2/3` are referenced only by
  `components/projects.tsx`, which **nothing imports** — pre-existing dead
  code, flagged rather than removed per CLAUDE.md §3. The other two are
  referenced by nothing at all. Removing `projects.tsx` and those six PNGs
  is a clean follow-up if you want it.

### 15.5 Icons, manifest, OG image

`app/layout.tsx` declared four icon files — `/icon-light-32x32.png`,
`/icon-dark-32x32.png`, `/icon.svg`, `/apple-icon.png` — and `public/`
contained only an `images/` folder. **All four 404'd.**

Replaced with Next file conventions, generated at build time via
`next/og`'s `ImageResponse` (no new dependency): `app/icon.tsx` (64×64),
`app/apple-icon.tsx` (180×180), `app/opengraph-image.tsx` (1200×630), and
`app/manifest.ts`. The mark is rebuilt from the gavel glyph and amber
gradient already in `components/logo.tsx`, so it is brand-consistent
**but is still a placeholder** — the client's real logo is an open asset
request. Swapping it is one file, no other code changes. The light/dark
favicon pair is gone; the amber mark reads on both.

The OG card carries no headline statistics on purpose — the "12,400+"
figures are unverified (C5) and an OG card is a public marketing claim.

`manifest.ts` does not declare `purpose: "maskable"`: the mark is not
padded for Android's safe zone, so claiming it would get the gavel cropped
on adaptive-icon launchers. Service worker / offline support was **not**
built — old plan R7 names it the first thing to cut, and it buys little for
a listings site whose value is live data.

### 15.6 Typechecking is on for the first time

`next.config.mjs` had `typescript: { ignoreBuildErrors: true }` — which is
why "3 pre-existing type errors" and "`pnpm build` clean" coexisted in
every handoff since Sprint 2; the build printed `Skipping validation of
types`. All three were small ref-typing bugs:

- `call-to-action.tsx` / `hero.tsx` — `useRef<HTMLElement>` attached to a
  `<div>` → `useRef<HTMLDivElement>`.
- `projects.tsx` — a ref callback returning the assigned value, which
  React 19 rejects → wrapped the assignment in braces.

`tsc --noEmit` is now clean, `ignoreBuildErrors` is removed, and
`pnpm build` runs `Running TypeScript ...` and passes. **Do not put that
flag back.**

### 15.7 Verification performed

- `tsc --noEmit` clean (zero errors, first time in this project).
- `pnpm build` clean **with type validation enabled** — 24 routes, up from
  18 (the 6 new ones are icon, apple-icon, opengraph-image,
  manifest.webmanifest, robots.txt, sitemap.xml).
- **Route sweep, 23 routes, run twice — once against `next dev` and once
  against the real production build (`next start`), identical results:**
  all public pages 200; `/listing` → 307; `/profile` and `/admin` → 307 for
  a guest; unknown slug → 404; all six new SEO endpoints 200 with correct
  content types.
- **Leak test PASS against the production build**, not just dev.
- Access matrix 49/49.
- Search filters re-checked against the live 12 listings and match Sprint
  2.1 §8.4's recorded counts exactly: Pune 2, Mumbai 1, industrial 2,
  residential 6, agricultural 1, physical 8 + symbolic 4 = 12, price band
  6. (`/search` with no params returns 0 cards by design — `hasSearched`
  is false, pre-existing behaviour.)
- Image optimizer verified end to end: correct `srcset` at 8 widths,
  content negotiation returning AVIF to an `Accept: image/avif` client and
  WebP/JPEG below that.
- JSON-LD blocks parse on homepage and two listing pages.
- Viewport meta present.

### 15.8 Found, not fixed — flagged deliberately

- **`/partner/dashboard` returns 200 to a signed-out guest.** It is a
  static mockup with no auth guard and no real data, so nothing leaks, but
  it should not be publicly reachable at launch. It is `noIndex` and
  robots-disallowed now, which is not the same as protected. Ties into the
  open question in §7 about whether the partner portal is in scope at all.
- **`components/projects.tsx` is dead code** — see §15.4.
- **The `flatNumber`/`addressLine` overlap** — see §15.1.
- `desk.png`, `premium_property_bg.png`, `hously-4.png` referenced by
  nothing.

### 15.9 Environment note for the next session

The dev server here runs on **port 3100** (`pnpm dev --port 3100`) because
ports were already in use by an unrelated `gymos` project on this machine —
those processes were left alone. `pnpm` needs the PATH prefix from §14.1
and must be run through the **PowerShell tool**; it is not resolvable from
Bash. `C:` still has only ~1.5 GB free.

---

## 16. Project documentation set — added 2026-08-09

Three deliverables written at the user's request after Sprint 5. **All
three live at the repo root, not in a `project/` folder** — the user asked
for `project/`, but no such subdirectory exists on this machine (§14.1);
creating one purely for docs would have stranded them beside nothing and
contradicted that note. Flagged to the user, who can have them moved.

| File | What it is |
|---|---|
| `testing_guide.md` | 11-phase sequential test plan for everything built through Sprint 5 |
| `blockers.md` | Every blocker, prerequisite, risk and open question, with owners and dates |
| `project_calendar.html` | Six-week visual delivery calendar, 10 Aug → 15 Sep 2026 |

### 16.1 `testing_guide.md`

Ordered phases 0–11. Phase 0 environment, Phase 1 build integrity,
**Phase 2 is a blocking security gate** (both `scripts/` tests plus a
manual view-source check — nothing after it is trustworthy if it fails),
then public pages, the four access states, auth, engagement, admin, SEO
and performance, production-build parity, cross-browser.

Two things make it usable by someone who was not in these sessions:

- **Real expected values throughout**, taken from verified runs rather
  than invented: Pune → 2 results, physical 8 + symbolic 4 = 12, unlock
  leaves a balance of 4 and is still 4 after reload, sitemap has 20
  entries, homepage images ≈210 KB.
- **Phase 11 enumerates what is deliberately mock** — the eleven admin
  tabs, the dead `/search` alerts banner, the placeholder statistics — so
  testers do not raise tickets against unbuilt features.

### 16.2 `blockers.md`

12 blockers in four groups (hard external / content waits / decisions
needed / debt), plus environment and delivery risks. Every credential
claim was **re-verified against `.env.local` on the day**, not carried
forward from an earlier section.

Its central argument, which is the thing to repeat to the client:
**Razorpay is the critical path and is a build sprint, not a switch-flip.**
There is no payment code in the repo at all, so it is ~2 weeks of work
that cannot start until test credentials exist. Working back from 15 Sep
puts that build in 17–30 Aug, hence "test keys by 17 August". The document
also states the fallback plainly — past 31 Aug, either move the date or
launch the free tier with paid as a fast-follow, which is viable because
everything else is built and tested.

### 16.3 `project_calendar.html`

Six Mon–Sun weeks from 10 Aug landing exactly on Tue 15 Sep. Built on the
product's own shadcn token values (§Sprint 1.5) so it reads as part of
Boliwala rather than a generic template; `--radius: 0.25rem` and the
amber-on-navy masthead come straight from the app.

- Upper half is the **delivered** record — ten sprint cards plus an
  infrastructure strip — because the user specifically wanted everything
  built through 9 Aug shown, not just the remaining plan.
- Lower half is a CSS-grid Gantt. Status is encoded as a **left stripe
  and a hatch pattern**, not colour alone, so blocked bars survive
  greyscale printing and colour-blindness.
- Then the client-deadline gates (17 / 24 Aug, 31 Aug, 7 Sep) and the
  critical-path callout.
- Full light/dark token sets including the un-stamped `prefers-color-scheme`
  case; the Gantt scrolls horizontally inside its own container.

Also published as a private artifact:
`https://claude.ai/code/artifact/1c09594a-cddd-4553-9fb5-790f4f29519f`
To update it from a future session, pass that URL as `url` to the Artifact
tool — republishing the file path alone from a different conversation
mints a new URL.

### 16.4 A finding made while writing these

**Satoshi is not actually loading.** `app/fonts/Satoshi-Bold.woff2`,
`-Medium.woff2` and `-Regular.woff2` are each **609 bytes and are not
fonts** — they are CSS `@font-face` snippets pointing at
`//cdn.fontshare.com`, misnamed with a `.woff2` extension. Nothing in
`app/globals.css` references them; line 79 only names the family in
`--font-sans: "Satoshi", ...`, so the app has been silently falling back
to `system-ui` since the fonts were "self-hosted".

Two consequences: the shipped typography is not what the design intended,
and **R4 (the Satoshi commercial licence question) may be moot** — nothing
is being self-hosted to license. Left unfixed deliberately: the right fix
depends on the licence answer (buy and genuinely self-host, or switch to
the Plus Jakarta Sans fallback the prototype also used). Added to
`blockers.md`.

---

## 17. Pulled Sprint 5 + docs onto this machine (2026-08-09)

This session (the `C:\Users\hrida\...` machine, §2) built and pushed
Sprint 2.5 (§13) independently, then pulled `origin/main` and found two
commits it hadn't made: `0b88cb6` (Sprint 5) and `d6d952d` (§16's three
docs), both co-authored `Claude Opus 5`, from the second machine described
in §14.1 (`C:\Users\AARYAN KALE\...`). Confirms a second person/session
has direct push access to `main` and is working in parallel, not just a
one-off environment note. Fast-forward pull, no conflicts (`c48559d` →
`d6d952d`) — the two sessions touched disjoint files. Nothing rebuilt or
re-verified here; §15/§16 stand as written by the session that did the
work. Only correction made: the top summary's stale "not yet committed"
claim, fixed above once `git log` confirmed both commits were on
`origin/main`.

**Practical implication for whoever reads this next:** `git fetch`/`git
log HEAD..origin/main` before assuming this file reflects the remote —
main is no longer only touched by one machine at a time.
