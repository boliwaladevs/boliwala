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

**Last updated:** 2026-08-04, after wiring Supabase auth + the signup credit
grant + the homepage alert form for real, and committing/pushing as
`boliwaladevs`.

---

## 1. Quick answers (asked at handoff)

**Is Supabase integrated?** Partially, and for real now — not the whole app.
Wired: `@supabase/supabase-js` + `@supabase/ssr` clients (`lib/supabase/
client.ts`, `lib/supabase/server.ts`), real email/password auth (signup,
login, logout, forgot-password, reset-password), the signup → profile-row →
5-free-credits flow (via a Postgres trigger, see §3), the homepage alert
capture form, and the profile page's session/credits/name/phone. **Not
wired:** anything on the search/listing pages (still 100% hardcoded mockups,
see Sprint 2.1 in §4), the credit *spend*/unlock flow (needs a real listing
to unlock — blocked by the same thing), shortlist add/remove (same reason),
Google OAuth (Sprint 2.5, deferred). Prisma was explicitly dropped this
session — the app talks to Supabase directly via `@supabase/supabase-js`, no
ORM.

**Migrations, since there's no ORM?** `supabase/migrations/*.sql` +
`node scripts/apply-sql.mjs <file>` (uses `pg` against `DIRECT_URL`, added
this session as devDependencies). Simple query protocol, whole file in one
`client.query()` call — no manual statement-splitting needed, unlike the old
`prisma/apply-policies.ts`. This is a stopgap; the user shared Supabase MCP
server setup instructions (`claude mcp add ... supabase`) — once authenticated
(needs a regular terminal, not this IDE extension — user has to run
`claude /mcp` themselves), that's probably the better tool for future
migrations. Not set up yet.

**How many phases, and what's our status?** Same as before — only
`plans/boliwala-phase1-sprint-plan.md` exists (Sprints 0–5), plus two new
deferred sub-sprints added this session: **2.1** (search/listing page
rebuild) and **2.5** (Google OAuth). See §4.

**Current status, one line:** auth + signup credit grant + profile basics +
homepage alerts are real and verified end-to-end against the live DB. Search,
listing pages, shortlist, and credit spend are still the old static mockups —
that's Sprint 2.1, next up.

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

`plans/boliwala-phase1-sprint-plan.md` now has two new sub-sprints added this
session, both **deferred, not started**:

- **Sprint 2.1 — Search & Listing Page Rebuild.** `components/
  property-results.tsx` and `components/listing-view.tsx` turned out to be
  pure client mockups with zero data-fetching — hardcoded arrays / hand-typed
  JSX strings, decorative filters, `/listing` not `/listing/[slug]`. This is
  effectively the old plan's Sprint 1 core deliverable again, not a data
  swap. It's next up — unblocks shortlist, credit spend/unlock, and real
  search.
- **Sprint 2.5 — Google OAuth.** No `GOOGLE_CLIENT_ID`/`SECRET` in
  `.env.local`, Q4 from the old plan never answered. Button is UI-present,
  disabled. Do this *after* 2.1 per the user's explicit sequencing.

**Sequencing confirmed with the user:** finish the rest of Sprint 2 → Sprint
2.1 → Sprint 2.5 → Sprint 3 onward.

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
6. **Supabase MCP server** — user shared setup instructions
   (`claude mcp add --scope project --transport http supabase "..."`).
   Not yet added or authenticated. Authentication (`claude /mcp`) needs a
   regular terminal, not this IDE extension — the user has to do that step
   themselves.
7. **Test-user hygiene:** all throwaway accounts created while verifying the
   signup trigger this session were deleted via the Admin API afterward — no
   test data left in the live DB. If you create more, same rule.

---

## 6. Next action for a fresh session

1. Finish the rest of Sprint 2 that's still meaningfully blocked by Sprint
   2.1 (shortlist add/remove, credit spend/unlock flow, "Saved
   Properties"/"My Alerts"/"My Services" profile tabs reading real data) —
   these all need real listing rows to attach to, so in practice this means:
2. **Sprint 2.1 next** — rebuild `/search` and add `/listing/[slug]` for
   real, wire the already-ported `lib/access/` gating layer into the real
   listing page, real view-count tracking, then re-run the guest-source leak
   test. See the sprint plan's Sprint 2.1 section for full scope.
3. Then Sprint 2.5 (Google OAuth) once the client confirms it's needed and
   supplies credentials.
4. Then Sprint 3 onward (Payments & Admin Core), re-checked against
   `boliwala_features.txt`.

---

## 7. Open questions for the client

Unchanged from last handoff, still open:

- Definitive bank list (old prototype said 18+ in one place, 40+ in two
  others)
- Real Indian contact number (a US placeholder number appears in the
  client's actual code)
- Channel Partner login — `boliwala_features.txt` §2.6 says "no partner
  portal or directory at launch," but `app/partner/dashboard` exists in the
  real source as a built page — confirm in/out of scope for launch
- Razorpay activation status
- Google OAuth — required at launch, or fast-follow? (Sprint 2.5)
- Housekeeping: rotate the Supabase DB password (was pasted in a chat
  transcript during the original build)
