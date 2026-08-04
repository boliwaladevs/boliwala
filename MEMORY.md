# BOLIWALA.COM — PROJECT MEMORY & HANDOFF

**Purpose:** single source of truth for project state across sessions. If a
context window fills up, open a new session and point it at this file first.

> **Read order for a fresh session:**
> 1. This file (state, gotchas, next action)
> 2. `CLAUDE.md` (behavioural rules — surgical changes, verify everything)
> 3. `boliwala_features.txt` (the real Product Feature List / URD v2.0 — this
>    is the actual scope document, supersedes guesses in the old sprint plan)
> 4. `plans/boliwala-phase1-sprint-plan.md` (the old sprint plan — **stale in
>    places**, see §4 below before trusting it)

**Last updated:** 2026-08-04, after committing the client's real source
(commit `c42670d`), locking down `main` with branch protection, and handing
off for a fresh session.

---

## 1. Quick answers (asked at handoff)

**Is Supabase integrated?** No — not in code. A Supabase project (ref
`rimyttphaidvlytefvil`, ap-south-1) exists and its schema/RLS/seed data from
the earlier build attempt are still live in Supabase's cloud (deleting the
local repo didn't touch it). But **zero application code references it right
now** — grepped the whole `project/` tree for `supabase|prisma|DATABASE_URL`
and the only hit is this file. The client's shell has no
`@supabase/supabase-js`, no Prisma, no data-fetching of any kind — every page
renders from hardcoded arrays in the components (e.g.
`components/property-results.tsx:22`). Credentials are sitting ready in
`project/.env.local` for whenever wiring resumes.

**How many phases, and what's our status?** Only **one** plan document
exists: `plans/boliwala-phase1-sprint-plan.md`, a 6-week internal sprint
breakdown (Sprints 0–5) for what the client calls "Phase 1." There is no
project-wide multi-phase plan.md. The word "Phase 2" appears exactly twice in
the real features doc (`boliwala_features.txt` — WhatsApp Business API
automation, and Channel Partner portal approval workflow), both as deferred
line-items inside the Phase 1 scope, not as a separate roadmap. If the
client's engagement is genuinely multi-phase beyond that, it hasn't been
written down anywhere in this repo — worth asking them directly.

**Do we have a plan for the whole project or just Phase 1?** Just Phase 1,
and even that plan predates this session's two big changes (repo reset, then
real source import) — see §4 for what in it is now stale.

**Current status, one line:** the client's real frontend is imported,
builds clean, and is the new UI source of truth. Everything below the UI
layer — auth, the credit/access-gating logic, Supabase wiring, admin
backend, payments — does not exist in this codebase yet and needs to be
built fresh against these new components.

---

## 2. Where things are

| | |
|---|---|
| Project root | `C:\Users\hrida\Documents\AA A\boliwala` |
| App | `project/` — Next.js 16 (Turbopack), React 19, TypeScript, Tailwind v4, pnpm |
| Real feature spec | `project/boliwala_features.txt` — Product Feature List / URD v2.0 |
| Reference assets | `project/refrence/` (6 screenshots + `Boliwala-Features-v2.docx`), plus 3 standalone static-export HTML files at `project/` root (`boliwala-admin-v3.html`, `channel-partner-dashboard.html`, `pricing.html`) — useful as pixel reference alongside the live `app/` routes |
| Old sprint plan | `plans/boliwala-phase1-sprint-plan.md` — **stale, see §4** |
| UI gap analysis | `plans/UI_replication.md` — **moot**, was comparing our old hand-built replica to the prototype; irrelevant now that the real source is in |
| Repo governance | `plans/version_control.md` — collaborator/branch-protection/Vercel-deploy explanation, see §6 below |
| GitHub | `github.com/boliwaladevs/boliwala`, branch `main`, **public**, branch-protected (§6) |
| Supabase project ref | `rimyttphaidvlytefvil` (ap-south-1) — infra exists, unwired (§1) |
| Secrets | `project/.env.local` — gitignored via `.env*`, never commit |

**Stack as shipped by the client (verified by `pnpm build`):** Next.js 16.0.10
· React 19.2 · TypeScript · Tailwind v4 · shadcn/ui (Radix primitives) ·
`lenis` (smooth scroll) · `@vercel/analytics`. **No** backend deps — no
Supabase client, no Prisma, no ORM, no auth library. This is a different
stack than the old sprint plan assumed (it planned around Next 14 + Tailwind
v3 + Prisma v6 — see §4).

---

## 3. What's built and working (current codebase)

