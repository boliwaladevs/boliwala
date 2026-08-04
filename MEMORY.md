# BOLIWALA.COM — PROJECT MEMORY & HANDOFF

## ⚠️ REPO RESET — 2026-08-04

**Everything below this notice describes the pre-reset build and is now
historical, not current state.** On 2026-08-04 the client offered to supply
the exact zipped source (or GitHub link) actually deployed on
`boliwala.netlify.app`, so this project was cleared to start fresh from that
source instead of the from-scratch replica documented below — no point
maintaining a hand-built approximation once the real code is available.

**What happened:**
- `demo/` (the static-export reference mirror) and the entire `project/`
  Next.js app (`src/`, `node_modules/`, config files, `.git` history) were
  deleted from disk.
- A full zip backup of the pre-reset `project/` (incl. its `.git` history)
  and `demo/` was made to the session scratchpad before deletion — ask if
  you need anything recovered from it.
- `project/` was reinitialized as an empty git repo containing only this
  file and `CLAUDE.md`, then force-pushed to `origin/main` on
  `github.com/boliwaladevs/boliwala`, replacing the old commit history
  there too (old commits are not reachable from `main` anymore).
- `.env.local` (Supabase `DATABASE_URL`/`DIRECT_URL`, keys) was preserved —
  moved to the repo **root** (`../.env.local`, i.e. *outside* `project/`) so
  it survived the wipe. Move it back into `project/.env.local` once the new
  app is scaffolded — **same Supabase project/database will be reused.**
- `plans/` (including the master sprint plan and `UI_replication.md`) was
  kept intact at the repo root and was not touched.

**Next action for a fresh session:** once the client's zip/link arrives,
scaffold `project/` from that source, move `../.env.local` back into
`project/`, and re-verify against `plans/boliwala-phase1-sprint-plan.md`
before resuming feature work. The gotchas in §5 below (Prisma v6 pin,
percent-encoded DB password, `gh` account drift, RLS/GRANTs re-run after
migrations, etc.) are still likely to apply to the new codebase if it uses
the same stack — worth a skim even though the code itself is gone.

---

# Historical — pre-reset state (superseded, kept for reference)

**Purpose:** single source of truth for project state across sessions. If a
context window fills up, open a new session and point it at this file first.

> **Read order for a fresh session:**
> 1. This file (state, gotchas, next action)
> 2. `CLAUDE.md` (behavioural rules — surgical changes, verify everything)
> 3. `plans/boliwala-phase1-sprint-plan.md` (the master plan)
> 4. `project/README.md` (how to run and verify)

**Last updated:** after the Vercel import prep (commit `122ba99`).

---

## 1. Where things are

| | |
|---|---|
| Project root | `C:\Users\hrida\Documents\AA A\boliwala` |
| App | `project/` — Next.js 14, App Router, TS |
| Master plan | `plans/boliwala-phase1-sprint-plan.md` |
| Design reference | `demo/` — compiled Next.js static export of 7 public pages |
| GitHub | `github.com/boliwaladevs/boliwala`, branch `main` |
| Supabase project ref | `rimyttphaidvlytefvil` (ap-south-1) |
| Secrets | `project/.env.local` — gitignored, never commit |

**Stack (locked by the client brief):** Next.js 14 · TypeScript · Tailwind ·
Supabase (Postgres + Auth + Storage) · Prisma · Vercel · Razorpay · Resend.

---

## 2. Status against the master plan

| Sprint | Target | Status |
|---|---|---|
| Sprint 0 — Foundations | Wk 1 | ✅ Done |
| Sprint 1 — Core Public Pages | Wk 2 | ✅ Done |
| *Supabase connection* | interim | ✅ Done |
| **Sprint 1.5 — UI replication** | interim | ✅ Done |
| Sprint 2 — Auth & Accounts | Wk 3 → **M1** | ⬜ **NEXT** |
| Sprint 3 — Payments & Admin Core | Wk 4 | ⬜ Not started |
| Sprint 4 — Admin Completion | Wk 5 → **M2** | ⬜ Not started |
| Sprint 5 — QA, SEO, Launch | Wk 6 → **M3** | ⬜ Not started |

**Vercel deployment: IN PROGRESS.** User was importing the repo. Root Directory
must be **`boliwala (root)` / `./`** — not `prisma`, not `src`. Env vars needed
before first deploy (§6).

