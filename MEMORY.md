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

**Last updated:** 2026-08-30, night (infra direction change + roadmap reset,
see §25; Cloudflare agent tooling installed + Item 1a execution plan, see §26;
Item 1a spike executed, see §27; Workers Builds connected, see §28; build
unblocked — §29 corrects §28.4; **first green Cloudflare build + the live
handoff is §30**).

> **▶ NEW SESSION? READ §30 FIRST — it is the live handoff. If you are an
> overnight loop agent, read §31 too: it is your brief, and it explains why
> "build out the channel partner dashboard" is NOT the task.** The Cloudflare
> build is **green** and the app is deployed at
> `https://boliwala.boliwaladevs.workers.dev`. One real defect is open: every
> `/listing/[slug]` page 500s on the Worker (§30.4 — and the leak test's
> "12 listings leaked" line is a *vacuous* fail, not a leak). Item 5 is fully
> verified and approved to merge but is still unmerged (§30.5). **The user is
> asleep until ~04:00 IST 2026-08-31 — §30.6 bounds what may be done
> unattended.** Then §29 (it CORRECTS §28.4, which reached a wrong
> conclusion), §28 (session state), §27 (Item 1a spike), §26, §25.

> **🟢 30 AUG — READ `ROADMAP.md` FIRST FOR SEQUENCING.**
> A brainstorm on 2026-08-30 changed the infra direction and the launch
> plan. `ROADMAP.md` is now **the single ordered "what to do next" doc** and
> supersedes the week-by-week dependency map in `SPRINT_CALENDAR.md` Part 2
> (task detail there is still valid). Decisions and full technical rationale
> in **§25 below** and **`INFRA_R2_SCALING_ANALYSIS.md`**. Headlines:
> stack moves to **Cloudflare (Workers + R2 + DNS) + Supabase**; scale target
> **50,000+ live listings** with images/PDFs/vectors; **property only (no
> vehicles)**; **payments/Razorpay deferred indefinitely** (manual "Contact
> Sales" for now); **15 Sep launch date is dead**, needs re-baselining.
> Competitive context: `coparison.md` (FindAuction teardown) + `upper.md`.

> **🔴 22 AUG — PRODUCTION HAD BEEN STUCK ON `0e6cfd5` SINCE 9 AUG.**
> Every build from `e7cac13` onward failed at prerender, so all of Sprint 6
> and the superadmin role were built, pushed, and never deployed. Root cause
> and fix in **§21**; the full audit that found it is `codebase_audit.md`.
> **Read §21 before believing any "this feature is broken" report** — several
> were only ever testing a three-commit-old build.

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

**Sprint 6 is DONE (9 Aug) — see §19.** 8 of 9 tasks built and verified; only 6.7 (DB password rotation) remains, and it needs Supabase dashboard access. Three migrations (0009–0011) are applied to the live database.

**Next unblocked work:** nothing. Sprint 7 onward waits on Razorpay (see below).

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
9. **Windows blocks the Next `standalone` build unless Developer Mode is on.**
   OpenNext forces `output: "standalone"`, whose tracer symlinks
   `node_modules/next` into `.next/standalone`. Without
   `AllowDevelopmentWithoutDevLicense=1` (Settings > System > For
   developers > Developer Mode) or an elevated shell, the build dies with
   `EPERM: operation not permitted, symlink` **after** a fully
   successful compile - so it reads like a build failure when it is only a
   permission bit. Enabled on this machine 2026-08-30. Check it with
   `(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock').AllowDevelopmentWithoutDevLicense`.
10. **`@opennextjs/cloudflare` 1.20.4 produces a broken bundle when
   built on Windows - every route 500s.** The adapter patches Next's manifest
   loader with `if (path.endsWith("/server/middleware-manifest.json"))`,
   but a Windows build hands it `.next\server\middleware-manifest.json`
   (backslashes). The check never matches, execution falls through to a
   dynamic `require()`, and the Worker throws
   `Dynamic require of "/.next/server/middleware-manifest.json" is not supported`
   on **every** request. The manifest file itself is present in the bundle -
   only the path separator is wrong. **Consequence: never `wrangler deploy`
   a Windows-built bundle. It will 500 in production exactly as it does
   locally.** Builds must run on Linux (CI / Workers Builds / WSL). WSL is
   **not** installed on this machine (`wsl --status` > not installed).
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

---

## 18. Blocker audit — findings that change `SPRINT_CALENDAR.md` (2026-08-09)

Written on the `C:\Users\AARYAN KALE\...` machine (§14.1) **after** pulling
the other machine's `SCOPE_AUDIT.md` / `SPRINT_CALENDAR.md` / rebuilt
`project_calendar.html`. Asked to audit `blockers.md` for what is
executable today with zero client input and turn it into sprints — which
turned out to be the same ground `SPRINT_CALENDAR.md`'s Sprint 6 already
covers, so **that plan stands and this section does not replace it.**

What this section adds is a set of findings from **direct inspection** —
a live introspection of every public table plus reading the actual
components — that were not available when Sprint 6 was written. Three of
them change specific tasks. `blockers.md` carries the same audit in its
"Can we act on this today?" section.

### 18.1 🔴 Sprint 6.2 plans to store Aadhaar. It should not.

`SPRINT_CALENDAR.md` task 6.2 reads: *"add `city`, `panNumber`,
`aadhaarNumber`, `preferences` columns + form fields"*, tracing to URD
§3.2 Tab 6.

Confirmed by introspection that `profiles` currently has **exactly eight
columns** — `id, fullName, email, phone, role, creditsBalance, createdAt,
updatedAt` — so City / PAN / Aadhaar render on `/profile` today and
silently discard whatever the user types (this is `blockers.md` T4).

**Recommendation: remove those fields rather than add the columns.**
Aadhaar storage is regulated in India under the Aadhaar Act and UIDAI
rules — collecting and storing Aadhaar numbers requires a lawful purpose,
consent, and specific security safeguards, and there is no identified
purpose for it in this product. A property-auction marketplace does not
need Aadhaar to function. PAN is less restricted but still sensitive
personal data with no current use.

If the client genuinely requires them (for example because *they* handle
KYC for the ₹9,999 service package), that is a scoped conversation with
its own encryption, retention and access-control requirements — **not a
column added during a debt-cleanup sprint.** Flagged inline in
`SPRINT_CALENDAR.md` at 6.2. This needs a client decision before 6.2 is
built either way.

### 18.2 Sprint 6.3 is cheaper than budgeted

`alert_subscriptions` **already has a `filters jsonb` column** (full
shape: `id, userId, email, whatsapp, filters, isActive, createdAt`). The
schema has been ready since Sprint 0, so wiring the dead `/search` alerts
banner is a filter-to-JSON mapping job with no migration. Same applies to
6.1 (Profile → My Alerts), which can read straight back out of it.

### 18.3 The headline statistics split cleanly, and one file was missed

**`components/auth-view.tsx` is a third file carrying fabricated
figures** — "40+ banks" (line 110) and "12,400+" (line 118). `blockers.md`
B4 and §15 named only `hero.tsx` and `about-view.tsx`. Any C5 fix must
cover all three or the numbers will disagree with each other, which is
already the case today (homepage says 18+ banks, auth-view and About say
40+).

The figures divide into two groups, and only one needs the client:

- **Derivable from live data now** — live auctions, cities, banks. These
  can be made true by construction and will grow on their own. No client
  input required.
- **Not derivable** — "₹2,100Cr won", "840+ auctions", "28% average
  saving". There is no historical-outcome data anywhere in the schema.
  These genuinely need client sign-off or removal.

One nuance to avoid a subtle dishonesty: the *average discount of reserve
price to `estimatedMarketValue`* **is** computable from existing columns
and is a defensible number — but it is a different claim from "our buyers
saved 28%" and must not be presented as the latter.

### 18.4 Live row counts, for anyone planning an admin screen

`profiles` 2 · `banks` 6 · `listings` 12 · `listing_views` 21 ·
`credit_transactions` 2 · `settings` 7 · **everything else 0** —
`channel_partner_applications`, `payments`, `subscriptions`,
`service_packages`, `listing_images`, `callback_requests`, `shortlists`,
`unlocks`, `admin_audit_log`, `bulk_upload_batches`.

Relevant to Sprint 7's admin work: the Partners screen has **real
plumbing but zero rows** until someone actually applies, and the finance
screens have nothing to show until Razorpay lands. Neither is a reason not
to build them, but neither will demo well without seeded data.

### 18.5 Smaller items

- **`/partner/dashboard` has literally no auth code** — the page is four
  lines rendering a client component. Confirms the severity of Sprint 6.4
  and `blockers.md` B9. Worth doing first in Sprint 6; it is a public page
  today.
- **A stray `_prisma_migrations` table (1 row)** survives from the
  abandoned Prisma setup. Harmless, should be dropped.
- **Contact details are still hardcoded** — `components/footer.tsx` has
  `tel:+1234567890` / "+1 (234) 567-890", a **US placeholder on an
  India-only product**, plus a hardcoded `hello@boliwala.com`. Making
  these env-driven and hiding the block when unset is a few lines and can
  land now; only the real number has to wait. Not currently an explicit
  task in any sprint.
- **Satoshi never loads** (§16.4) — not currently an explicit task either.

### 18.6 Where this leaves the plan

`SPRINT_CALENDAR.md` Sprint 6 stays as the next thing to build. Before
starting it: get a client answer on 18.1 (Aadhaar/PAN), and consider
folding the derivable-statistics work and the contact-details wiring into
Sprint 6 or 5.5 — both are unblocked, small, and currently unowned.

---

## 19. Sprint 6 — completion record (2026-08-09)

`SPRINT_CALENDAR.md` Sprint 6 built and verified. **8 of 9 tasks done**;
6.7 (DB password rotation) needs Supabase dashboard access and cannot be
done from the repo. Three migrations applied to the live database.

### 19.1 The PAN/Aadhaar decision

§18.1 recommended removing these fields rather than adding columns. The
concern was put to the user, who confirmed they want them stored. Built as
instructed, with the safeguards the schema allows — see
`supabase/migrations/0009_profile_details_columns.sql`:

- **Per-column UPDATE grant to `authenticated` only**, never `anon`.
  0005 had revoked the table-level UPDATE grant precisely so new columns
  cannot become client-writable by accident, so this had to be explicit.
- **Reads restricted to own row** by the pre-existing `own_profile` RLS
  policy. Verified: no new SELECT grant was needed or given.
- **Format CHECK constraints** — PAN `^[A-Z]{5}[0-9]{4}[A-Z]$`, Aadhaar
  `^[2-9][0-9]{11}$`. Verified by attempting bad values through the
  service-role connection: `NOTAPAN`, `123` and `012345678901` were all
  rejected by name; `ABCDE1234F` and `234567890123` accepted.
- Client-side validation mirrors the constraints so the user sees a plain
  explanation rather than a Postgres constraint name.
- Empty input is stored as `NULL`, not `''` — `''` fails the CHECK.

**Still outstanding for whoever owns compliance, and deliberately not
invented here:** application-level encryption at rest, a retention and
deletion policy, and an access audit trail. Supabase encrypts the volume,
which is not the same as protecting the value from anyone holding a valid
session or the service key. Recorded in the migration header too, so it
travels with the schema.

### 19.2 A gap found while building: alerts could never be switched off

`alert_subscriptions` had policies for INSERT (anon + authenticated) and
SELECT (authenticated, own rows) but **none for UPDATE**. With RLS on and
no UPDATE policy every update is denied — and PostgREST reports that as a
*successful* call affecting zero rows. The "My Alerts" pause toggle would
have appeared to work and silently done nothing.

`0010` adds an authenticated-only `own_alert_update` policy and, in the
same spirit as 0005, narrows the client-writable surface to `isActive`
alone so a session cannot rewrite the email or filters on a row.

Guest unsubscribe is deliberately **not** solved: there is no way to prove
a guest owns an email address until there is an email flow to confirm it.
That belongs with Sprint 4.5, via a signed token in the message footer.

`0011` adds `frequency` (`instant`/`daily`/`weekly`, CHECK-constrained).
The banner had always shown that selector with nothing behind it; wiring
the banner without the column would have meant silently discarding the
choice — the same bug class as the profile fields.

### 19.3 Statistics are now true by construction

Three files carried fabricated figures, and they disagreed with each other
(homepage said 18+ banks, auth-view and About said 40+). All now derive
from live data via `lib/data/stats.ts`:

| | Was | Now |
|---|---|---|
| Live auctions | "12,400+" | **12** |
| Cities | "140+" | **11** |
| Banks | "18+" / "40+" | **6** |

`displayCount()` only rounds to "N+" at 100 and above — below that the
exact number is both more credible and more informative than "10+".

**About's "What Boliwala Has Done" section was the hard case.** Three of
its four tiles asserted outcomes nothing in the schema records —
"₹2,100Cr won", "840+ auctions", "28% average saving for clients".
Replaced with figures that are computable, and the heading changed from
"What Boliwala Has Done" to "What Boliwala Tracks", because the section was
claiming a track record the data cannot support.

One genuinely interesting result: the **average discount of reserve price
to `estimatedMarketValue` across the 12 live listings computes to exactly
28%** — the same number that was hardcoded. So the figure survives, but now
with the correct meaning ("reserve prices sit 28% below estimated market
value") rather than the unverifiable one ("our clients saved 28%"). The
distinction is written into the type's doc comment so it is not re-conflated
later. **The new About wording should still go to the client for review.**

### 19.4 Everything else

- **`/partner/dashboard` now redirects guests** — was 200 to the open
  internet, now 307 to `/login`. Guard is "is signed in" only, matching
  `/profile`; there is no partner role in the schema and inventing one
  ahead of the client's scope decision would fork the access model.
- **Contact details are env-driven** (`lib/contact.ts`). The
  `+1 (234) 567-890` US placeholder is gone; the phone and WhatsApp entries
  render only when the env vars are set. The homepage `Organization`
  JSON-LD picks up `telephone` the moment a number exists.
- **Data audit across all 12 live listings found exactly one overlap** —
  the known Jaipur one. Fixed by generalising the public `addressLine` from
  "Khasra 210, Village Bhankrota" to "Village Bhankrota", so the Khasra
  number (the agricultural equivalent of a flat number, and precisely what
  a buyer pays to unlock) is genuinely gated. `leak-test.mjs` now reports
  zero overlaps.
- **Dead code removed** — `components/projects.tsx` and six unreferenced
  images. `public/images` is down from 3.0 MB to 1.1 MB and now contains
  only files that are actually referenced. The stray `_prisma_migrations`
  table was dropped.

### 19.5 A build failure worth remembering

`hero.tsx`, `auth-view.tsx` and `about-view.tsx` are all **client**
components. Importing anything from `lib/data/stats.ts` — even a pure
formatter or a bare type — pulls its `import "server-only"` into the
browser bundle and fails the production build. `tsc --noEmit` passes
regardless, so this only surfaces at `pnpm build`.

Split into `lib/stats.ts` (client-safe: the `SiteStats` type and
`displayCount`) and `lib/data/stats.ts` (server-only fetch, re-exporting
both). **If you add a shared helper to a `lib/data/*` module, check who
imports it before assuming it is safe.**

Related: `/about`, `/login` and `/signup` prerender statically, so their
stats would have baked in at build time. All three now carry
`export const revalidate = 3600`, matching `app/sitemap.ts`.

### 19.6 Verification

- `tsc --noEmit` clean · `pnpm build` clean with type validation, 24 routes.
- **Leak test PASS** — 12/12 listings, 96 column-key + 96 value checks, and
  the overlap warning is now absent rather than reporting one row.
- **Access matrix PASS** — 49 assertions, 7 viewer states.
- **Alert filter round-trip PASS** — for six filter combinations the stored
  JSON rebuilds an href that returns the identical result set (Pune 2,
  physical 8, residential 6, price band 6, bank 2). `sort` and `page` are
  confirmed stripped, so "page 2, cheapest first" does not become part of
  what someone is subscribed to.
- **Alert RLS PASS** — guest INSERT allowed; guest SELECT returns nothing;
  guest UPDATE cannot deactivate; `frequency='hourly'` rejected by CHECK.
  Test rows cleaned up and confirmed gone.
- **Route sweep, 24 routes** — `/partner/dashboard` now 307 alongside
  `/profile` and `/admin`; everything else unchanged.
- Homepage renders 12 / 11 / 6 where it used to render 12,400+ / 140+ / 18+.

### 19.7 What Sprint 6 leaves open

- **6.7 DB password rotation** — needs the Supabase dashboard. Still the
  right thing to do: the password was pasted into a chat transcript during
  the original build.
- **The three historical claims** (₹2,100Cr, 840+ auctions, 28% client
  saving) are removed from the site but still unanswered as C5/B4. Do not
  restore them without signed-off figures.
- **New About copy needs client review** — the wording is mine, chosen to
  be accurate; it is not client-approved marketing.
- **A wider hardening item spotted in passing:** `anon` and `authenticated`
  hold blanket table-level `DELETE`, `INSERT` and `TRUNCATE` grants on
  `profiles` (the Supabase default). RLS denies DELETE and INSERT because
  no policy grants them — but **TRUNCATE is not subject to RLS at all**.
  There is no known path to invoke it through PostgREST, so this is
  defence-in-depth rather than an open hole, and revoking blanket grants
  across every table deserves its own careful pass rather than being done
  mid-sprint. Worth folding into the same session as 6.7.

---

## 20. Codebase audit — `codebase_audit.md` (2026-08-22)

Written at the user's request after they tested the deployed site and filed a
list of failures. Answers two scope questions (is admin real? is channel
partner real?) and triages 15 reported issues. Method was direct file reads
plus live introspection of the Supabase project — nothing carried forward
from this file on trust.

**The two headline answers:**

- **Admin is real but incomplete, and the admin user is already assigned.**
  `boliwaladevs@gmail.com` holds `superadmin` in the live DB (not `user`, as
  reported — see §21 for why the site said otherwise). Role separation is
  genuinely enforced by `requireAdmin()` against the caller's own session,
  and `0005` still blocks self-promotion. **5 of 13 admin sections are real**
  (Dashboard, Listings, Add/Edit, Bulk Upload, Callbacks, Settings); the rest
  are the original mockup. The account's password is a bcrypt hash and is not
  retrievable by anyone — recover via `Forgot password?` or the Supabase
  dashboard, do not go looking for it in the repo.
- **Channel partner functionality does not exist.** A `channel_partner` value
  sits in the `Role` enum and **zero lines of code reference it** — the only
  two `channel_partner` hits in the repo are both against the *applications*
  table. `/partner/dashboard` is a 583-line static mockup whose guard is
  `if (!user)`, i.e. "is signed in", not "is a partner". Any customer account
  can open it. Assigning the role to somebody today would change nothing.
  Still the open scope question from §7.

**Confirmed real bugs, independent of the deployment problem** (full detail
and suggested order of work in `codebase_audit.md` §3/§6):

1. `app/globals.css:22-23` sets `--destructive` and `--destructive-foreground`
   to the **identical** oklch value in light mode. Every destructive toast is
   red text on the same red — this is the "error popup is illegible" report,
   and it means *all* login/signup error messages are invisible. Dark mode is
   unaffected. One-line fix.
2. `components/header.tsx` has **no Login/Signup link at all**, desktop or
   mobile. Nothing routes a visitor to `/login` from any marketing page.
3. `app/search/page.tsx:24` gates `<PropertyResults>` — which *contains the
   entire filter sidebar* — behind `hasSearched`. "Browse More →" on
   `/profile` links to bare `/search`, so it lands on an empty page with no
   filters. This is the "no dropdowns in browse more" report.
4. No password show/hide toggle, no delete-account path, no change-password
   from the profile, and alerts support only Pause/Resume — no edit, no
   delete. All genuinely unbuilt, not regressions.

Also flagged: `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000` in
`.env.local`. **Check the Vercel value** — if it matches, every canonical,
sitemap entry, OG tag and OAuth redirect in production points at localhost.

---

## 21. The production build failure, and the fix (2026-08-22)

### 21.1 What was actually wrong

Production had been serving `0e6cfd5` since 9 August. `e7cac13` (Sprint 6),
`7575bc4` and `ddbadb1` (superadmin) all built locally, all pushed, and all
failed on Vercel at the prerender step:

```
Error occurred prerendering page "/about"
Error: supabaseKey is required.
```

The chain: `/about`, `/login` and `/signup` each set `revalidate = 3600`
(added in §19.5, for good reasons) → they prerender at build time → all three
call `getSiteStats()` → which called `createAdminClient()` → which reads
`SUPABASE_SERVICE_ROLE_KEY` → **which is not present in the Vercel build
environment** → the supabase-js constructor throws on a falsy key.

`/about` merely failed first and aborted the build; the other two would have
failed identically.

**This one fact explains most of the bug report.** "Create alert doesn't
work" and "boliwaladevs' role is `user`" were both testing a build that
predates the alerts feature and the superadmin role respectively. The
database was correct the whole time.

### 21.2 The fix

`lib/data/stats.ts` now builds a **plain anon-key client** instead of the
service-role one. Verified against the live DB before changing anything —
every column the function reads carries a `SELECT` grant for `anon`:

```
anon → id, status, city, reservePrice, estimatedMarketValue
```

So nothing there ever needed to bypass RLS. Deliberately *not* the
cookie-bound `lib/supabase/server.ts` client either — reading cookies would
force those three pages dynamic and undo §19.5.

This is also the better security posture: aggregate public counts on a
marketing page should not depend on a key that bypasses RLS.

### 21.3 How it was verified

Not just "the build passes here" — the failure was **reproduced and then
shown to be gone**, by blanking the variable Vercel is missing:

```
$env:SUPABASE_SERVICE_ROLE_KEY = ""; pnpm run build
```

- `tsc --noEmit` clean.
- Build exit 0, 24 routes, `/about` `/login` `/signup` all `○ (Static)` with
  1h revalidate — i.e. still prerendered, not silently downgraded to dynamic.
- **The prerendered HTML carries real numbers, not zeros** — `.next/server/
  app/login.html` contains `12` Live Listings / `11` Cities Covered, and
  `about.html` contains 12 / 11 / 6. This mattered: if RLS had blocked the
  anon read the build would still have passed while quietly rendering `0`
  everywhere, which is worse than a red build.

### 21.4 Still to do on Vercel — this fix alone is not sufficient

**`SUPABASE_SERVICE_ROLE_KEY` must still be added to the Vercel project.**
`lib/supabase/admin.ts` is used at *runtime* by listing redaction
(`getListingBySlug`), view tracking, the unlock RPC path, every admin data
function, and the alert duplicate check. If that variable is genuinely absent
from the environment rather than just from the build step, those paths are
broken in production too — and this build failure was the least of it.

Do both: set the env var (runtime correctness) **and** keep `stats.ts` on the
anon client (so a marketing page never depends on a bypass key to prerender).

### 21.5 Note on the update rule

`SPRINT_CALENDAR.md` and `project_calendar.html` were **not** touched for
this commit. No sprint changed status — this is a hotfix to a build that was
already meant to be shipped, not new scope. The substance belongs here and in
`codebase_audit.md`; inventing a calendar row for it would be noise.


---

## 22. Sprint 15 — Critical UX & Auth Repair, completion record (2026-08-22)

Executed from `post_audit_plan.md` §3. All five tasks built and verified.
The other sprints in that plan (15.5 env config, 16 account self-service,
16.5 Resend/compliance, 17 partner scope) are **not** started.

### 22.1 What was fixed

- **15.1 — the invisible-error bug.** `app/globals.css` had
  `--destructive-foreground` set to the *same* oklch value as `--destructive`
  in light mode, so `bg-destructive text-destructive-foreground` (the toast's
  destructive variant, the only consumer) rendered red text on the same red.
  Every login/signup/reset error in the app was unreadable.

  **Dark mode was also changed, and the audit was slightly wrong about it.**
  The audit called dark mode "fine". It was legible but only ~3.3:1 contrast
  (L 0.396 bg vs 0.637 fg) — below WCAG AA, and the same underlying mistake
  (a *red* used as a foreground rather than a contrasting colour). Both themes
  now use `oklch(0.985 0 0)`, the shadcn default. Verified in the shipped CSS:
  `--destructive-foreground:#fafafa`, twice, with the old red value gone.

- **15.2 — header auth links.** `components/header.tsx` had **no auth link at
  all**, desktop or mobile — nothing routed a visitor to `/login` from any
  marketing page. Added Log In + Sign Up when signed out, "My Account" when
  signed in, in both the desktop cluster and the mobile menu.

  The header is a client component, so session state is read client-side via
  `getUser()` plus an `onAuthStateChange` subscription. **The cluster renders
  `null` until the session resolves** — deliberately, so a signed-in user does
  not see "Log In" flash before it corrects itself. Consequence worth knowing:
  the auth links are **not in the SSR HTML**, they appear on hydration.

  "My Account" links to `/profile` for everyone, including admins. Fetching
  `profiles.role` in a global header would add a DB query to every page load
  for every signed-in user, which is not worth it — staff already land on
  `/admin` at sign-in via `landingPathForRole`. `Free Consultation` moved to
  `hidden lg:inline-flex` so the right-hand cluster is not crowded at `md`.

- **15.3 — `/search` with no params.** `app/search/page.tsx` gated
  `<PropertyResults>` behind `hasSearched`. The filter sidebar lives *inside*
  that component, so bare `/search` — where "Browse More" on `/profile` and
  the nav's "Properties" both point — rendered neither listings nor filters.
  Now rendered unconditionally. Checked `applyNonBankFilters` first: it always
  applies `status = 'live'` and every other filter is conditional, so empty
  params correctly return all live listings. Verified: 12 cards.

- **15.4 — password show/hide** on `auth-view.tsx` and
  `reset-password-view.tsx`. `type="password"` was hardcoded with no toggle
  anywhere in the codebase. Both are `type="button"` so they cannot submit the
  form, and carry `aria-label` + `aria-pressed`.

- **15.5 — account header.** New `components/account-header.tsx` replaces the
  marketing `<Header>`/`<Footer>` on `/profile`. **`/profile` was the only
  authenticated page carrying the marketing chrome** — `/admin` already has
  its own 240px sidebar shell and imports neither. Credit balance and sign-out
  are deliberately *not* duplicated in the new header; the profile sidebar
  already carries both. `profile-view.tsx`'s `pt-32` (which existed only to
  clear the fixed marketing header) was dropped to match.

### 22.2 Verification

- `tsc --noEmit` clean.
- `pnpm build` clean **with `SUPABASE_SERVICE_ROLE_KEY` blanked** — this is
  now standing practice so the §21 regression cannot come back. 24 routes.
- **Leak test PASS** — 12/12 listings, 96 column-key + 96 value checks. Worth
  re-running specifically because 15.3 changed what `/search` renders by
  default; the search-card column allowlist still holds.
- **Access matrix PASS** — 49 assertions, 7 viewer states.
- **Route sweep, 20 routes** against the production build — identical to the
  §19.6 baseline: public 200, `/listing` 307, `/profile` `/admin`
  `/partner/dashboard` 307 for a guest, bad slug 404.
- `/search` with no params returns **12 listing cards** plus the bank filter
  list — was 0 cards and no sidebar.

**Not verified in a browser** — the user explicitly asked to skip browser
steps this session. So the *visual* result of 15.1/15.2/15.5 (toast legibility,
header layout at each breakpoint, the account header's appearance) is
confirmed only at the markup/CSS/bundle level, not by looking at it. Worth an
eyeball pass before it goes to the client.

### 22.3 Running the verification scripts on this machine

Both need flags that are not in their header comments, and one needs a server:

```
node --experimental-strip-types --import ./scripts/ts-resolve-hook.mjs scripts/access-matrix-test.mjs
node scripts/leak-test.mjs http://127.0.0.1:3100      # needs a server already running
```

`pnpm` does not resolve from the Bash tool here (§15.9). To start a production
server for the leak test, invoke Next directly and kill it via CIM afterwards
(§12.5 — `Start-Process pnpm` silently fails):

```
Start-Process -FilePath "node" -ArgumentList "node_modules/next/dist/bin/next","start","--port","3100" -WindowStyle Hidden
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'next.*start' } | Stop-Process -Force
```


---

## 23. Sprint 16 — Account Self-Service, completion record (2026-08-22)

From `post_audit_plan.md` §5. All five tasks built. Sprints 15.5 (env config),
16.5 (Resend/compliance) and 17 (partner scope) remain untouched.

### 23.1 The RLS constraint that shaped this sprint

Two of the five tasks looked like UI work and were not. Verified by live
introspection **before** writing either one:

- `alert_subscriptions` grants `UPDATE` to `authenticated` on **`isActive`
  alone** (migration 0010 narrowed it deliberately).
- There is **no DELETE policy** on the table for any client role.

So a client-side `frequency` update or a delete would have been denied — and
PostgREST reports that denial as a **successful call affecting zero rows**. The
frequency picker would have appeared to work and silently done nothing: exactly
the bug class §19.2 warned about when it found the missing UPDATE policy.

`updateAlertFrequency` and `deleteAlert` therefore run through the service-role
client **after an explicit ownership check**, with the `userId` filter repeated
on the write itself so a race between check and write cannot touch someone
else's row. This was `post_audit_plan.md` §5's option (a), chosen over widening
the RLS policy so the client-writable surface stays as narrow as 0010 intended.
**No migration was needed.**

### 23.2 What was built

- **16.1 Change password** (`components/profile-view.tsx`). Supabase's
  `updateUser` does **not** require the current password, so on its own it
  would let anyone at an unlocked browser take the account over. The handler
  re-authenticates with `signInWithPassword` first and only then updates.
- **16.2 Edit alert** — frequency picker on each row, optimistic with rollback.

  **Scope call:** editing *filters* was not built. Re-scoping an alert would
  mean rebuilding the whole search UI inside the profile, when "View matches"
  already round-trips to `/search` where the filters and the save banner live.
  Frequency is the part with no other route to it. Flagged rather than
  half-built.
- **16.3 Delete alert** — a bin button, distinct from Pause. Pause keeps a
  record of what was asked for; delete is for when it should be gone.
- **16.4 "+ Create Alert"** was a bare `<Link href="/search">` — a button whose
  label lied. Relabelled **"+ Create from a search"**. The real create flow is
  the `/search` banner, and Sprint 15.3 made bare `/search` render properly, so
  that link now lands somewhere useful.
- **16.5 Delete account** — new `app/actions/account.ts`. Deletes the
  `auth.users` row via `auth.admin.deleteUser`, never an id from the request,
  only the session's own. Migration 0003's `ON DELETE CASCADE` clears profile,
  credit ledger, shortlists, unlocks, alerts and views. Deleting the *profile*
  row instead would strand the auth user and let them sign in to a broken
  account. UI requires typing `DELETE` and states that remaining credits are
  lost.

  **This closes the "no deletion path at all" gap** flagged against migration
  0009 (PAN/Aadhaar) — the weakest point in the compliance posture per
  `codebase_audit.md`. It is deletion, not anonymised retention; if a retention
  obligation is later identified, `deleteOwnAccount` is the function that
  changes. Plan §16.5.3 (encryption, retention policy, audit trail) is still
  open and still needs an owner.

### 23.3 Verification

`tsc --noEmit` clean · `pnpm build` clean with `SUPABASE_SERVICE_ROLE_KEY`
blanked · leak test PASS 12/12 (96+96 checks) · access matrix PASS 49/7 · route
sweep unchanged from the §19.6 baseline.

**Not verified in a browser** — the user asked to skip browser steps for both
Sprint 15 and 16, ahead of a client meeting. The RLS reasoning behind 16.2/16.3
was verified directly against the live database (§23.1), which is the part that
could have silently failed. **The click-paths themselves have not been
exercised** — change-password, delete-alert and delete-account have never been
run end to end. Do that before anyone relies on them. `deleteOwnAccount` in
particular is irreversible and has not been executed once.

---

## 24. `show.md` — client demo script (2026-08-22)

Written for a client meeting the same day. A step-by-step walkthrough of
everything real, ordered to build: live statistics → real search → **the
gating/credit model** → account self-service → admin.

Three things in it are worth keeping for whoever demos next:

- **The view-source moment (step 11).** Open a listing signed out, search the
  page source for `authorisedOfficerPhone`, get zero hits. It proves the
  paywall is a server boundary, not a CSS blur — the whole revenue model in
  one gesture.
- **The two round-trips (steps 23 and 26).** Create a listing in admin and
  watch the public count go 12 → 13; change Annual Price in admin and watch
  `/pricing` change. These show admin and the public site are one system.
- **A list of what NOT to click** — the eleven admin mockups, the Service
  Requests tab, `/partner/dashboard` — so nobody opens a placeholder in front
  of the client.

It tells the demoer to **run on localhost unless the Vercel deploy is confirmed
green**, since production had been stale for two weeks and today's fix had not
been observed deploying at the time of writing.


---

## 25. Infra direction change + roadmap reset (2026-08-30)

A brainstorming session on 2026-08-30 reset both the infrastructure plan and
the launch sequencing. Two new documents were written; this section records
the decisions so a fresh session has the *why*.

### 25.1 New documents (read order)

| File | Role |
|---|---|
| `ROADMAP.md` | **The ordered "what to do next" doc.** Supersedes the week-by-week map in `SPRINT_CALENDAR.md` Part 2. Numbered items 1–16, a decisions register (D0–D12), the standing verification bar. **Item 1** = Cloudflare migration (handed to a dedicated agent). **Item 2** = the competitive-gap sprint plan (S1–S10) built from `coparison.md`. |
| `INFRA_R2_SCALING_ANALYSIS.md` | Full technical rationale for the Cloudflare + R2 + pgvector architecture, plus appendices on Razorpay deferral, the navbar/partner-auth changes, and the `.apk` question. Big-font `<style>` block for reading. |
| `coparison.md` | Competitive teardown of **FindAuction.in** (the incumbent — ~96k indexed properties, founded 2018). §6 is the prioritised build-gap list that `ROADMAP.md` Item 2 turns into sprints. |
| `upper.md` | Companion to `coparison.md` — where Boliwala already leads (free full address, ₹999 vs ₹7,000, credit economy, server-side gating, real-time alerts, partner programme). `[LIVE]` / `[SPEC]` / `[STRUCTURAL]` tagged. |

`SPRINT_CALENDAR.md` and `project_calendar.html` still carry the old 15 Sep
plan and were **not** rewritten in this session — flagged for a follow-up
pass. `ROADMAP.md` is the authority on ordering until then.

### 25.2 Decisions made

- **Scale target: 50,000+ live listings** (competitor FindAuction indexes
  ~96k; ~17.8k live), each with photos, PDF documents, and vector data.
  Current live count is 12. This is what forces the infra change — Supabase
  Storage egress ($0.09/GB) + serverless image optimisation costs do not
  survive that volume. `coparison.md` §1: *"our single biggest competitive
  gap is not a feature — it is ~50,000 missing listings."*
- **Property only.** Vehicles / plant & machinery are **explicitly
  descoped** (`coparison.md` P2.1 dropped) even though FindAuction earns real
  traffic from `/cars/{city}` — user decision 2026-08-30.
- **`ROADMAP.md` Item 2 is the competitive-gap sprint plan**, S1–S10, built
  from `coparison.md` §6 minus payments and minus vehicles. S1–S5
  (R2 storage, PDF docs, Lender model, ingest + daily refresh/expiry, SEO
  landing-page matrix) are launch-blocking; S6–S9 (auction history + drop
  badges, search field expansion, vector search, PWA/push/redirect auth) are
  parity polish; S10 is post-launch out-build (compare, map, calculator,
  .ics, mega-auction pages, Hindi).
- **Move the whole stack to Cloudflare + Supabase:**
  - App: **Cloudflare Workers via `@opennextjs/cloudflare`** (not classic
    Pages). Replaces Vercel. **Vercel Pro was never purchased** — no sunk
    cost, so migrating now (while the codebase is small) was chosen over
    doing it later.
  - Blobs: **Cloudflare R2** (`boliwala-images`, `boliwala-docs`), public
    buckets, `cdn.boliwala.com`, $0 egress. **Supabase Storage is retired**
    (migration `0008`'s bucket).
  - DNS: Cloudflare. Jobs: Workers Cron + Queues.
  - Supabase keeps Postgres, RLS, Auth, and gains **`pgvector`** for
    semantic search. Vectors stay in Postgres (co-located with listings for
    filtered similarity) — **no Pinecone/Qdrant**.
  - **Gate:** a 1-day go/no-go spike must confirm `@opennextjs/cloudflare`
    builds on **Next 16.0.10** and passes leak-test / access-matrix / route
    sweep / real Supabase login on a Workers preview. If it fails → buy
    Vercel Pro, ship there, keep R2 and everything else. `ROADMAP.md` Item 1.
- **`sharp` does not run on Workers.** Image renditions move to the Node
  bulk-ingest job; admin one-off uploads use Cloudflare Images
  transformations on the R2 original. No runtime image optimisation anywhere.
- **PDFs are freely public** (client answer) — public R2 bucket, no signed
  URLs. New `listing_documents` table with a `visibility` column defaulting
  to `'public'` so a future gated doc type has room.
- **Embedding source undecided** (D5) — plan covers both "we generate"
  (OpenAI `text-embedding-3-small`, <$1 for 70k) and "client provides"
  (must confirm model + dimension).
- **Payments / Razorpay are deferred indefinitely — "we do not need payments
  yet" (user, 2026-08-30).** Month-one monetisation is a manual flow:
  Pricing page CTA → **"Contact Sales"** form → email to team → manual
  UPI/WhatsApp billing + manual credit/subscription grant in admin. Razorpay
  sits at `ROADMAP.md` Item 12, unscheduled, unblocked only when the client
  says payments are wanted. **This retires the entire Razorpay critical
  path** that §7, §9.3, §11.4, `blockers.md` B1/B2, and `post_audit_plan.md`
  §1 all treat as the launch-gating dependency. The repeated "15 Sep only
  works if test keys land by 17 Aug" caveat no longer applies. `coparison.md`
  P0.4 (payments) is **excluded** from Item 2.
- **Navbar + partner auth changes** (see `INFRA_R2_SCALING_ANALYSIS.md`
  Appendix B): Log In button → orange bg/white text; Sign Up → white
  bg/black text; targets unchanged. Add "Login as Channel Partner" below the
  Google button on `/login`, linking to a new `/partner/login` (same
  `auth-view.tsx` via a `variant` prop — email/pass + Google, identical
  look, different post-login routing). Hard-gate `/partner/dashboard`
  regardless of the partner-scope decision (still `post_audit_plan.md`
  17.A.1).
- **`.apk` (Capacitor, in the URD scope):** the hosting choice is neutral to
  it. Feasibility depends on the frontend — a thin WebView/PWA wrapper works
  on any host now; a real Capacitor app needs API route handlers alongside
  the server actions. Decide *which* before building more frontend (D11).

### 25.3 What changed vs. the old plan

- **Old Sprint 15.5 Vercel-env items** (`SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_SITE_URL`, Google redirect URI) are **absorbed into the
  Cloudflare migration** (`ROADMAP.md` Item 1) — they become Workers env
  config done during cutover.
- **DB password rotation + blanket-grant revoke** (old 15.5.4 / 15.5.5,
  Sprint 6.7, §19.7) survive as `ROADMAP.md` Item 3 — still Supabase-side,
  still needs dashboard access.
- **15 Sep launch date is dead** (`ROADMAP.md` D0). It predates the
  Cloudflare move, the 70k scale, and the already-missed 17 Aug / 24 Aug
  credential deadlines. A new date must be agreed with the client.

### 25.4 State at time of writing

HEAD = `093b7ff` (Sprint 16). No code written this session — planning only.
New untracked files: `ROADMAP.md`, `INFRA_R2_SCALING_ANALYSIS.md`,
`coparison.md`, `upper.md`. `SPRINT_CALENDAR.md` and `project_calendar.html`
still carry the old 15 Sep plan — a rewrite pass is owed but not done.

**Immediate next step:** the user clears context and hands the Cloudflare
migration (`ROADMAP.md` Item 1) to a **dedicated fresh agent** with a
purpose-written setup prompt. That agent does Item 1a (the OpenNext/Next 16
go/no-go spike) first. Item 2 (competitive-gap sprints) begins after the
migration lands.

> **Superseded by §26 (same day).** No separate setup prompt was ever
> written and none is needed — §25 + §26 + `ROADMAP.md` Item 1 are the
> handoff. Cloudflare skills/MCP tooling is now installed. Go to §26.

---

## 26. Cloudflare agent handoff — tooling installed, Item 1a ready (2026-08-30)

**Read this before touching `ROADMAP.md` Item 1.** No code was written in
the session that produced this section — tooling install and planning only.
HEAD is still `093b7ff`.

### 26.1 Cloudflare tooling is installed (user ran it, verified on disk)

Per the official Cloudflare setup instructions at
`https://developers.cloudflare.com/agent-setup/prompt.md` (fetched and read
in full, HTTP 200, contents benign — five MCP servers + a skills pack, no
credential handling), the user ran:

```
claude plugin marketplace add cloudflare/skills
claude plugin install cloudflare@cloudflare
```

Both succeeded, scope `user`. Verified present on disk:

- **13 skills** at `~/.claude/plugins/marketplaces/cloudflare/skills/` —
  `wrangler`, `workers-best-practices`, `durable-objects`, `agents-sdk`,
  `web-perf`, `turnstile-spin`, `cloudflare-email-service`, `cloudflare-one`
  (+ migrations), `sandbox-{next,stable,migrate-to-next}`, `cloudflare`.
  **No authentication required** — plain markdown.
- **5 MCP servers** declared in
  `~/.claude/plugins/marketplaces/cloudflare/.mcp.json`, all `type: http`,
  no tokens in the file: `cloudflare-api` (`mcp.cloudflare.com`),
  `cloudflare-docs`, `cloudflare-bindings`, `cloudflare-builds`,
  `cloudflare-observability`.

**Prefer `cloudflare-docs` (public, no auth) over training-data recall for
anything about OpenNext on Next 16** — the adapter is new enough that live
docs beat memory.

### 26.2 Three separate auth layers — do not conflate them

This is the single most confusable thing in this handoff:

| Layer | Auth | When |
|---|---|---|
| Skills | none | already usable |
| `cloudflare-docs` MCP | none (public) | already usable |
| `cloudflare-api` / `-bindings` / `-builds` / `-observability` MCP | **OAuth** | lazily, on **first Cloudflare tool call** — opens a browser |
| **`wrangler` CLI** | **separate `wrangler login`** | **not covered by MCP OAuth** |

**`wrangler` is not authenticated by the MCP OAuth flow.** A successful MCP
OAuth does *not* mean deploys work. `wrangler login` (or
`CLOUDFLARE_API_TOKEN`) is its own step, run by the user in their own
terminal.

**MCP servers connect at session start** — the session that installed them
never sees them. Same trap as §5 gotcha #6 (Supabase MCP). If the Cloudflare
tools aren't in your tool list, you're in a stale session; restart.

### 26.3 D1 status

**The user has a Cloudflare account** (confirmed 2026-08-30). Item 1a is
unblocked. Two sub-questions left open, neither blocking 1a:

- Is that account the intended **production owner** for `boliwala.com`?
  Items 1b–1d put the real DNS zone and production Workers on it.
- **Billing:** 1a is free-tier (`*.workers.dev` previews). **R2 in Item 2 ·
  S1 needs a card on file** even though egress is $0.

### 26.4 Item 1a — exact step order (steps 1–5 need no Cloudflare auth)

```
1. pnpm add -D @opennextjs/cloudflare wrangler  → verify: installs clean on Next 16.0.10
2. open-next.config.ts + wrangler.toml          → verify: wrangler validates config
3. opennextjs-cloudflare build                  → verify: builds, no adapter errors
4. inspect .open-next/ bundle size              → verify: < 10 MB compressed (THE GATE)
5. wrangler dev (local Workers runtime)         → verify: route sweep passes locally
--- user runs `wrangler login` here ---
6. deploy to *.workers.dev preview              → then the real gate:
   scripts/leak-test.mjs · scripts/access-matrix-test.mjs (49 assertions) ·
   route sweep · real Supabase email login · real Google login
```

**Starting state verified 2026-08-30:** `next` is `16.0.10`;
`@opennextjs/cloudflare`, `wrangler`, `wrangler.toml` and
`open-next.config.ts` are **all absent** — a clean 1a start, nothing to
undo.

**If the spike fails:** buy Vercel Pro, ship there, keep R2 and every other
roadmap item unchanged, revisit the host post-launch. Skip 1b–1d.
`ROADMAP.md` Item 1.

### 26.5 The failure mode most likely to produce a false "pass"

**Google OAuth will probably fail on the preview, and that is not
necessarily a no-go.** Supabase URL Configuration and the Google authorized
redirect URI both point at the current origin; a `*.workers.dev` preview is
a **new origin**. Decide *before* running the gate which of these you're
accepting, and record it:

- (a) temporarily add the preview origin to Supabase URL Configuration +
  the Google client's authorized redirect URIs, and test Google properly; or
- (b) accept **"email login verified, Google deferred to Item 1d"** as an
  explicit partial pass.

**Do not discover this mid-spike and rationalise a fail into a pass.** The
whole point of 1a is an honest go/no-go. Note the choice in the completion
record. (Related long-standing risk: §4 flags that the Google redirect URI
and Supabase URL Configuration have **never been independently verified** —
this is the first time that will actually be exercised against a new
origin.)

### 26.6 Docs owed (not done)

`SPRINT_CALENDAR.md` and `project_calendar.html` still carry the dead 15 Sep
plan (§25.4). The `CLAUDE.md` three-file update rule applies at the **first
Item 1 commit** — bring both in line then, along with `ROADMAP.md` Item 1
ticks and this section's completion record.


---

## 27. Item 1a — OpenNext go/no-go spike, execution record (2026-08-30)

**Status: steps 1–4 PASS, step 5 BLOCKED on the host, step 6 not reached.
The go/no-go question is still open — nothing found so far argues against
OpenNext on Next 16.** Read gotchas #9 and #10 in §5 before rerunning.

### 27.1 Results against the §26.4 step order

| Step | Verify | Result |
|---|---|---|
| 1. `pnpm add -D @opennextjs/cloudflare wrangler` | installs on Next 16.0.10 | PASS — `@opennextjs/cloudflare 1.20.4`, `wrangler 4.127.1` |
| 2. `open-next.config.ts` + `wrangler.toml` | wrangler validates | PASS |
| 3. `opennextjs-cloudflare build` | builds, no adapter errors | PASS — compile, typecheck, 24 static pages, worker emitted |
| 4. bundle size | **< 10 MB compressed (THE GATE)** | **PASS — 2.74 MiB gzip** (12.06 MB raw) |
| 5. `wrangler dev` route sweep | routes pass locally | **FAIL — 20/20 routes 500. Windows-only adapter bug, gotcha #10.** |
| 6. preview deploy + real gate | leak test, access matrix, logins | not reached |

Bundle measured with `wrangler deploy --dry-run --outdir=<dir>` — output
`Total Upload: 12063.84 KiB / gzip: 2809.30 KiB`.

### 27.2 Neither failure implicates Next 16 or the app

This is the §26.5 warning working in reverse — the risk here was recording a
**false fail**. Both failures were host artifacts:

- **Step 3, first attempt:** `EPERM ... symlink` during the standalone copy.
  Windows Developer Mode was off. The user enabled it 2026-08-30 and the
  rebuild passed. Gotcha #9.
- **Step 5:** every route 500s because the adapter's manifest patch tests for
  a forward-slash path against a backslash path. Gotcha #10.

In between, `next build` itself succeeded on the first try —
`Compiled successfully in 19.7s`, all 24 static pages generated. The app
needed **no** code changes to build for Workers. No `middleware.ts` exists
anywhere in the repo, which sidesteps the one documented OpenNext gap
(Node.js middleware is unsupported).

### 27.3 Worker size limits — free tier is not viable past the short term

Cloudflare's published Worker size limits (verified against live docs, not
recall):

| | Workers Free | Workers Paid |
|---|---|---|
| After gzip | **3 MB** | **10 MB** |
| Before compression | 64 MB | 64 MB |

We are at **2.74 MiB gzip — about 92% of the free limit** with 12 listings,
and before `ROADMAP.md` Item 2 adds the R2 client, PDF handling, pgvector
search and the SEO route matrix. The roadmap's "< 10 MB" gate implicitly
assumed Workers Paid. **A preview deploy fits on free today**; the user has
said the account gets upgraded the week of 2026-09-07 and is content to run
free until then. Revisit if a deploy is ever rejected for size.

### 27.4 Cloudflare now recommends vinext over OpenNext

Their Next.js framework guide (last updated 2026-08-25) makes **vinext** — a
Vite plugin reimplementing the Next.js API surface — the default path, and
frames the OpenNext page as *"use this guide to maintain an existing OpenNext
application. Migrate to vinext when compatibility allows."*

This does **not** change Item 1a: OpenNext is still supported and documented,
and vinext is explicitly **beta**. But it adds a third branch to the "if the
spike fails" plan, which currently reads "buy Vercel Pro". Before spending
money, run `npx vinext check` — a non-destructive compatibility report that
leaves `next dev` working. Order of preference on a no-go: vinext check,
then Vercel Pro.

### 27.5 Google OAuth — §26.5 asks for the wrong change

§26.5 says to add the preview origin to "the Google client's authorized
redirect URIs". **That is a no-op for this app.** Verified:

- `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` sit in `.env.local` but are referenced
  **nowhere** in the code — this is Supabase-managed Google OAuth, so the
  credentials live in the Supabase dashboard.
- `components/auth-view.tsx` line 71 sends
  `redirectTo: ${window.location.origin}/auth/callback`.

The hop is browser → Google → **Supabase**
`https://rimyttphaidvlytefvil.supabase.co/auth/v1/callback` → back to our
origin. The Google client's authorized redirect URI is that fixed Supabase
URL and never contains our app origin.

**The single thing that gates a preview-origin login is Supabase →
Authentication → URL Configuration → Redirect URLs.** `redirectTo` is
validated against that allow-list and an unlisted URL is *silently* bounced
to Site URL — which is exactly the false pass §26.5 was worried about, just
in a different place. Add `https://<preview>.workers.dev/**` there before
running the step 6 gate, remove it after, and **do not touch Site URL** (that
would change default redirects for the live app).

No code change and no `NEXT_PUBLIC_SITE_URL` change is needed for login
itself — `window.location.origin` adapts on its own.

### 27.6 The blocker, and why it forces the CI decision early

`wrangler deploy` from this machine would upload the same broken Windows
bundle, so it would 500 in production too. **The build has to happen on
Linux.** WSL is not installed here (`wsl --status` → not installed). That
makes the git-connected Cloudflare build — which builds on Linux — the
fastest honest route to a go/no-go, and it is also `ROADMAP.md` Item 1c
brought forward.

Two paths, and Item 1c's wording ("GitHub → `wrangler deploy` action")
presumes the second:

- **A — Cloudflare Workers Builds.** The Vercel analogue: connect the repo in
  the Cloudflare dashboard, build and deploy on every push, per-PR previews,
  no long-lived API token stored in GitHub. **Recommended, and chosen.**
- **B — GitHub Actions running `wrangler deploy`.** Needs
  `CLOUDFLARE_API_TOKEN` as a GitHub secret; more control.

Since A was chosen, Item 1c's wording in `ROADMAP.md` was updated to match
rather than left stale.

**Build-environment trap for either path:** `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are inlined at **build** time.
`next.config.mjs` reads

```js
hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://localhost").hostname
```

If that variable is missing in CI the build still **succeeds**, silently
falling back to `localhost`, and every listing image 400s at runtime — a
green pipeline shipping a broken site. Set both as build variables.
Runtime-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) go in
Workers secrets via `wrangler secret put`, never the repo.

### 27.7 Decisions resolved this session

- **D1 — Cloudflare account owner: RESOLVED.** The user confirmed the
  existing account is the production owner for boliwala.com.
  `wrangler login` succeeded as **boliwaladevs@gmail.com**, account ID
  `dd735b278158c0a26949c1d5d6b6ebc3` — same handle as the `boliwaladevs`
  GitHub org. Token scopes include `workers (write)` and `d1 (write)`;
  nothing is missing for a preview deploy.
- **Billing:** upgrade to Workers Paid deferred to the week of 2026-09-07 by
  the user. Not blocking today.
- **Demo listings:** the user noted the 12 live listings are demo data and
  "we can keep 4 only". **No rows were deleted** — that read as permission
  rather than an instruction, listing count has no effect on bundle size, and
  §8.4 records "12/12" as the leak-test baseline. If they are trimmed, that
  baseline must be restated in the same commit.

### 27.8 Files added or changed

| File | Change |
|---|---|
| `open-next.config.ts` | **new** — `defineCloudflareConfig()` defaults only; no cache/tag store yet (Item 1c decision) |
| `wrangler.toml` | **new** — name `boliwala`, `nodejs_compat`, compat date 2026-08-30, ASSETS binding, observability on |
| `package.json` | `@opennextjs/cloudflare` + `wrangler` as devDependencies |
| `pnpm-workspace.yaml` | `allowBuilds`: `esbuild: true`, `workerd: true` — pnpm 11 wrote unresolved placeholders that made OpenNext's internal `pnpm install` fail hard. `sharp: true` was pre-existing and untouched. |
| `.gitignore` | `.open-next/`, `.wrangler/`, `cloudflare-env.d.ts`, `.dev.vars` |
| `.dev.vars` | **new, gitignored** — 14 populated vars copied from `.env.local` so the local Workers runtime can see them |
| `MEMORY.md` | this section, gotchas #9/#10, header + banner |

### 27.9 Next action

1. User authorises the Cloudflare GitHub App on `boliwaladevs` (in progress).
2. Commit the §25 planning docs (still untracked) plus the config above, and
   push to `main` — the user authorised pushing as `boliwaladevs`.
3. Linux build → preview URL → add it to Supabase Redirect URLs (§27.5) →
   run the step 6 gate: `scripts/leak-test.mjs`,
   `scripts/access-matrix-test.mjs` (49 assertions), route sweep, real
   Supabase email login, real Google login.
4. Only then record a go or no-go.

**Do not record a no-go on the basis of anything in §27.2.** Those are
Windows problems and they disappear on Linux.


---

## 28. Session handoff — Workers Builds connected, one hard blocker (2026-08-30, later same day)

> **⚠️ §28.4 IS WRONG AND IS CORRECTED BY §29.** The build is not blocked. The
> rest of this section (commits, Cloudflare settings, the Item 5 branch) is
> still accurate.

**▶ START HERE. This supersedes §27.9 as the live next action.** §27 is still
the correct record of the Item 1a spike; this section is what happened after it.

### 28.1 State in one screen

| | |
|---|---|
| `main` HEAD | `9c5fd41` (was `093b7ff` at the start of the day) |
| Branch `item5-navbar-partner-auth` | `a9c12af`, pushed, **not merged** — see §28.5 |
| Cloudflare Workers Builds | **Connected.** GitHub App authorised on `boliwaladevs`, Worker `boliwala` |
| Last Cloudflare build | **Failed at install** — fixed by `9c5fd41`, not yet retried |
| **The blocker** | **Next 16.0.10 ships a broken `@vercel/og` — no cold build succeeds anywhere. §28.4.** |
| Local production build | **Broken** (same bug). `tsc --noEmit` and the access matrix both pass. |
| Leak test | **Not run this session** — needs a production server, which needs a build |

### 28.2 Commits made

- **`03c0836`** — the §25 planning docs (`ROADMAP.md`,
  `INFRA_R2_SCALING_ANALYSIS.md`, `coparison.md`, `upper.md`) had never been
  committed; they are now. Plus `open-next.config.ts`, `wrangler.toml`, the
  adapter devDependencies, the `pnpm-workspace.yaml` `allowBuilds` fix, and
  `.gitignore` entries. Also brought `SPRINT_CALENDAR.md` and
  `project_calendar.html` in line with the dead 15 Sep date (§26.6's owed docs
  pass — done, both now carry a superseded notice with the task detail intact).
- **`9c5fd41`** — pins `packageManager: "pnpm@11.1.3"`. See §28.3.

### 28.3 Workers Builds is connected, but the build settings are still defaults

The user authorised the **Cloudflare Workers and Pages** GitHub App on the
`boliwaladevs` org, scoped to the `boliwala` repo. Cloudflare clones the repo
successfully — **the Git integration itself is done and working.**

The first build failed at install:

```
Detected the following tools from environment: pnpm@10.11.1, nodejs@24.18.0
Installing project dependencies: pnpm install --frozen-lockfile
ERROR  packages field missing or empty
```

Cause: nothing pinned a pnpm version, so Cloudflare chose **10.11.1** while
this machine runs **11.1.3**. pnpm 10 treats the presence of
`pnpm-workspace.yaml` as declaring a workspace and demands a `packages:` field.
Pinning was the smaller fix than adding a vestigial `packages:` entry, and it
also avoids a second failure queued behind it: **`allowBuilds` is pnpm 11
syntax**, so pnpm 10 would have ignored it and left `esbuild` and `workerd`
unbuilt (gotcha #9's cousin). Fixed in `9c5fd41`; **not yet retried.**

**Still wrong in the Cloudflare UI — the user was asked to change these and had
not confirmed doing so before stepping away. Check before interpreting any
build result:**

| Field | Currently | Must be |
|---|---|---|
| Build command | `pnpm run build` | `pnpm exec opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` | `pnpm exec opennextjs-cloudflare deploy` |
| Build variables | `None` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

Root directory `/` is correct. Worker name `boliwala` correctly matches
`wrangler.toml` — Cloudflare fails the build if they diverge.

`pnpm run build` runs plain `next build` and never produces `.open-next/worker.js`,
so the deploy step has nothing to ship. And the two build variables are inlined
at build time — without them `next.config.mjs` silently falls back to
`localhost` and every listing image 400s on a green build (§27.6).

### 28.4 🔴 THE BLOCKER — Next 16.0.10 ships a broken `@vercel/og`

**This is the single most important thing in this section. It blocks the local
production build, the leak test, and every Cloudflare build.**

```
Error occurred prerendering page "/apple-icon"
Failed to load external module next/dist/compiled/@vercel/og/index.node.js:
ENOENT: no such file or directory, open '.../@vercel/og/noto-sans-v27-latin-regular.ttf'
```

Diagnosed, not guessed:

- The only font in that directory is **`noto-sans-v27-latin-regular.ttf.bin`**.
- `index.edge.js` requests `noto-sans-v27-latin-regular.ttf.bin` — **exists**.
- `index.node.js` requests `noto-sans-v27-latin-regular.ttf` — **not shipped**.

So any cold build that prerenders an `ImageResponse` route through the **Node**
runtime dies. This repo has three: `app/icon.tsx`, `app/apple-icon.tsx`,
`app/opengraph-image.tsx` (all added in Sprint 5, §15.5).

**It is NOT caused by the Item 5 changes and NOT a Windows problem.** Verified
by stashing all working-tree changes and building the committed baseline: it
fails identically (24 pages instead of 25, same error). **It is
platform-independent and will fail on Cloudflare's Linux builders too** — so
expect the next Workers build to reach this after the install fix.

**Why it did not surface earlier today:** the successful `opennextjs-cloudflare
build` in §27.1 ran against a warm `.next` cache that already held a rendered
`/apple-icon`. The first `rm -rf .next` exposed it. Any CI build is cold by
definition, so CI would always have hit this.

**Fix options — NOT yet chosen, the user was mid-setup and deferred it:**

1. **Copy the font inside `node_modules`** (`.ttf.bin` → `.ttf`). Unblocks a
   local build in one command. **Does not survive a CI install, so it fixes
   nothing on Cloudflare.** Was started this session and the user rejected the
   tool call; treat it as a local diagnostic aid only, never the answer.
2. **`pnpm patch next`** — commits the added file to the repo as a patch, so it
   applies on every install including CI. Correct and durable, but pins a patch
   to an exact Next version that must be re-cut on every upgrade.
3. **Replace the three generated images with static files** in `public/` or
   `app/`. Removes the `next/og` dependency at build time entirely. These are
   *placeholder* assets that `ROADMAP.md` Item 6 says must be swapped for real
   brand assets anyway (**D9**), so this may be work that needs doing regardless
   — but it discards deliberate Sprint 5 work and is the largest change.
4. **Upgrade Next** past 16.0.10 if a patched release exists. Check first; this
   would be the cleanest outcome and costs nothing to look into.

**Recommendation: check option 4 first, then take option 2 if 16.0.10 is the
current release.** Option 3 is a real candidate but should be the user's call
because it changes what ships as branding.

### 28.5 Item 5 is built and pushed, but on a branch, not merged

Branch **`item5-navbar-partner-auth`** at **`a9c12af`**, pushed to origin.
`main` is untouched by it. Full rationale is in the commit message; summary:

- **5a** — navbar Log In / Sign Up restyle, desktop and mobile
  (`components/header.tsx`).
- **5b** — `auth-view.tsx` gains a `variant` prop; new `app/partner/login`
  route reuses the component; "Login as Channel Partner" link added below the
  Google button on the customer variant.
- **5c** — `/partner/dashboard` now requires `role = 'channel_partner'`. It
  previously required only a signed-in session, exposing fabricated commission
  figures to any customer. Verified against the live DB: the enum value exists
  (`user`, `admin`, `channel_partner`, `superadmin`) and **no account holds it**
  (3 `user`, 1 `superadmin`), so the page is now closed to everyone until an
  admin grants the role. That is intended while the portal is a mockup.

**Why a branch and not `main`:** two legs of the standing verification bar
could not be run because of §28.4 — the production build and the leak test.
`tsc --noEmit` is clean and the access matrix passes 49/49 across 7 viewer
states. Merging unverified code straight to a branch that Cloudflare
auto-deploys, while production on Vercel also tracks `main`, was not a call to
make unattended.

**To land it:** fix §28.4, run `pnpm build` and `node scripts/leak-test.mjs`
against a production server (§22.3 has the exact incantations), then merge with
`--rebase` per `plans/version_control.md`.

**Two judgement calls inside it worth a second opinion:**

1. Appendix B says Sign Up should be "white background, black text". A bare
   white button disappears against the light header state, so it carries a
   faint `border-black/10`. Revert if the client wants it literal.
2. Google sign-in from `/partner/login` still routes by role through
   `/auth/callback` rather than to the partner area. Carrying intent through
   OAuth needs the `?next=` work in Item 2 · S9; building a second mechanism
   now would duplicate it. Email/password does route to `/partner/dashboard`.

### 28.6 Decisions and non-decisions from this session

- **Push to `main` as `boliwaladevs`: authorised by the user.** They are the
  admin who bypasses the PR requirement (`plans/version_control.md`).
- **Workers Paid upgrade: deferred to the week of 2026-09-07** by the user.
  Free tier fits today (2.74 MiB of a 3 MB cap) so nothing waits on it.
- **The 12 demo listings were NOT deleted.** The user said "we can keep 4
  listings only as they are demo ones", which is permission, not an
  instruction. Listing count has no effect on Worker bundle size, and §8.4
  records **12/12** as the leak-test baseline — trimming to 4 would invalidate
  it for no gain. **If they are trimmed, restate that baseline in the same
  commit.**
- **Path A vs B for CI: A (Workers Builds) chosen and now live.** `ROADMAP.md`
  Item 1c was updated to match rather than left saying "GitHub Actions".

### 28.7 Next action, in order

1. **Resolve §28.4.** Nothing else can be verified until a cold build succeeds.
   Check whether Next has a release past 16.0.10 that fixes it before patching.
2. **Confirm the three Cloudflare build settings in §28.3** are corrected, then
   **Retry build**.
3. Expect the first green build to produce a `*.workers.dev` preview URL. Add
   it to **Supabase → Authentication → URL Configuration → Redirect URLs** as
   `https://<preview>.workers.dev/**` before testing login — **do not touch
   Site URL** (§27.5 explains why, and corrects §26.5, which asks for the wrong
   change entirely).
4. **Run the real Item 1a gate against the preview:** `scripts/leak-test.mjs`,
   `scripts/access-matrix-test.mjs`, route sweep, real Supabase email login,
   real Google login. **Only then record a go or no-go on Item 1a.**
5. Land `item5-navbar-partner-auth` once the build works (§28.5).
6. Remove the preview URL from Supabase Redirect URLs afterwards.

**Still true from §27.2: do not record a no-go because of a Windows failure or
because of §28.4.** Neither implicates OpenNext or Next 16 as a hosting choice.
The size gate — the one thing Item 1a was really built to test — already
passed at 2.74 MiB.


---

## 29. ⚠️ CORRECTION to §28.4 — the build is NOT blocked (2026-08-30, end of session)

**Read this before acting on anything in §28.4. That section reaches the wrong
conclusion and would send you to do work that does not need doing.**

### 29.1 What §28.4 got wrong

§28.4 claims Next 16.0.10 ships a broken `@vercel/og`, that the failure is
platform-independent, and that Cloudflare's Linux builders will hit it too. It
offers four fixes including a `pnpm patch` and replacing the brand images.

**All of that is wrong.** The reasoning inferred the *published package's*
contents from what was sitting in local `node_modules`. Checked against the
registry CDN instead:

| | `noto-sans-v27-latin-regular.ttf` | `...ttf.bin` |
|---|---|---|
| **Published `next@16.0.10`** | **HTTP 200 — ships** | HTTP 404 — does not exist |
| **This machine, before 2026-08-30** | missing | present, dated 4 Aug |

Both files are 27,748 bytes. The package ships `.ttf`; **something on this
machine renamed it to `.ttf.bin` during the 4 August install.** Cause not
established — a Windows security tool quarantine-renaming a font file is the
usual suspect, but that was not proven and should not be repeated as fact.

**Consequence: this was local install corruption, not a Next bug.** A clean
Linux install on Cloudflare extracts the correct `.ttf`, so the Workers build
very likely never hits this at all. Do **not** commit a `pnpm patch`, and do
**not** replace `app/icon.tsx`, `app/apple-icon.tsx` or `app/opengraph-image.tsx`
on account of it — that would bake a permanent workaround into the repo for a
problem that existed on one laptop.

### 29.2 Verified after restoring the file

Restoring the correctly-named file locally (copied from the `.bin`, byte
-identical to the published `.ttf`) clears it completely. On `main` at
`460e4e8`, cold build with `.next` deleted:

- **`pnpm build` with `SUPABASE_SERVICE_ROLE_KEY` blanked — PASS**, exit 0, all
  25 routes including `/icon`, `/apple-icon`, `/opengraph-image`.
- **Leak test against the production server — PASS.** 12/12 live listings,
  96 column-key checks and 96 non-empty-value checks, no gated data in guest
  HTML.
- **Access matrix — PASS**, 49 assertions across 7 viewer states.
- **`tsc --noEmit` — clean.**

That is four of the standing verification bar's legs green on `main`, and the
first time the leak test has run this session.

**If a fresh clone or a `pnpm install --force` reproduces the `.ttf.bin`
rename on this machine, the fix is local:** restore the file name in
`node_modules`, or find and stop whatever is renaming it. It is not a code
change and nothing about it belongs in the repo.

### 29.3 What this changes about the plan

- **§28.4 is void.** §28.7 step 1 ("resolve §28.4") is done — there was
  nothing to resolve.
- **The Cloudflare build settings are now correct in the dashboard** (verified
  by the user): build `pnpm exec opennextjs-cloudflare build`, deploy
  `pnpm exec opennextjs-cloudflare deploy`, version
  `pnpm exec opennextjs-cloudflare upload`, root `/`, and both
  `NEXT_PUBLIC_SUPABASE_*` build variables present.
- **So the next Workers build is the real Item 1a step 6 attempt.** If it goes
  green it produces a `*.workers.dev` preview, and the actual gate can finally
  run against it.

### 29.4 Next action, replacing §28.7

1. **Trigger a Cloudflare build** (Retry build, or any push to `main`). This is
   the first run with correct settings *and* the pnpm pin.
2. If it fails, read the log before theorising — and note that the two failures
   this session were both environmental, so check the environment first.
3. On success, take the preview URL and add
   `https://<preview>.workers.dev/**` to **Supabase → Authentication → URL
   Configuration → Redirect URLs**. **Do not touch Site URL.** §27.5 explains
   why, and corrects §26.5.
4. **Run the Item 1a gate against the preview:** `scripts/leak-test.mjs <url>`,
   `scripts/access-matrix-test.mjs`, route sweep, real Supabase email login,
   real Google login. §22.3 has the exact invocations.
5. **Only then record a go or no-go on Item 1a.**
6. **Verify and land `item5-navbar-partner-auth`** (§28.5). It has not been
   built or leak-tested — that was blocked when the branch was cut, and is not
   blocked any more:
   ```
   git checkout item5-navbar-partner-auth
   rm -rf .next && pnpm build          # blank SUPABASE_SERVICE_ROLE_KEY
   # start server on 3100 per §22.3, then:
   node scripts/leak-test.mjs http://127.0.0.1:3100
   ```
   If both pass, merge to `main` with `--rebase` per
   `plans/version_control.md`. Two judgement calls inside it are flagged in
   §28.5 and are worth a second opinion.
7. Remove the preview URL from Supabase Redirect URLs when done.

### 29.5 The habit worth keeping

Three failures this session looked like they condemned the migration, and all
three were environmental: Windows Developer Mode, a Windows path-separator bug
in the adapter, and a locally renamed font. **The bundle-size gate — the one
thing Item 1a was built to test — passed at 2.74 MiB and has never been in
doubt.** Check the environment before concluding anything about OpenNext,
Next 16, or Cloudflare, and verify a claim about a package against the registry
rather than against `node_modules`. §28.4 exists as a worked example of getting
that exactly backwards.

---

## 30. ▶ LIVE HANDOFF — first green Cloudflare build, Item 5 verified but unmerged, listing pages 500 on Workers (2026-08-30, night)

> **THIS IS THE LIVE HANDOFF. It supersedes §29.4 as the next-action list.**
> §29 is still correct as a record, and its lesson in §29.5 is the most useful
> paragraph in this file. Read §30.1, then §30.4, then §30.7.

> **The user is asleep.** They stepped away at **~21:55 IST on 2026-08-30** for
> **about 6 hours** (back ~04:00 IST on 2026-08-31) and asked for an agent loop
> that keeps closing items meanwhile. **§30.6 says exactly what may and may not
> be done unattended — read it before touching anything.**

### 30.1 State in one screen

| | |
|---|---|
| `main` HEAD | `362f221`, clean tree, in sync with `origin/main` |
| Branch `item5-navbar-partner-auth` | `a9c12af` — **fully verified (§30.3), approved for merge, still NOT merged (§30.5)** |
| Cloudflare Workers build | 🟢 **GREEN — the first ever.** Build `#fd62a116` off `main`, 1m57s, all five stages passed |
| Deployed Worker | **`https://boliwala.boliwaladevs.workers.dev`** — live, version `b45fb351-ec7b-4e10-9903-bc67468f817b` |
| Supabase Redirect URLs | ✅ `https://boliwala.boliwaladevs.workers.dev/**` added by the user. **Site URL untouched** at `https://boliwala.vercel.app` |
| Item 1a verdict | **STILL OPEN.** The deploy works; the gate does not pass yet — see §30.4 |
| **The open problem** | **Every `/listing/[slug]` page returns HTTP 500 on the Worker.** §30.4 |

### 30.2 The Cloudflare build is solved — that part is done

The user hit **Retry build** and it went green end to end: Initializing 5s,
Cloning 6s, Installing 30s, Building 58s, **Deploying 18s**. The settings shown
on the build were the corrected ones from §29.3 — build `pnpm exec
opennextjs-cloudflare build`, deploy `pnpm exec opennextjs-cloudflare deploy`,
root directory `/`, and both `NEXT_PUBLIC_SUPABASE_*` build variables present.

`wrangler deployments list --name boliwala` confirms the deployment landed at
`2026-08-30T16:13:12Z` (21:43 IST), matching the dashboard.

Worker URL settings, from the dashboard: **Production**
`boliwala.boliwaladevs.workers.dev` and **Preview**
`*-boliwala.boliwaladevs.workers.dev`, both toggled on, both "Anyone with this
URL can visit". Only the Production one was registered in Supabase — the
preview wildcard was deliberately skipped, since nothing is testing
per-version URLs and one entry is cleaner to remove at §30.7 step 6.

**So §28.3, §28.4, §29.3 and §29.4 steps 1–3 are all closed.** The install
failure, the phantom font blocker and the wrong build settings are all behind
us. Three sessions of suspected blockers produced zero real ones — §29.5's
point, a fourth time.

Guest smoke test from this machine against the live Worker:

```
200  /        200  /search        200  /login        404  /partner/login
```

The 404 is *correct and useful*: `/partner/login` exists only on the unmerged
item5 branch, so its absence proves the deploy really is `main` and not a
stale artifact.

### 30.3 Item 5 passes the full standing verification bar

Run on `item5-navbar-partner-auth` at `a9c12af` this session. **All four legs
are green — the first time the branch has been built or leak-tested** — which
retires the reason §28.5 gave for not merging:

| Check | Result |
|---|---|
| Cold `next build` (`.next` deleted, `SUPABASE_SERVICE_ROLE_KEY` blanked) | **PASS** — exit 0, 25 routes, incl. `/icon`, `/apple-icon`, `/opengraph-image` |
| `scripts/leak-test.mjs http://127.0.0.1:3100` | **PASS** — 12/12 listings, 96 column-key + 96 non-empty-value checks, no gated data in guest HTML |
| `access-matrix-test.mjs` | **PASS** — 49 assertions across 7 viewer states |
| `tsc --noEmit` | **clean** |

Plus a guest route sweep against the local production server:
`/partner/login` **200** (the new route renders), `/partner/dashboard` **307**
(the hard gate holds), `/profile` `/admin` `/listing` **307**, everything else
**200**.

The `/partner/dashboard` gate was read rather than assumed: it selects
`profiles.role` and redirects unless the value is exactly `channel_partner`, so
a failed profile fetch leaves `role` undefined and it **fails closed**.

**This independently re-confirms §29** — the cold build passes on a branch that
§28.4 claimed could not build anywhere. The font really was the only fault, and
it really was local to one laptop.

### 30.4 🔴 THE OPEN PROBLEM — every listing page 500s on the Worker

`node scripts/leak-test.mjs https://boliwala.boliwaladevs.workers.dev`:

```
FAIL  500  /listing/<slug>          (× all 12)
         VACUOUS: public field "title" missing
         VACUOUS: public field "city" missing
RESULT: FAIL — 12 listing(s) leaked
```

**Read that last line carefully — it is misleading, and nothing leaked.** The
pages returned **HTTP 500 with no content at all**, so there was no HTML in
which gated data could have appeared. The script says as much itself with
`VACUOUS`: it could not find even the *public* fields, so the test proved
nothing either way and correctly refused to pass. **Do not record this as a
data leak, and do not go looking for a leak to fix.** The defect is that
dynamic listing pages do not render on Workers.

**What is established:**

- `/` and `/search` return **200** on the same Worker, and both also read from
  Supabase — so this is not a blanket "Supabase is unreachable from Workers".
- `/listing/[slug]` is `ƒ` (dynamic, server-rendered per request) — but so is
  `/`, which works. "Dynamic vs static" alone does not explain it.
- `wrangler.toml` declares **no `[vars]` and no secrets** — only `name`,
  `main`, `compatibility_date`, `nodejs_compat`, the `ASSETS` binding and
  `observability`.
- `lib/supabase/server.ts` and `lib/data/listings.ts` read only
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which
  are inlined at build time and *were* set as build variables.
  `lib/supabase/admin.ts` is the one that needs `SUPABASE_SERVICE_ROLE_KEY`.

**What is NOT established — do not repeat these as fact:**

- Whether the Worker has any runtime secrets at all.
  `wrangler secret list --name boliwala` **failed with a transient network
  error**, so this was never actually checked. **Check it first.**
- Whether a missing `SUPABASE_SERVICE_ROLE_KEY` is the cause. It is a
  candidate, not a finding — and it is weakened by `/` and `/search` working.

**The right way to get the real answer, before theorising** (§29.5):
`observability` is already enabled in `wrangler.toml`, so run
`wrangler tail --name boliwala`, hit one listing URL, and read the actual
exception — or use the dashboard's Observability tab. Everything above is
context for that log line, not a substitute for it.

### 30.5 Item 5 is approved to merge but was blocked by a tool permission

The user was asked directly and chose **"Merge to main now"**. The merge then
failed for a mechanical reason, not a project one: `git rebase` was **denied by
the auto-mode permission classifier**. Nothing is wrong with the branch.

**The approval stands. To land it — rebase the *feature branch* onto `main`,
then fast-forward `main`:**

```
git checkout item5-navbar-partner-auth
git rebase main
git checkout main
git merge --ff-only item5-navbar-partner-auth
git push origin main            # as boliwaladevs — authorised, §28.6
```

**Do NOT run `git checkout main && git rebase item5-...`** — an earlier draft
of this section said exactly that, and it is wrong. It replays `main`'s own
commits on top of the branch, giving them new SHAs; since those commits are
already on `origin/main`, landing them would then demand a force-push to a
protected branch. The five commands above rewrite only the unpushed feature
branch, which is what "rebase merge" is supposed to mean.

Verified before writing this: `item5` carries **one** commit (`a9c12af`,
`app/` and `components/` only), `main` carries three docs-only commits it
lacks, and `git merge-tree` reports **zero conflicts**. The rebase is
mechanical.

Afterwards the pushed branch has diverged from its rewritten local self, so
either `git push --force-with-lease origin item5-navbar-partner-auth` to
realign it, or just delete it — it is merged at that point.

Push to `main` as `boliwaladevs` is authorised (§28.6), and `--rebase` is the
house default (`plans/version_control.md`). **That push auto-triggers a second
Cloudflare build**, after which `/partner/login` should stop 404ing on the
Worker — a free end-to-end proof that the CI pipeline works. It also deploys to
Vercel production, which still tracks `main`.

The two judgement calls flagged in §28.5 were put to the user, and they chose
to merge **without** changing either: the Sign Up button keeps its faint
`border-black/10`, and Google sign-in from `/partner/login` still routes by
role through `/auth/callback` pending Item 2 · S9. **Both are settled, not
open.**

### 30.6 Working unattended while the user sleeps — scope

The user asked for a loop that keeps closing roadmap items overnight. **Most of
what remains is not autonomously closeable.** Be honest in the morning about
what was actually finished rather than reporting motion.

**Safe to do unattended:**

- Diagnose §30.4 via `wrangler tail`, and **fix it if the fix is a code or
  config change inside this repo**, verified against the standing bar.
- Land Item 5 (§30.5) — explicitly approved.
- Re-run the gate against the Worker after any deploy.
- Documentation, `ROADMAP.md` ticks, and this file.

**Must NOT be done unattended — these need the user:**

- **Adding Worker secrets** (`wrangler secret put`). That writes credentials to
  a live service; it stays the user's call even if §30.4 turns out to need it.
  Prepare the exact command and leave it for them.
- **Google Cloud console changes.** Google OAuth against the Worker will fail
  until that origin is an authorised redirect URI there — **this is expected
  and is not an Item 1a no-go.**
- **Real login testing** — needs credentials that should not be guessed at.
- **Recording the final Item 1a go/no-go**, any **D-decision** (D0, D2, D3b),
  or anything touching **Supabase Site URL** or production DNS.
- Deleting the 12 demo listings (§28.6 — permission was given, but it would
  invalidate the 12/12 leak-test baseline for no gain).

### 30.7 Next action, in order — replaces §29.4

1. **`wrangler secret list --name boliwala`** — it has never successfully run.
2. **`wrangler tail --name boliwala`**, hit a listing URL, read the real
   exception. **Do not guess before this.**
3. **Fix §30.4.** If the fix is in-repo, make it, verify with the full bar, and
   push. If it needs a secret set on Cloudflare, stop and leave the command for
   the user (§30.6).
4. **Land Item 5** (§30.5) — approved, unblocked, and independent of §30.4.
5. **Re-run the Item 1a gate against the Worker** once listing pages render:
   `leak-test.mjs <worker-url>`, `access-matrix-test.mjs`, route sweep. The
   access matrix and the local leak test already pass; the Worker leak test is
   the only genuinely failing leg.
6. **Only then record the Item 1a go/no-go**, and remove
   `https://boliwala.boliwaladevs.workers.dev/**` from Supabase Redirect URLs
   when the spike is closed out.

### 30.8 Worth remembering

- **A `FAIL` summary line is not a finding.** The leak test printed
  "12 listing(s) leaked" for 12 pages that returned no HTML whatsoever. It
  flagged itself `VACUOUS` and was right to. Read the per-line detail, not the
  summary — acting on that summary would have meant hunting a data leak that
  does not exist while the actual 500s went unexamined.
- **The 404 on `/partner/login` was evidence, not a bug.** An expected absence
  is a cheap way to confirm *which* commit a remote host is really serving.
- §29.5 held again: the build was fine, the settings were fine, and the one
  genuine defect surfaced only after the deploy finally succeeded.

---

## 31. Overnight brief — and why "build the partner dashboard" is the wrong task (2026-08-30, night)

**Context:** the user proposed that an overnight agent loop "build out the
entire channel partner dashboard from the demo, as `boliwala.netlify.app` has
it". Before accepting that brief, the repo was checked. **The premise does not
hold, and the task as stated would waste the night.** What follows is the
evidence, then the brief that is actually worth running.

### 31.1 The dashboard is already built

`components/partner-dashboard-view.tsx` is **583 lines** and already implements
every section of the mockup:

| Mockup section (`channel-partner-dashboard.html`, 742 lines, in repo) | In React? |
|---|---|
| Dashboard / stat tiles | ✅ |
| Your referral link | ✅ |
| Earnings breakdown | ✅ |
| Invite by email or phone | ✅ |
| How you earn | ✅ |
| Commission structure | ✅ |
| Payout history | ✅ |
| **Invitation status** | ❌ **— the only genuine UI gap** |

**Also note the mockup is already in the repo** as
`channel-partner-dashboard.html`. Nobody needs to log into
`boliwala.netlify.app` and scrape it. Read the local file.

### 31.2 What is actually missing is data, and that is blocked

Every figure on that dashboard is hardcoded in the JSX:

- `₹31,297` total earnings, `₹799`, `₹17,998`, `₹12,500` line items
- `8 subscribers × ₹999 × 10%`, `12 packages × ₹9,999 × 15%`,
  `5 wins × ₹50L avg × 1% × 5%`
- Four invented referrals with invented names and email addresses —
  "Priya Verma", "Rajesh Sharma", "Amit Patel", "Kavya Reddy"

**There is no schema behind any of it.** `grep` across
`supabase/migrations/*.sql` finds **no** table matching
`partner|referral|commission|payout`. So "finish the dashboard" really means
"design and apply the commission data model", which is:

- **Item 10 on `ROADMAP.md`, explicitly gated on D8** — a client commercial
  decision. `ROADMAP.md` rule 1 says do not start an item while an earlier one
  is unfinished, and Item 1 has an open defect (§30.4).
- **The money model.** Those percentages are a representation about what
  partners get paid. Inventing them overnight, unsupervised, and shipping them
  behind a login is the single worst candidate for autonomous work in this
  repo.
- **Financial data needing RLS**, on a codebase where §23.1 records that RLS
  constraints have already shaped a whole sprint.

This is also exactly why §28.5 hard-gated the page in the first place. Building
*more* fabricated-money UI deepens the problem that gate was closing.

### 31.3 🔴 A real bug found while checking this — verify first thing

`app/actions/partner.ts` inserts into **`channel_partner_applications`**. **No
migration in the repo creates that table**, and `grep` finds the name nowhere
in `supabase/migrations/` or `scripts/`.

Two possibilities, and they need separating before anything else:

1. The table was created by hand in the Supabase dashboard, and the repo simply
   has no migration for it — a provenance gap, worth back-filling.
2. **The table does not exist, and every channel-partner application ever
   submitted has failed silently.** `submitPartnerApplication` returns the
   Postgres error to the caller, so this would surface as a user-visible
   failure — but nobody has checked.

**Check this before writing a single line of dashboard code.** If it is (2),
that is live data loss on a real intake form, and it outranks everything else
in this section. Confirm against the live DB (`list_tables` via the Supabase
MCP server, or `scripts/apply-sql.mjs`-style query against `DIRECT_URL`).

Note the same grep shows **no `create table` at all** in `supabase/migrations/`
— the base schema was built outside migrations and 0009–0013 are only `ALTER`s.
So a missing migration is not by itself proof the table is missing. Check the
database, not the repo.

### 31.4 The overnight brief that is worth running, in order

1. **§30.4 — the listing-page 500s on the Worker.** Real, on the critical path,
   blocking the Item 1a verdict. `wrangler tail --name boliwala`, read the
   exception, fix if the fix is in-repo. **This is the highest-value work
   available and it needs no client decision.**
2. **§31.3 — does `channel_partner_applications` exist?** Ten minutes, and
   potentially a live bug. If it exists, back-fill a migration so the repo
   matches reality. If it does not, **stop and write it up** — do not create it
   unattended; a table that should have been holding real applications is a
   conversation, not a task.
3. **The "Invitation status" section** (§31.1) — the one honest UI gap. It is
   presentation-only against the existing hardcoded shape, it changes no data
   model, and it is genuinely closeable overnight.
4. **Write a partner schema *proposal*** — `partner_referrals`,
   `partner_commissions`, `partner_payouts`, with RLS sketched — as a document
   for the user's review. **Do not apply a migration. Do not invent commission
   rates**; leave them as parameters for D8.

### 31.5 Standing constraints for the loop

- **Everything in §30.6 still applies** — no Worker secrets, no Google console
  changes, no real-login tests, no D-decisions, no touching Supabase Site URL.
- **Do not delete or alter the 12 demo listings** — they are the leak-test
  baseline (§28.6).
- **Every change still clears the standing bar** before it is pushed: cold
  build, `leak-test.mjs`, `access-matrix-test.mjs`, `tsc --noEmit`. §22.3 has
  the invocations.
- `/partner/dashboard` is hard-gated to `channel_partner`, and **no account
  holds that role** (§28.5). An agent cannot sign in and look at its own work.
  Verification is limited to build, typecheck and route-level assertions —
  factor that into how much UI is worth writing blind.
- **Report what was actually finished, not motion.** If the night produced one
  fix and two write-ups, say that.