All 14 routes render and the production build is clean
(`pnpm install && pnpm build` — verified this session, all pages compile and
prerender as static content):

`/` · `/about` · `/admin` · `/faq` · `/listing` · `/login` · `/partner` ·
`/partner/dashboard` · `/pricing` · `/profile` · `/search` · `/services` ·
`/signup`

This includes pages that never existed as a reference before today — the
admin panel (`app/admin` + `components/admin-view.tsx`), the individual
listing page (`app/listing` + `components/listing-view.tsx`), the profile
page (4 tabs), and the partner dashboard. All of it is **static UI only** —
no routing by ID/slug yet (`/listing` not `/listing/[id]`), no forms wired to
anything, no auth state, no real data.

**Not built at all (needs to be created fresh, nothing to resume):**
- Supabase client setup, auth (signup/login/forgot password)
- The credit/access-gating logic (which fields are public vs. paywalled,
  resolved server-side) — the *rules* are documented in
  `boliwala_features.txt` §1 and §2.3, but no code implements them
- Any data layer — listings, banks, settings all need a source of truth
  (Supabase) and the mock arrays in components need replacing
- Admin panel backend (the UI in `components/admin-view.tsx` exists; nothing
  behind it)
- Payments (Razorpay), alerts/notifications, Channel Partner enrolment
  persistence

**Worth checking early next session:** the old (deleted) build's business
logic — `resolveListingAccess()`, the redaction allowlist, the credit ledger
pattern — is preserved in the pre-reset backup zip at the repo root
(`boliwala-project-backup-20260804-145617.zip`, path
`project/src/lib/access/`). The *rules* it encoded came from the same
features doc that's now confirmed accurate, so that logic is likely still
correct and worth porting rather than re-deriving from scratch — just needs
adapting to the new component structure.

---

## 4. What's stale in `plans/boliwala-phase1-sprint-plan.md`

That plan was written when 6 of 7 reference files were missing (its own §0
says so). Today's source drop supplied the admin panel, the listing page,
the profile page, the partner dashboard, and the real Features/URD doc — all
things that plan explicitly flagged as "designed from first principles" or
"blocking." Before resuming Sprint 2+ execution against it:

- Re-read `boliwala_features.txt` as the authoritative scope — it's more
  detailed and more current (v2.0, July 2026) than what the old plan
  inferred from a partial prototype.
- The old plan's stack decisions (D1 Tailwind v3, D2 Prisma v6) no longer
  apply — the real source uses Tailwind v4 and ships no ORM at all, so the
  backend data-access approach is an open decision again (Prisma vs.
  Supabase JS client directly vs. something else).
- The old plan's §9 open questions (bank list count, Channel Partner login
  vs. enrolment-only, brand assets) may now be answered by
  `boliwala_features.txt` or `refrence/` — re-check each one before treating
  it as still-open.
- Sprint numbering / milestone structure (Sprint 0–5, M1–M3) is probably
  still a reasonable shape for sequencing work, but the per-sprint task
  lists were written against the old hand-built frontend's file layout
  (`src/lib/access/`, `src/app/...`) which no longer exists — the new
  frontend's layout is `app/`, `components/`, `lib/utils.ts` only.

**Recommendation for next session:** don't execute the old plan as-is. Do a
short reconciliation pass — plan vs. `boliwala_features.txt` vs. what's
actually in `app/`/`components/` now — before committing to a sprint
sequence, or ask the user whether to write a fresh plan against the real
source instead of patching the old one.

---

## 5. Gotchas — still likely to matter once backend work resumes

1. **`gh` active account drifts back to `hkforprojects`.** Pushes then 403.
   Fix: `gh auth switch --user boliwaladevs` before pushing. Confirmed still
   true this session.
2. **The DB password needs percent-encoding.** It contains `@` → `%40`.
   Without that the connection-string parser reads it as the host separator
   and fails with a DNS error. Still applies — same Supabase project.
3. **Whatever ORM gets chosen, re-verify RLS/GRANTs after every migration.**
   The old build's Postgres RLS + column-level GRANTs (protecting gated
   fields at the DB layer, not just in the app) should still be live in
   Supabase since the database wasn't touched — but this needs confirming
   fresh, not assumed, once someone reconnects.
4. **`.env.local` lives at `project/.env.local`** (moved back in by the user
   after the reset). It's `.env*`-ignored by the new `.gitignore` — confirmed
   not tracked.

*(Prisma-specific gotchas from the old build — v6 pin, `dotenv-cli`
wrapping, `postinstall: prisma generate` — are dropped here since the new
codebase has no Prisma at all. Re-add if the next session reintroduces it.)*