### Commit history
```
122ba99  Add prisma generate postinstall for Vercel builds
eee943b  Sprint 1.5: replicate the prototype's UI and design system
be732c5  Add Supabase MCP server to project config
29fa2a2  Connect Supabase: Postgres, RLS, and live data
1e7d775  Sprint 1: homepage, search, and listing page with 4-state gating
aa1c816  Initial commit from Create Next App
```

---

## 3. What is built and working

**Pages:** Homepage (parallax hero, search, trust strip, closing-soon grid,
5-step process, Auctions by City with live filter, alerts capture, CTA) ·
Search `/properties` (URL-driven filters, pagination, sort) · Listing page
`/properties/[slug]` (SSR + JSON-LD, gated fields, similar properties,
callback form, wa.me link) · 9 placeholder routes so nav resolves.

**The access layer — the business core.** `src/lib/access/`:
- `resolve.ts` — `resolveListingAccess(viewer, settings)` is the ONLY place
  access is decided. Never check credits or subscription anywhere else.
- `redact.ts` — strips gated values before they cross to the client. Uses an
  explicit allowlist, so a new gated column stays hidden until deliberately
  exposed.
- Costs/prices always come from `getSettings()`, never hardcoded.

**Gated model** (recovered from `demo/services.html`):
- Always public: full address, reserve price, EMD, auction dates, notice.
- Gated, 1 credit each: `flat_floor` · `inspection` · `officer_contact`.
- Free = 5 credits on signup · Annual ₹999/yr = unlimited · Service ₹9,999 +
  1% success fee, **per property** (not account-wide).

**Database:** schema v1 migrated (16 tables). RLS + column-level GRANTs applied.
Seeded: 6 banks, 7 settings, 12 listings. View events persist to
`listing_views` with an atomic `viewCount` increment.

**Two layers protect gated columns** — the `anon`/`authenticated` roles have no
SELECT grant on them at all, *and* the app redacts. Verified both ways.

---

## 4. Verification commands — re-run these after any change

```bash
cd "C:/Users/hrida/Documents/AA A/boliwala/project"
npm run typecheck && npm run lint && npm test && npm run build
npm run db:verify-grants     # gated columns unreadable by anon
npm run db:status            # row counts + live pricing
```

**The leak test is the one that matters.** Start `npm start`, fetch a listing
page as a guest, and confirm the HTML contains none of: `B-1204`,
`12th of 18`, `R. Krishnan`, `98123 45678`, `ao.mumbai@example-bank.in`,
`022 2756 0100`, `Carry photo ID` — while still containing
`Plot 12, Sector 20`, `68,50,000`, `6,85,000`, `410210`.

**Last full regression (all passing):** typecheck · lint · 11/11 tests · build ·
leak test 7/7 absent + 4/4 public · 8/8 search filter counts · view counter
dedupe · 4/4 access states · 12/12 routes 200 · hero content present in SSR HTML.

**Preview access states in dev:**
`/properties/<slug>?preview=credits|spent|nocredits|subscriber`
Hard-gated on `NODE_ENV === "development"`; production cannot reach it.

---

## 5. Gotchas — these cost time to rediscover

1. **`gh` active account drifts back to `hkforprojects`.** Pushes then 403.
   Fix: `gh auth switch --user boliwaladevs` before pushing.
2. **Prisma is pinned to v6 deliberately.** v7 removed `directUrl` from the
   schema and requires driver adapters, which breaks Supabase's
   pooled-runtime / direct-migration split. Do not "upgrade" it.
3. **Prisma CLI does not read `.env.local`.** Every db script is wrapped in
   `dotenv-cli`. Never create a plain `.env` — `.gitignore` only covers
   `.env*.local`, so it would be committed with the password in it.
4. **Percent-encode the DB password.** It contains `@` → `%40`. Without that
   the URL parser reads it as the host separator and fails with a DNS error.
5. **`npm run db:policies` must be re-run after every migration.** Prisma does
   not manage RLS or GRANTs. Forgetting it silently drops column protection —
   `npm run db:verify-grants` catches it.
6. **`postinstall: prisma generate` is required for Vercel.** Without it the
   build fails with "@prisma/client did not initialize yet".
7. **PowerShell test-harness traps:** `$home` is read-only (use another name);
   `-Headers @{'User-Agent'=…}` is ignored in PS 5.1 (use `-UserAgent`); React
   inserts `<!-- -->` between text nodes, so strip it before regex matching.
8. **Six of the seven original reference files never existed on disk** — the
   admin panel prototype and the Features/URD doc among them. Sprints 3–4 have
   no visual reference. See §0 of the master plan.

---

## 6. Vercel environment variables

Copy `DATABASE_URL` and `DIRECT_URL` verbatim from `project/.env.local` —
they already have `%40` encoding.

| Name | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rimyttphaidvlytefvil.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `DATABASE_URL` | pooled, port **6543** |
| `DIRECT_URL` | session, port **5432** |
| `NEXT_PUBLIC_SITE_URL` | set once the Vercel URL exists |

Without `DATABASE_URL` the app silently falls back to in-memory fixtures and
shows a "Demo data" banner — it will not crash, which makes a missing env var
easy to miss.

---

## 7. Next action

**Immediate:** `plans/UI_replication.md` — a UI/animation gap analysis
against `boliwala.netlify.app` (compared via the local `demo/` mirror, which
was verified to match the live site's content). Nothing in it has been
executed yet; it's written up for the user to read and pick a priority
cutoff (see its §11–12) before any of it is built. Read it before starting
work if the user says "go ahead" on UI polish.

**After that — Sprint 2 (Auth & Accounts) → M1.** Deliverables per the master plan:
- Signup / Login / forgot password (Supabase Auth clients already exist in
  `src/lib/supabase/`; middleware already refreshes sessions)
- Signup grants `free_signup_credits` from settings **via the ledger**, never
  by writing `profiles.creditsBalance` directly
- Profile page: Shortlisted · My Alerts · My Services · My Details
- Credit spend flow: unlock → ledger → idempotent re-unlock → balance UI
- Replace `getViewer()` in `src/lib/auth/viewer.ts` — it currently returns
  `null` in production (everyone is a guest) and only honours `?preview=` in dev
- Wire the disabled "Unlock" button in `GatedField.tsx` to a real server action

**Blocked/needed:** Google OAuth decision (prototype shows "Continue with
Google" — required at launch or later?) · `SUPABASE_SERVICE_ROLE_KEY` still
blank in `.env.local`.

---

## 8. Decisions log

| # | Decision | Rationale |
|---|---|---|
| D1 | Tailwind v3, not v4 | Stable pairing with Next 14; token values ported verbatim |
| D2 | Prisma v6, not v7 | v7 drops `directUrl`; breaks Supabase pooler split |
| D3 | Plus Jakarta Sans stands in for Satoshi | Fontshare licence not settled (risk R4) |
| D4 | Headline stats derived from live data | Prototype's "12,400+ / 18+" are unverified claims (C5) |
| D5 | US placeholder phone NOT reproduced | Renders only if `NEXT_PUBLIC_CONTACT_PHONE` is set (C3) |
| D6 | Keep bracket price dropdown (T1) | Client chose it over the demo's free-text min/max |
| D7 | Follow demo on buttons (T2) | Primary CTAs near-black; amber demoted to accent |
| D8 | Parallax + WebP (T3) | 10.16 MB → 627 KB; rAF-throttled; respects reduced-motion |
| D9 | Fixture fallback kept alongside Prisma | App runs on a fresh clone with no credentials |

---

## 9. Open questions for the client

**Blocking Sprint 3–4:** admin panel prototype and the Features/URD doc (both
missing) · sample bulk-upload Excel with real column headers · Razorpay
activation status.

**Still open:** definitive bank list (prototype says 18+ in one place, 40+ in
two others; dropdown hardcodes 4) · real Indian contact number · Pricing vs
Services — one page or two? · sign-off on headline statistics · Channel Partner
login (prototype shows it, Phase 1 scope says enrolment form only) · brand
assets (logo SVG, favicon, OG image) · Privacy and Terms copy.

**Housekeeping:** the database password was pasted in a chat transcript —
rotate it in Supabase when convenient. Supabase MCP server is configured in
`.mcp.json` but each developer must run `claude /mcp` once to authenticate.

---

## 10. Update protocol

After every execution, update: §2 status table and commit list · §4 last
regression result · §5 if a new gotcha appeared · §7 next action · §8 if a
decision was taken. Keep it factual — this file is read by someone with no
context.