---

## 6. Timeline (for context, most recent first)

0. **2026-08-04 — repo governance locked down.** Collaborator `nesora-ops`
   (GitHub Write access, not an admin) can no longer push directly to `main`
   — branch protection now requires a PR + 1 approval to merge, and blocks
   force pushes, for everyone except the `boliwaladevs` admin account
   (`enforce_admins: false`, so the owner can still push directly). Repo
   stays **public** deliberately — see `plans/version_control.md` §4 for why
   going private would have been the wrong move here (it doesn't gate
   content, only delays which push triggers the build, and actually causes
   the exact GitHub/Vercel drift the user was trying to avoid). Public also
   means `nesora-ops`'s branch pushes get free Vercel Preview deployments,
   with production only moving when a PR is merged.
1. **2026-08-04 — client source imported.** `boliwala-main/` (the exact code
   the client has deployed on `boliwala.netlify.app`) was merged into
   `project/`, `pnpm install && pnpm build` verified clean, committed
   (`c42670d`), pushed to `origin/main`.
2. **2026-08-04 — repo reset.** `demo/` and the entire old hand-built
   `project/` were deleted (kept only `CLAUDE.md`/`MEMORY.md`), git history
   force-pushed to a single fresh commit, in anticipation of the client
   supplying real source. Full zip backups of the pre-reset `project/`
   (incl. old `.git` history) and `demo/` were saved to the repo root as
   `boliwala-project-backup-20260804-145617.zip` and
   `boliwala-demo-backup-20260804-145617.zip`.
3. **Earlier — original from-scratch build.** Sprint 0 (Supabase schema,
   RLS, seed data) and Sprint 1 (hand-built homepage/search/listing UI) were
   completed against a partial, largely-missing prototype. That UI is gone
   from the repo (superseded by step 1) but the Supabase-side schema/RLS/
   seed work is still live infrastructure — see §1.

---

## 7. Next action for a fresh session — CONFIRMED 2026-08-04

**Direction confirmed with the user:** Supabase integration first, then
resume sprint execution. One correction to that framing, agreed in the same
conversation: Supabase integration *is* the substance of the next pending
sprint, not a separate step before it — the old plan's Sprint 2 (Auth &
Accounts) is mostly Supabase wiring (auth, credit ledger, access-gating). So
this isn't "integrate Supabase, then do something else called Sprint 2" —
it's one piece of work. Concretely, in order:

1. Read `boliwala_features.txt` in full — it's short enough and is now the
   ground truth for scope.
2. Quick plan-reconciliation pass (§4) — the old sprint task lists reference
   file paths that no longer exist (`src/lib/access/`, `src/app/...`); confirm
   what still applies before executing it literally. This is a short check,
   not a blocker — don't over-invest here.
3. Decide the data-access approach (Prisma again vs. Supabase JS client vs.
   other) — the old codebase's choice (Prisma v6) isn't inherited by the new
   frontend, which has no ORM at all.
4. **Base data layer first, then auth on top of it** — two sub-steps, in
   this order, because auth/credit-gating is meaningless without real listing
   data to gate:
   a. Supabase client setup + replace the hardcoded arrays (e.g.
      `components/property-results.tsx:22`) with real queries against the
      existing schema — this is effectively redoing the old build's "Supabase
      connection" interim step, which no longer exists in this codebase even
      though the DB side of it is still live.
   b. Auth (signup/login/forgot password) + credit ledger + the
      access/redaction layer gating fields per `boliwala_features.txt` §2.3 —
      candidate to port from the backup zip's `src/lib/access/` (§3) since the
      gating *rules* haven't changed, only the surrounding UI.
5. Only after 4 is solid: continue with the old plan's Sprint 3 onward
   (Payments & Admin Core) — re-checked against §4's reconciliation, not
   executed blindly.

---

## 8. Open questions for the client

Carried forward from the old plan (§9 there) — re-verify each against
`boliwala_features.txt` before re-asking, some may now be answered:

- Definitive bank list (old prototype said 18+ in one place, 40+ in two
  others)
- Real Indian contact number (a US placeholder number appears in the
  client's actual code)
- Channel Partner login — `boliwala_features.txt` §2.6 now says explicitly
  "no partner portal or directory at launch," but `app/partner/dashboard`
  exists in the real source as a built page — confirm whether it's
  in-scope for launch or a future-phase page shipped early.
- Razorpay activation status.
- Housekeeping: the Supabase DB password was pasted in a chat transcript at
  one point during the original build — rotate it when convenient.
