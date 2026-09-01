# BOLIWALA.COM — PROJECT MEMORY & HANDOFF

**Compacted 1 September 2026.** Sections **§1–§38** — every sprint record, superseded
brief and withdrawn correction from 4 August to 31 August — were moved verbatim, under
their original numbers, to **`MEMORY_ARCHIVE.md`**. Nothing was deleted. See **§H** for
the map of what went where and when it is worth opening.

> ## ▶▶ START HERE
>
> **The pre-launch build is finished. The project is now blocked on the client, not on
> engineering.**
>
> 1. **§A** — where the project stands, in one page.
> 2. **`client_requirement.md`** — the whole critical path, and the only document you
>    need in front of the client. **§C** is its index.
> 3. **§39 / §40** — what was built on 1 September and the return summary, kept in full
>    because they describe the code as it is today.
>
> **There is no unblocked engineering work in this project right now.** Before starting
> anything, check `client_requirement.md` — the blocker is a credential, a file, a
> payment or a decision, and none of them resolve on their own.

> **🔄 UPDATE RULE (MANDATORY):** on every code change and commit, these files must be
> updated to reflect current state:
> - `MEMORY.md` — the relevant section, or a new one
> - `project_calendar.html` — completed sprints, timelines
> - `SPRINT_CALENDAR.md` — tasks `[x]`, statuses, dates
>
> Non-negotiable. No commit goes out without these three in sync.

> **Read order for a fresh session:**
> 1. This file — §A, then §C, then §39/§40
> 2. `client_requirement.md` — what the client owes, and what it blocks
> 3. `immediate_plan.md` — the executed queue; everything left in it is below the STOP
> 4. `CLAUDE.md` — behavioural rules: surgical changes, verify everything
> 5. `boliwala_features.txt` — the real Product Feature List / URD v2.0, the actual
>    scope document

---

## §A — WHERE THE PROJECT STANDS (1 September 2026)

**Twelve commits on `main`, all pushed, tree clean, level with `origin/main`.**
Workers Builds auto-deploys on push.

| | |
|---|---|
| **Pre-launch queue `immediate_plan.md` W0–W8** | ✅ Complete — **except W5**, blocked on R2, re-filed below the STOP as §0 |
| **The STOP** | 🛑 `=== STOP: CSV REQUIRED ===` reached and respected. W-INGEST, W-SEO, W-DNS not started |
| **Database** | 5 migrations applied live: `0014` contact-sales · `0015` manual payments · `0016` grants · `0017` lenders · `0018` partner commissions. **Next free number is `0019`** |
| **Worker bundle** | **2599.55 KiB gzip — 85% of the 3 MB free cap.** Measured 1 Sep, first successful local build on this machine. **§41** |
| **What blocks launch** | The inventory CSV, and a card on the Cloudflare account. Everything else is copy or a decision. **`client_requirement.md`** |

**The eight workstreams that landed:**

| | | |
|---|---|---|
| **W0** | Plus Jakarta Sans | The three Satoshi `.woff2` files were 597-byte Fontshare CSS text that nothing imported — the site had always rendered in system-ui |
| **W1** | Admin tables purged | **Nine** fabricated table bodies, not the six the plan listed |
| **W2** | Contact Sales + manual grants | The only pre-Razorpay revenue event; migration `0015` records a payment taken offline |
| **W3** | Grants matched to policies | Fifteen tables carried Postgres's blanket grant for `anon`; new `scripts/grants-test.mjs`, 27/27 |
| **W4** | `banks` → `lenders` | 69 identifiers, 21 files, plus a lender-type search facet |
| **W6** | Channel partner portal | Real referrals, real commissions at 10% / 15% |
| **W7** | Legal routes + contact wiring | `/privacy`, `/terms`; build baseline 25 → 27 pages |
| **W8** | Lint + the §36.5 defects | `pnpm run lint` ran for the first time in this project's life |

Per-workstream detail is **§39**. The return summary is **§40**.

---

## §B — THE STANDING VERIFICATION BAR

Run all of these at the end of every workstream. **These are the current baselines and
they must not regress.**

```bash
npx tsc --noEmit                          # clean, exit 0
pnpm run build                            # green — 27/27 static pages
pnpm run lint                             # 0 errors, 287 warnings
node scripts/leak-test.mjs <url>          # 12/12 PASS  (needs a `next start` server)
node scripts/access-matrix-test.mjs       # 49/49 gating + 23/23 doors + 15/15 partner isolation
node scripts/grants-test.mjs              # 27/27 PASS
node scripts/bulk-sample-selfcheck.mjs    # PASS + 4 header spellings
```

`access-matrix-test.mjs` runs as
`node --experimental-strip-types --import ./scripts/ts-resolve-hook.mjs scripts/access-matrix-test.mjs`.

> **Keep the three access-matrix tallies separate.** 49, 23 and 15 are independent
> baselines. Folding them into one number makes every future comparison meaningless.

**Last full run: 1 September 2026 — all green.**

---

## §C — WHAT THE CLIENT OWES

**`client_requirement.md` is the document.** This is its index, so a session that has
only read `MEMORY.md` still knows what is outstanding.

| | Item | Blocks | State |
|---|---|---|---|
| 1.1 | **One sample listings CSV/Excel** | W-INGEST — the dedup key cannot be designed without real column names | 🔴 Outstanding — **the #1 blocker** |
| 1.2a | **A card on the Cloudflare account (R2)** | **W5** — images and PDFs | 🔴 Outstanding |
| 1.2b | **Workers Paid, $5/mo** | Deploy headroom above the 3 MB cap — see §41 | 🔴 Outstanding |
| 1.2c | **Connect `boliwala.com`** | W-DNS, `cdn.boliwala.com`, OAuth redirect URLs | 🟡 Purchased, not connected |
| 1.3 | **Logo + brand assets** | W7.3, favicon, share previews | 🟡 Expected w/c 8 Sep |
| 1.4 | **Privacy Policy copy** | `/privacy` is live and empty — a paste, not a build | 🟡 Expected w/c 8 Sep |
| 1.5 | **Terms of Service copy** | `/terms`, same | 🟡 Expected w/c 8 Sep |
| 1.6 | **Contact phone / WhatsApp / email / address** | Three env vars are **empty in production**; the site renders nothing rather than a placeholder | 🟡 Outstanding |
| 1.7 | **Meta Business credentials + DLT registration** | WhatsApp/SMS OTP. **3–7 day third-party approval — longest lead time on the list** | 🔴 Not started |
| 1.8 | **Confirm the annual membership price** | ⚠️ Live settings say **₹2,999**; the spec says **₹999**. It drives the pricing page **and** every partner commission | 🔴 Outstanding |
| 1.9 | **Partner tier thresholds** | Stored `null`, tiers assigned by hand — which is what the URD describes. Not blocking | 🟡 Undecided |
| 2.1 | **₹12,000** — balance of the ₹30,000 first advance (₹18,000 received) | — | Due **3 Sep 2026** |
| 2.2 | **₹30,000** — mid-project advance | — | Due **3 Sep 2026** |

**Answered, so nobody asks twice:** commission 10% / 15% · PDFs are freely public · R2
only, Supabase Storage declined · no lender admin UI (not in the URD) · Contact-Sales
notifications are admin-panel-only · Razorpay deferred.

**Not being asked for yet:** Play Store / App Store developer credentials — **the APK is
not ready**, so there is nothing to upload. Razorpay merchant credentials, deferred with
the integration.

---

## §D — DECISIONS THAT STILL BIND

Carried forward from the archive so they are not re-litigated. Original section numbers
in brackets.

**Product and commercial**

1. **Payments are deferred indefinitely** — *"we do not need payments yet"*, user,
   2026-08-30. Month-one monetisation is Pricing → **Contact Sales** → manual UPI/
   WhatsApp billing → manual grant in admin. **This retires the entire Razorpay critical
   path.** [§25.2]
2. **Property only.** Vehicles and plant & machinery are explicitly descoped. [§25.2]
3. **PDFs are freely public** — public R2 bucket, no signed URLs. `listing_documents`
   still carries a `visibility` column so a future gated type has room. [§25.2]
4. **Commission is 10% of an annual membership, 15% of a service package.** Stored on
   the commission row, so a later rate change never re-prices an earned commission —
   verified by moving the rate to 99%. [§39.7]
5. **Tiers are assigned, not computed.** Thresholds are `null` and the admin panel says
   "not decided yet". A `0` would have read as "everyone qualifies for Gold". [§39.7]
6. **No admin UI for lenders.** Confirmed against the URD, which lists the whole admin
   panel and contains no lender management. The NBFC/ARC/HFC facet stays empty until
   W-INGEST creates lenders from the real file. [§40.4]
7. **The 15 Sep launch date is dead.** A new date must be agreed with the client. [§25.3]

**Architecture**

8. **Cloudflare Workers via `@opennextjs/cloudflare`**, not Vercel, not classic Pages.
   Vercel Pro was never purchased, so nothing was sunk. [§25.2]
9. **R2 for blobs** (`boliwala-images`, `boliwala-docs`), public, `cdn.boliwala.com`,
   $0 egress. **Supabase Storage is retired** — migration `0008`'s bucket is unused.
   [§25.2]
10. **Supabase keeps Postgres, RLS and Auth**, and gains `pgvector` when semantic search
    lands. Vectors stay in Postgres, co-located with listings. **No Pinecone/Qdrant.**
    [§25.2]
11. **`sharp` does not run on Workers.** Image renditions belong in the Node bulk-ingest
    job; admin one-offs use Cloudflare Images on the R2 original. **No runtime image
    optimisation anywhere.** [§25.2]
12. **Scale target is 50,000+ live listings** (the competitor indexes ~96k; current live
    count is 12). This is what forced the infra change. [§25.2]
13. **`profiles.role` is a Postgres enum** (`public."Role"`, four values, DB-enforced).
    **No CHECK constraint is needed or wanted** — the migration once queued for this was
    withdrawn and deleted. [§37.10 — corrects §37.3, which `lib/auth/landing.ts:17`
    still cites]
14. **A click is not a referral.** `middleware.ts` captures `?ref=` into an httpOnly
    cookie and writes nothing; a row appears only when an account is created.
    `unique (referredProfileId)` means a second partner can never claim someone already
    referred. [§39.7]

---

## §E — GOTCHAS

*Formerly §5. The numbering is unchanged, so existing "`§5` gotcha #10" references still
resolve here. Gotchas that described a since-closed state were dropped; #11 is new.*

1. **`gh` active account drifts back to `hkforprojects`.** Fix:
   `gh auth switch --user boliwaladevs` before pushing.
2. **DB passwords need percent-encoding** (`@` → `%40`) — both `DATABASE_URL` and
   `DIRECT_URL`.
4. **`profiles` / `credit_transactions` have no client INSERT policy, by design** —
   credits must never be client-writable. The profile row is created by the
   `handle_new_user` trigger, not by loosening RLS.
5. **`.env.local` lives at `project/.env.local`**, gitignored via `.env*`. There is also
   a `SUPABASE_ANON_PUBLIC_KEY` the user added that **no app code references** — the app
   uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Worth confirming it is not meant to
   replace something before it goes stale.
7. **Test-user hygiene:** delete every throwaway account created during verification.
   None are currently left in the live DB.
8. **`plans/version_control.md` is the canonical reference for this repo's rules** —
   admin vs non-admin push, PR/approve/merge, branch protection. Read it rather than
   guessing.
9. **Windows blocks the Next `standalone` build unless Developer Mode is on.** OpenNext
   forces `output: "standalone"`, whose tracer symlinks `node_modules/next` into
   `.next/standalone`; without it the build dies with `EPERM: operation not permitted,
   symlink` **after** a fully successful compile. **Enabled on this machine
   2026-08-30.** Check with
   `(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock').AllowDevelopmentWithoutDevLicense`.
10. **`@opennextjs/cloudflare` 1.20.4 produces a bundle that 500s on every route when
    built on Windows.** The adapter patches Next's manifest loader with
    `if (path.endsWith("/server/middleware-manifest.json"))`, but a Windows build hands
    it backslashes. The check never matches, execution falls through to a dynamic
    `require()`, and the Worker throws
    `Dynamic require of "/.next/server/middleware-manifest.json" is not supported`.
    **Consequence: never `wrangler deploy` a Windows-built bundle — it will 500 in
    production exactly as it does locally.** Deployable builds must run on Linux (CI /
    Workers Builds). WSL is **not** installed on this machine.
    **This does not invalidate a size measurement** — see §41.
11. **`opennextjs-cloudflare build` fails on Windows + pnpm with
    `Cannot read directory … Access is denied` (EPERM).** *Solved 1 Sep 2026 — this is
    what previously made the bundle un-measurable on this machine.*
    The adapter copies the server function's `node_modules` into
    `.open-next/server-functions/default/`. Node recreates pnpm's directory symlinks as
    **file-type** symlinks, and Windows then refuses to open them as directories, so
    esbuild dies on `react`, `react-dom` and `styled-jsx`.
    **Workaround, and it works — see §41.3 for the exact procedure:** dereference the
    21 offending symlinks under `project/node_modules` into real directories, run the
    build, then **restore them**. Do not leave them dereferenced: two physical copies of
    `react` in the tree risks two React instances at runtime.

---

## §F — WHERE THINGS ARE

| | |
|---|---|
| Project root | `C:\Users\hrida\Documents\AA A\boliwala` |
| App | `project/` — Next.js 16.0.10 (Turbopack), React 19, TypeScript, Tailwind v4, pnpm |
| GitHub | `github.com/boliwaladevs/boliwala`, branch `main`, public, branch-protected |
| Supabase project ref | `rimyttphaidvlytefvil` (ap-south-1) |
| Cloudflare account | `dd735b278158c0a26949c1d5d6b6ebc3` (`boliwaladevs@gmail.com`), Worker `boliwala`, Workers Builds auto-deploys on push |
| Live worker | `boliwala.boliwaladevs.workers.dev` — `boliwala.com` not yet connected |
| DB migrations | `project/supabase/migrations/*.sql`, applied with `node scripts/apply-sql.mjs <file>`, or the Supabase MCP server |
| Access-gating layer | `project/lib/access/{types,resolve,redact,index}.ts` |
| Viewer resolver | `project/lib/auth/viewer.ts` — real session + credit balance, server-only |
| Secrets | `project/.env.local` and `project/.dev.vars`, both gitignored |

**The document set**

| File | Role |
|---|---|
| **`client_requirement.md`** | **What the client owes. The whole critical path. Start here for anything client-facing.** |
| `immediate_plan.md` | The executed pre-launch queue. Everything left in it is below the STOP and blocked |
| `MEMORY_ARCHIVE.md` | §1–§38, verbatim, original numbering — see §H |
| `deferred_plan.md` | Post-launch work, including D7 vector search |
| `REALITY_CHECK.md` | Why the pre-launch order is what it is; §7 is the tier reasoning |
| `boliwala_features.txt` | The real Product Feature List / URD v2.0 — the actual scope document |
| `ROADMAP.md` | Items 1–16 and the decisions register D0–D12 |
| `INFRA_R2_SCALING_ANALYSIS.md` | Technical rationale for Cloudflare + R2 + pgvector |
| `coparison.md` / `upper.md` | Competitive teardown of FindAuction.in, and where Boliwala already leads |
| `CLIENT_ACTIONS_FOR_SMS.md` | The Meta / DLT setup detail behind `client_requirement.md` §1.7 |
| `SPRINT_CALENDAR.md`, `project_calendar.html` | Kept in sync by the UPDATE RULE |

---

## §G — KNOWN DEFECTS AND DELIBERATE NON-FIXES

Found, understood, and consciously left alone. Each says why.

1. **`font-mono` is broken exactly the way Satoshi was.** `--font-mono` asks for the
   literal `"Geist Mono"` while `next/font` emits a hashed family name, and `_geistMono`
   in `app/layout.tsx:10` is assigned and never used. **One line from W0's fix**, but out
   of its scope. [§39.1]
2. **~220 `react-hooks/static-components` warnings.** The real fix is deleting
   `admin-view.tsx`'s inline helpers in favour of the identical ones already in
   `components/admin/ui.tsx` — a genuine simplification that touches every admin table.
   Not for the end of a queue with no browser. [§39.9]
3. **`listings."bankContact"` keeps its name.** Not a foreign key; renaming costs another
   migration plus `redact.ts` and access-type changes for no functional gain. Its label
   already reads "Lender Contact". [§39.5]
4. **The Alert Engine does not actually fire.** There is no email system. The panel copy
   now describes the designed state honestly instead of claiming a live behaviour. [W8]

**Still needing a browser and a signed-in session — nothing here can do it:**
approve a partner → open their link in a private window → sign up → grant that account a
membership → watch the commission appear. *(The Sales Enquiries grant buttons are
already confirmed by the user.)*

---

## §H — THE ARCHIVE

**`MEMORY_ARCHIVE.md` holds §1–§38 verbatim, under their original numbers.** Nothing was
edited or removed; it was cut from this file on 1 September 2026 because it described
states that no longer exist and briefs that have been executed.

**Code comments still point into it** — `partner-dashboard-view.tsx:28` → §31.1,
`lib/auth/landing.ts:17` → §37.3, `scripts/access-matrix-test.mjs:6` → §37.2,
`eslint.config.mjs:16` → §39.9 (which is in *this* file). Those references still resolve.

**Worth opening for:**

| Looking for | Section |
|---|---|
| The infra direction change and the reasoning behind every architectural decision | **§25** — the most valuable section in the archive |
| The original OpenNext go/no-go spike, and the first bundle measurement | §27 |
| Worker size limits, verified against live Cloudflare docs | §27.3 |
| Why `profiles.role` needs no CHECK constraint (corrects §37.3) | §37.10 |
| The three §36.5 defects, as originally described | §36.5 |
| Schema, RLS and trigger history — how the DB got to where it is | §8, §10, §12, §15, §19 |
| The Cloudflare migration, Workers Builds setup, and the 500-on-every-route saga | §26, §28, §29, §30 |
| The overnight loop records | §32, §33, §34, §37 |
| Sprint completion records, Aug 4 – Aug 22 | §8–§24 |

**Do not treat the archive as current state.** Every "❌ not built" in it that has since
been built is recorded as built in §39 and §40. When the two disagree, this file wins.

---

## 39. ▶▶ EXECUTION LOG — the `immediate_plan.md` queue (2026-09-01, COMPLETE)

> **The per-workstream record of what was actually built, kept in full because it
> describes the code as it stands today.** The queue was `immediate_plan.md`, W0→W8,
> halting at `=== STOP: CSV REQUIRED ===`. §40 is the summary; this is the detail behind
> it. The brief the queue worked from was §38, now in `MEMORY_ARCHIVE.md`.

**Three items were the user's and were left to them:** their half of W2 (the
notification decision — since answered, admin-panel-only), their half of W3 (the
Supabase password rotation), and the partner-flow visual check. The instruction was
explicit: **do not stop execution waiting for any of them.**

### 39.0 Queue status

| | Workstream | Status | Commit |
|---|---|---|---|
| W0 | Plus Jakarta Sans | ✅ **LANDED** | see below |
| W1 | Purge the six admin tables | ✅ **LANDED** | see §39.2 |
| W2 | Contact Sales flow | ✅ **LANDED** | see §39.3 |
| W3 | Security housekeeping | ✅ **LANDED** (rotation still yours) | see §39.4 |
| W4 | Lender model (banks→lenders) | ✅ **LANDED** | see §39.5 |
| W5 | R2 + PDF documents | ⛔ **BLOCKED** — now `immediate_plan.md` §0 | R2 not enabled on the account — see §39.6 |
| W6 | Channel Partner portal | ✅ **LANDED** | see §39.7 |
| W7 | Legal routes + contact wiring | ✅ **LANDED** | see §39.8 |
| W8 | eslint + the three §36.5 defects | ✅ **LANDED** | see §39.9 |

### 39.1 W0 — Plus Jakarta Sans ✅ LANDED

**What was wrong.** The three files in `app/fonts/` were not fonts. Each was a
597-byte ASCII CSS file from Fontshare containing an `@font-face` rule pointing at
a `cdn.fontshare.com` URL — and **nothing in the codebase ever imported them.**
`app/globals.css:79` asked for `"Satoshi", "Satoshi Fallback", system-ui` and got
system-ui on every page. The site has never rendered in its intended typeface.

**What changed.**
- `app/layout.tsx` — `Plus_Jakarta_Sans` from `next/font/google`, `display: "swap"`,
  exposed as the CSS variable `--font-plus-jakarta-sans`, with
  `className={plusJakartaSans.variable}` on `<html>`.
- `app/globals.css:79` — `--font-sans: var(--font-plus-jakarta-sans), system-ui, sans-serif`
  inside the Tailwind v4 `@theme inline` block.
- The three fake `.woff2` files deleted (`git rm`).
- `components/partner-dashboard-view.tsx` — all **35** inline
  `font-['Plus_Jakarta_Sans']` classes removed.

**Two notes on how it was done, both deliberate:**

1. **There were no `@font-face` blocks to remove.** The plan's W0 checklist expected
   some in `globals.css`; there were none. The fake fonts were never wired up at
   all, which is *why* the fallback was silent.
2. **The 35 inline classes were removed, not rewritten to `font-sans`.** The plan
   said replace; deletion is equivalent here and leaves less noise. Checked before
   doing it: the file contains **no** competing font class (`font-mono`, `font-serif`
   or any other `font-[...]` arbitrary value — zero hits), so every one of those
   elements inherits `font-sans` from `<body className="font-sans">`. Verified by
   `tsc` and a green build.

**Found and NOT touched — pre-existing, out of W0's scope:**
`app/layout.tsx:10` is `const _geistMono = Geist_Mono({ subsets: ["latin"] })` —
assigned, never used, and no `variable` option. `--font-mono` in `globals.css` then
asks for the literal family `"Geist Mono"`, but `next/font` emits a hashed family
name (`__Geist_Mono_<hash>`). **So `font-mono` is falling back the same way Satoshi
was.** It is the identical bug, one line away, and fixing it is not W0. Recorded
here so it is not lost.

**Gate:** `grep -ri satoshi app lib components public styles` → **0 hits.** ✅

**Standing bar:**
```
npx tsc --noEmit            clean, exit 0            ✅
pnpm run build              green, 25/25 static      ✅
leak-test.mjs               12/12 PASS               ✅
access-matrix-test.mjs      49/49 + 23/23 PASS       ✅
```

### 39.2 W1 — the fabricated admin tables ✅ LANDED

**Nine table bodies changed, not six.** The plan named six; the sweep found three
more of exactly the same kind, and they are fixed here rather than left for later:
Alert Subscribers, the Notification Dispatch Log and the Manual WhatsApp Queue all
carried `rajesh@gmail.com` / `+91 9876543210` rows. W1's own gate says *no invented
person appears anywhere*, so they were in scope.

**Wired to real queries (3):**

| Table | Source | Shows today |
|---|---|---|
| All Users | `getAdminUsers()` — new in `lib/data/admin.ts` | **5 real profiles** |
| Channel Partners | `getPartnerApplications()` — new | empty (0 applications) |
| Alert Subscribers | `getAlertSubscribersForAdmin()` — new | empty (0 active) |

**Honest empty states (6):** Package Purchases, Payments, Service Pipeline, Success
Fees, Dispatch Log, WhatsApp Queue. Each says *why* it is empty, not "No data" — the
`EmptyRow` helper in `admin-view.tsx` carries the reasoning in its docblock.

**Also removed, both fabricated figures the earlier purge missed because they sit
outside a `<tbody>`:**
- the hardcoded **`31 active · 6 pending`** in the Channel Partners header → now
  counted from the rows (`partnerCounts`, approved vs. new+contacted);
- the Service Pipeline tab counts **`All (47) / New (12) / In Progress (18) /
  Completed (14) / Dropped (3)`** → now plain labels. Nothing counted those.

**Decisions worth keeping:**

1. **"Paid" is defined as owning a `service_packages` row** — the same source
   `getAdminSectionStats().users.paidPackage` counts, so the pill and the StatCard
   above it cannot disagree. Every user reads Free today because that table is
   empty. Non-`user` roles show the role instead.
2. **Alert Subscribers lost four columns and gained one.** City / Type / Bank /
   Budget became a single "What they are watching" column rendering
   `describeAlertFilters()` chips — the same helper the profile page uses. The
   filters are a jsonb blob that need not contain any given field, so four fixed
   columns would have been "— — — —" for most real rows.
3. **Partner tier / referrals / converted / commission render `NOT_TRACKED`.** No
   table records them until W6. The Approve/Reject buttons are still inert — **W6.6
   wires them**, as planned.

**Found and NOT touched:** `admin-view.tsx` — the Click-to-Chat generator has
`defaultValue="+91 98765 43210"` and a matching `wa.me/919876543210` preview. That is
a form placeholder for a contact number, not a fabricated data row, and
**`NEXT_PUBLIC_WHATSAPP_NUMBER` is W7.2's job.** Left for W7.2 deliberately.

**Verification.** A scratch smoke script ran all five new PostgREST selects against
the live database — `tsc` cannot catch a wrong quoted camelCase column name, and
this file is full of them:
```
PASS  profiles 5 rows · shortlists 1 · service_packages 0
PASS  channel_partner_applications 0 · alert_subscriptions 0
```
**Gate:** the W1.3 sweep grep returns only `components/partner-view.tsx:299`, the
legitimate form placeholder. ✅

**Standing bar:** tsc 0 · build green 25/25 · leak 12/12 · matrix 49/49 + 23/23. ✅

> **⚠️ Gotcha, cost ~10 minutes:** `TaskStop` on the backgrounded `pnpm start`
> **did not kill `next start`** — the process kept port 3000, the restart died with
> `EADDRINUSE`, and the first leak-test run silently tested the **previous build**.
> Kill it with `taskkill //PID <pid> //T //F` (find it via `netstat -ano | grep :3000`)
> and re-run. Any bar run after a rebuild is only valid if the server was restarted.

### 39.3 W2 — Contact Sales enquiry flow (in progress)

**Notification decision, taken as the plan directed:** admin-panel-only. `RESEND_API_KEY`
is empty and the repo has no email code, so an enquiry lands in the database and is
surfaced by the panel plus a sidebar badge. Nothing pretends to send an email. The
user has this item; if they want email on submit it is a scoped addition, not an
assumption baked in now.

**W2.1 — schema ✅** `supabase/migrations/0014_contact_sales_enquiries.sql`, applied to
the live database with `node scripts/apply-sql.mjs`. Table `contact_sales_enquiries`
with enums `"SalesEnquiryPlan"` (annual_subscription | service_package) and
`"SalesEnquiryStatus"` (new | contacted | converted | closed), `handledBy` FK to
profiles `on delete set null`, and two indexes (createdAt desc, status).

> **One deliberate deviation from the plan's W2.1 sketch.** It asked for SELECT/UPDATE
> policies for admin and superadmin. There is no such policy anywhere in this schema:
> **the admin panel does not read through RLS**, it reads with the service-role client,
> which bypasses RLS. Role-checking policies would have handed the anon key real reach
> while changing nothing about how the panel works. The table is insert-only for
> anon/authenticated — the same shape `callback_requests` has and 0007 gave the other
> admin-internal tables — and the migration also revokes the default blanket grant, so
> the live grants are exactly `anon: INSERT` / `authenticated: INSERT`, verified after
> applying.

**W2.2 — server action ✅** `app/actions/contact-sales.ts`, `submitSalesEnquiry()`,
mirroring `submitCallbackRequest` in `app/actions/callback.ts` exactly.

**W2.3 — CTAs ✅** The Annual card's "Get Annual Membership" (which pointed at
`/signup`, implying a checkout that does not exist) and both "Hire Boliwala" buttons
now go to `/contact?plan=annual` and `/contact?plan=service`. Two lines of hero and
closing copy that said "Upgrade" now say "Talk to us", and a fifth pricing FAQ says
plainly that there is no card checkout and the team takes payment directly.
`components/services-view.tsx:215` was a bare `<Button>` with no link at all — a
dead CTA on the services page — now an `asChild` link like the others.

**W2.4 — the form ✅** `components/contact-form.tsx` takes an optional `plan`. With it
the form writes a sales enquiry instead of a callback, shows which plan is being asked
about, submits as "Send Enquiry", and succeeds with *"Our team will reach out within 24
hours to set up your ‹plan›."* Under the button, where the callback form promises a
call back, the sales form says **"No payment is taken here. Our team confirms the
details with you first."** — the honest description of what actually happens.
`/contact?plan=` maps `annual`→`annual_subscription`, `service`→`service_package`, and
**anything unrecognised falls through to the ordinary callback form** rather than
erroring. Verified over HTTP: both plans render their label, `?plan=bogus` renders
"Talk to Our Team".

**RLS proof (scratch script, run against live):** anon **can** insert an enquiry;
anon read → `42501`, anon update → `42501`; service role reads it back. Test row deleted.

**W2.5 — admin Sales Enquiries ✅** New sidebar item under **Leads & Sales**, between
Callback Requests and Package Purchases, with a badge on `kpis.salesEnquiriesNew`
(added to `getDashboardKpis`). `components/admin/sales-enquiries-panel.tsx` mirrors
`CallbacksPanel` — same debounced search, same status filter, same StatCard row — plus
two things it does not have: a **grant drawer** and per-enquiry **notes**.

`app/actions/admin-sales.ts` holds the grants:

| Action | Writes | Enquiry |
|---|---|---|
| `grantSubscription` | `subscriptions` (active, +1 year) + `payments` (paid) + audit | → converted |
| `grantServicePackage` | `service_packages` (pending) + `payments` (paid) + audit | → converted |
| `grantCredits` | `profiles.creditsBalance` + `credit_transactions` (`admin_adjust`) + audit | untouched |

**Four decisions inside that table:**

1. **Grants write a `payments` row, and that needed migration `0015_manual_payments.sql`.**
   `payments."razorpayOrderId"` was NOT NULL — the schema assumed every payment came
   through a gateway. Money is now taken offline, so without this the revenue KPIs read
   ₹0 while real money arrives. Inventing an order id (`manual-<uuid>`) would put a lie
   in a provider-named column, so the column is nullable instead and carries a
   `comment` saying why. **Note the knock-on: W4's lender migration is now `0016`, not
   `0015`.**
2. **Credits are deliberately not a payment and do not convert the enquiry.** Credits get
   granted as goodwill or a correction far more often than they are sold, `CreditReason`
   already has `admin_adjust`, and marking an enquiry converted for a few credits would
   overstate the pipeline.
3. **A grant is refused when no profile matches the email.** An enquiry can come from a
   signed-out visitor, so there may be no account. Refusing beats creating a shadow
   profile nobody can sign into.
4. **`admin_audit_log` gets its first ever writer.** The table has existed since the
   Prisma era with nothing writing to it. An admin opening paid access by hand, after
   money moved off-platform, is exactly what it was built for.

Not wrapped in a transaction: PostgREST has no client-side transaction and an RPC is
more machinery than five grants a month justifies. The order is chosen so a failure
leaves the **customer holding what they paid for** — entitlement first, bookkeeping
after — with the enquiry still visibly open.

**W2.6 — closing the loop on W1 ✅** Packages, Payments and Service Pipeline now read
`getAdminPackages()` and `getAdminPayments()` instead of showing an empty state
unconditionally. Their empty-state copy was rewritten to match what is now true: a row
appears when an admin grants. Packages lost its **Txn ID** column (meaningless for a
manual grant) for **Purchased**; a manual payment shows *"Collected directly"* where a
Razorpay id would go.

**Verification — the W2 "Done when", as far as it can be driven headlessly:**
```
PASS  guest submits an enquiry (anon insert, as the form does)
PASS  it appears in the pipeline as status=new
PASS  finds the account for the grant / refuses one that does not exist
PASS  writes subscription + payment (null razorpayOrderId) + audit row
PASS  marks the enquiry converted
PASS  getViewer()'s own subscription query now matches -> 'subscriber'  <-- the point
PASS  credit grant moves the balance 4 -> 7 and writes the ledger row
```
11/11, every test row deleted afterwards, run against the **superadmin's own account**
so no customer was touched even momentarily. Confirmed clean: no `admin_adjust` row
survives and the balance is back at 4.

> **What this does NOT prove:** that the buttons are wired to the actions. The panel
> needs a signed-in superadmin browser session, which is not available here — the same
> gap as Item B's visual check. **Add it to the same five minutes:** open
> `/admin` → Sales Enquiries, submit an enquiry from `/pricing` first, then use
> **Grant…** on it.

**Standing bar:** tsc 0 · build green 25/25 · leak 12/12 · matrix 49/49 + 23/23. ✅

### 39.4 W3 — security housekeeping ✅ LANDED (the password rotation is still yours)

**`supabase/migrations/0016_grants_match_policies.sql`**, applied. Note the number:
W2's manual-payments migration took 0015, so **W4's lender migration is `0017`**.

**The before-state, recorded as the plan asked.** Fifteen of eighteen tables carried
Postgres's default blanket grant for **both** `anon` and `authenticated`:

```
DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
```

on `admin_audit_log`, `payments`, `subscriptions`, `credit_transactions`,
`service_packages`, `callback_requests`, `channel_partner_applications`, `settings`,
`banks`, `shortlists`, `unlocks`, `listing_views`, `listing_images`,
`bulk_upload_batches` — and `profiles` and `alert_subscriptions` with everything except
table-level UPDATE. **RLS was the only thing standing in the way of the anon key
writing to the audit log.**

**⚠️ The single most important finding of this workstream — and the plan did not know
about it.** Three tables already carry hand-made **column-level** grants, and they are
load-bearing:

| Table | Column grant | What it is actually doing |
|---|---|---|
| `listings` | anon/authenticated SELECT on **27 named columns** | `flatNumber`, `floor`, `inspectionDatetime`, `inspectionNotes`, `authorisedOfficer{Name,Phone,Email}`, `bankContact`, `createdBy` are **not selectable**. The credit gate is enforced at the database, underneath the app's redaction. |
| `profiles` | authenticated UPDATE on **6 columns** | fullName, phone, city, panNumber, aadhaarNumber, preferences. **Not `role`. Not `creditsBalance`.** |
| `alert_subscriptions` | authenticated UPDATE on **`isActive`** | pause/resume only — a user cannot rewrite where an alert is delivered. |

**A table-level `REVOKE UPDATE ... FROM authenticated` destroys the whole column list,
and a table-level `GRANT UPDATE` lets any signed-in user set their own role to
superadmin.** The plan's per-table instruction, followed literally, would have done
exactly that. The migration therefore issues **no table-level UPDATE statement at all**
on those three, and says so at the top in case someone later "tidies" it.

**After: every grant now matches its table's policies.**

```
anon           listings(27 cols), banks, settings, listing_images ....... SELECT
               callback_requests, channel_partner_applications,
               contact_sales_enquiries, alert_subscriptions ............ INSERT
               everything else ......................................... nothing
authenticated  + profiles, subscriptions, payments, service_packages,
                 credit_transactions, unlocks, alert_subscriptions ...... SELECT
               + shortlists ............................................ SELECT, INSERT, DELETE
               + profiles(6 cols), alert_subscriptions(isActive) ........ UPDATE
```

`TRUNCATE`, `REFERENCES` and `TRIGGER` are revoked schema-wide from both roles, and
`ALTER DEFAULT PRIVILEGES` now revokes them from every table created from here on — so
W5's and W6's new tables do not land back at the permissive default.
`_prisma_migrations` **is already gone** from this database (`to_regclass` → null);
nothing to drop.

**`scripts/grants-test.mjs` — a new, permanent third matrix.** The gating matrix and the
leak test prove the *application* redacts; this proves the *database* would refuse even
if the application did not. It connects on `DIRECT_URL`, then for each case does
`set local role anon|authenticated` with the JWT claims PostgREST would set, runs the
statement, and rolls back — nothing is written.

```
node scripts/grants-test.mjs      27/27 PASS
```

Both directions are asserted, which is the point:

- a guest reads live listings but **cannot** read `flatNumber` or the officer's phone;
- a guest submits a callback, an enquiry and an alert, and **cannot** read any of them back;
- a signed-in user edits their own name, and **cannot** set `role = 'superadmin'`,
  **cannot** set `creditsBalance = 9999`, **cannot** grant themselves a subscription,
  **cannot** forge an audit row, **cannot** shortlist as another user, and **cannot**
  rewrite an alert's delivery address.

Kept as its own tally — **do not fold these 27 into the 49 or the 23.**

> ### ⏳ Still yours, and W3 is not closed until it is done
> **Rotate the Supabase database password.** The current one was pasted into a chat
> transcript. Do it in the Supabase dashboard, then update `DATABASE_URL` and
> `DIRECT_URL` in `.env.local`, `.dev.vars` and the Cloudflare Worker secrets, and
> re-run `node scripts/grants-test.mjs` (it connects on `DIRECT_URL`, so it doubles as
> the "did the rotation break anything" check).

**Standing bar:** tsc 0 · build green 25/25 · leak 12/12 · matrix 49/49 + 23/23 ·
grants 27/27. ✅

### 39.5 W4 — the lender model ✅ LANDED

**`supabase/migrations/0017_lenders.sql`** (not 0015 — W2 and W3 took 0015 and 0016).
`banks` → `lenders`, `listings."bankId"` → `"lenderId"`, both renamed constraints, the
policy renamed to `lenders_public_read`, and a new `"LenderType"` enum
(`bank | nbfc | arc | hfc`) as `lenders."lenderType"`, defaulting to `'bank'` — which
backfills the six existing rows in place, all of which genuinely are banks.

**Renames, not copies.** Verified afterwards that the primary key, the foreign key, both
policies **and the column-level grants from W3 all followed the rename**:
`lenders` still SELECT-only for anon/authenticated, and `listings."lenderId"` is still
inside the 27-column public SELECT grant. No temporary `banks` view was needed; nothing
depended on the old name once the code landed.

**The code: 69 identifier-level references across 21 files**, done in three passes with
`tsc` after each — first the precise identifiers (`bankId`, `getBanksForAdmin`,
`BankWithCount`, the `bank:banks(...)` PostgREST alias), then the relation property and
the props, then the URL parameter. Prose was left alone deliberately; W4.5 below.

> **The trap in the middle of it.** Pass 1 renamed the PostgREST alias to
> `lender:lenders(...)` but not the `.bank` property reads — and **`tsc` stayed green**,
> because those query results are cast rather than inferred. Every listing page would
> have rendered `undefined` for the lender at runtime. Pass 2 existed only to close
> that. If this rename ever needs redoing: **the type checker will not catch it.**

**W4.3 — the lender-type facet.** New sidebar section above the lender list, with a
removable active-filter chip.

The type lives on `lenders`, not on `listings`, so filtering it as an embedded PostgREST
resource would need `!inner` and would break the sibling count query — which selects only
`lenderId` and embeds nothing. `resolveLenderIds()` resolves ids by type first instead:
one extra round trip against a six-row table, and both queries keep reading the same way.
**An empty result from that resolver is meaningful and distinct from "no filter"** — a
type with no lenders must return nothing, not silently drop the filter. Verified over
HTTP against a production build:

```
/search                                    12 listings
/search?lenderType=bank                    12
/search?lenderType=nbfc                     0   <- filter held, not dropped
/search?lender=<SBI>                        3
/search?lenderType=nbfc&lender=<SBI>        0   <- the two narrow together
```

**W4.4 — bulk upload. Two findings worth reading before W-INGEST.**

1. **The rename silently broke auto-detection of a real inventory file.**
   `guessColumn()` builds its candidates from the field *label*, so once the label became
   "Lender (name)" a sheet with a **`Bank`** column matched nothing, and every row would
   have failed with *"Lender column not mapped or empty"*. The files the client is
   preparing say Bank. Fixed with an explicit `HEADER_SYNONYMS` table
   (`bank`, `bankname`, `financialinstitution`), and `scripts/bulk-sample-selfcheck.mjs`
   now asserts all four spellings map — it pulls the synonym table out of the component
   verbatim, like everything else it checks, so the two cannot drift.

2. **The "Lender Type" column the plan asked for was deliberately NOT added, and this
   needs your decision.** A listing CSV cannot set it: the type belongs to the *lender*
   row, and bulk upload does not create lenders — an unrecognised lender is a rejected
   row, on purpose. Adding the column would mean a listing import quietly rewriting
   lender records, which is a worse idea than the missing column.
   **The real gap it exposes: there is no admin UI for lenders at all** — no create, no
   edit, no way to set a type. That is pre-existing (lenders have only ever been a
   dropdown source), but the facet makes it visible, because until a lender is marked
   `nbfc` the NBFC filter will always be empty. **W-INGEST is the natural owner** — it
   has to create lenders from the real file anyway — but if you want the facet usable
   before then, say so and it is a small admin panel.

**W4.5 — copy.** Changed only where the rename made it wrong, per the plan: the
"Authorised officer & bank contact" label (it will hold an NBFC's contact), the "Banks"
stat label under a count that now counts every lender type, "All Banks" filter options,
and the bulk-upload help text. **Deliberately kept:** "bank auction properties" in
marketing copy and the `/search` SEO title — every lender in the database today is a
bank, and it is the phrase people actually search for.

**Also caught and fixed:** the rename corrupted two real bank names in the self-check
fixture (`Canara Bank` → "Canara Lender", `IDBI Bank` → "IDBI Lender"). A blanket
identifier rename over a file containing real-world names is exactly how that happens.

**Left alone, deliberately:** `listings."bankContact"` keeps its name. It is not a
foreign key and renaming it means another migration plus changes in `redact.ts` and the
access types for no functional gain; its *label* now reads "Lender Contact".

**Gate:** `grep -rn '\bbanks\b|bankId|getBanksForAdmin' lib/ components/ app/` returns
**zero** schema or identifier hits. ✅

**Standing bar:** tsc 0 · build green 25/25 · leak 12/12 · matrix 49/49 + 23/23 ·
grants 27/27 (its `banks` case updated to `lenders`) · bulk self-check PASS + 4 header
spellings. ✅

### 39.6 W5 — R2 storage ⛔ BLOCKED, and nothing was half-built

`npx wrangler r2 bucket list` against the account (`boliwaladevs@gmail.com`,
`dd735b278158c0a26949c1d5d6b6ebc3`) returns:

```
Please enable R2 through the Cloudflare Dashboard. [code: 10042]
```

**R2 is not enabled, and enabling it needs a card on the dashboard** — a client
conversation, not an engineering step. The user has parked it deliberately (2026-09-01)
and confirmed **R2 only** — Supabase Storage was offered as a no-card alternative and
declined, so `0008`'s unused bucket stays unused.

**Nothing was built against it.** No schema, no upload code, and specifically **no
bindings in `wrangler.toml`** — a binding naming a bucket that does not exist breaks the
CI deploy, which would have turned a blocked workstream into a broken one. The plan's
rule 6 says finish everything else in a blocked workstream; here *everything* in W5 sits
behind the bucket, so the honest total is zero.

**To resume, in order:** enable R2 → `wrangler r2 bucket create boliwala-images` and
`boliwala-docs` → enable each bucket's public `r2.dev` URL → add both bindings plus a
single `R2_PUBLIC_BASE` env var (so the `cdn.boliwala.com` cutover stays one line) →
then W5.2–W5.4. **W-INGEST also depends on this**, though it is CSV-blocked anyway.

### 39.7 W6 — the channel partner portal ✅ LANDED

**Client answers that made this real (2026-09-01):** commission is **10% of an annual
membership** and **15% of a service package**. Tier thresholds are still being decided.
Contact-Sales notification stays admin-panel-only. There is to be no lender admin UI —
and the product spec agrees: §5 lists the entire admin panel and contains no lender
management at all.

**`supabase/migrations/0018_partner_commissions.sql`.** `partner_referrals`,
`partner_commissions`, `partner_payouts`, four enums, plus `profiles."referralCode"`
(unique) and `profiles."partnerTier"`. RLS: a partner reads only their own rows; grants
narrowed by hand in the W3 style, because `ALTER DEFAULT PRIVILEGES` only strips the
three dangerous privileges and a new table still arrives with SELECT/INSERT/UPDATE/DELETE
for `anon`.

**Design decisions worth keeping:**

1. **A click is not a referral.** `middleware.ts` captures `?ref=` into an httpOnly
   cookie and writes nothing; `attributeReferral()` turns it into a row only when an
   account is actually created. The table is therefore a record of signups, and a partner
   cannot inflate it by hitting their own link. `unique (referredProfileId)` means a
   second partner can never claim someone already referred — **verified**.
2. **The cookie's 30 days is a ceiling, not the rule.** Middleware runs on every request
   and has no business querying Supabase, so the window is enforced server-side at
   signup from `referral_attribution_days`. Shortening it in settings takes effect
   immediately, including for cookies already handed out.
3. **`ratePct`, `grossAmount` and `commissionAmount` are stored on the commission row.**
   Product spec §5.10: a rate change applies to new commissions only. **Verified by
   moving the rate to 99% and confirming an earned commission did not re-price.**
4. **Two-stage money.** A commission accrues automatically, then a human approves it
   before it can be paid — a refunded or disputed sale gets caught before money leaves.
5. **Tiers are assigned, not computed.** The thresholds are undecided, so the settings
   hold **null** rather than an invented number, and the admin panel shows an empty box
   labelled "not decided yet". A `0` would have read as "everyone qualifies for Gold".
6. **The payout is built from the commissions it covers**, never typed in, so the two
   cannot disagree about the amount. It records a transfer made outside Boliwala; it does
   not pretend to move money.
7. **`accrueCommissionForPurchase()` never throws.** It runs after the customer's
   entitlement already exists — a bookkeeping failure must not undo something paid for.

**The 583-line mockup is gone.** `components/partner-dashboard-view.tsx` was ₹31,297 in
invented earnings, 45 invented referrals, a Gold tier and a partner named Rahul Mehta,
served to anyone holding the role. It now renders the signed-in partner's real data, and
a new partner correctly sees **zeros and empty tables**. Two sections say plainly what
does not exist rather than faking it:

- **Invite People** cannot send anything — there is no email or WhatsApp integration. It
  gives the partner their link, share buttons that open the partner's *own* WhatsApp or
  mail client, and an **Invitation status** table of what happened to the people who used
  the link. That closes the §31.1 gap in the only honest form available.
- **Marketing Creatives** needs admin-uploaded templates (spec §5.11) and image storage —
  neither exists — so it is an empty state that says so.

**Admin (`components/admin/partners-panel.tsx`)** replaces W1's read-only table:
applications with Approve (choosing a tier) / Reject, live partners with their code,
tier, referral and conversion counts and lifetime earnings, and a commission queue with
Approve and Record-payout. Approving flips the role, issues a code — **a re-approval
reuses the existing code**, since links are already in circulation — and writes to
`admin_audit_log`, as do tier changes, approvals and payouts.

**Verification.**

*A third tally in `scripts/access-matrix-test.mjs`, kept separate from the 49 and the 23
exactly as the plan requires:*
```
15 assertions across partner data isolation      PASS
  partner A reads their own referrals / commissions / payouts
  partner A sees NOTHING of partner B's, in all three tables
  partner A cannot write a commission, approve one, invent a payout,
    or reassign someone else's referral
  anon cannot read any of the three
  grantSubscription() and grantServicePackage() both call accrueCommissionForPurchase()
```
Every row it creates is made inside a transaction and rolled back — confirmed 0 rows
afterwards in all three tables.

*A live end-to-end run of the whole lifecycle (10/10), then deleted and the profiles
restored:*
```
approval -> channel_partner with a code and a tier
referral recorded; a second partner cannot claim the same person
commission = 10% of the real annual price, stored as accrued
a rate change does NOT re-price a commission already earned
approve -> approved; pay out -> paid, settled against a payout record
dashboard lifetime earnings read the right number
```

*The middleware, over HTTP against a production build:* `?ref=TESTCODE1` sets an
httpOnly, 30-day, SameSite=lax cookie; `?ref=../../etc/passwd` sets nothing; no `?ref=`
sets nothing.

> **⚠️ Worth a five-minute check when convenient, and worth reading now:** the
> end-to-end run earned **₹300, not ₹100** — because `annual_price` in the live settings
> table is **₹2,999**, not the ₹999 the spec and the brief both say. The commission is a
> percentage of whatever the price actually is, so this is arithmetic doing what it was
> told. **If ₹999 is the intended launch price, it needs changing in admin → Settings**,
> where it also drives the pricing page.

**What is NOT verified:** the admin buttons calling these actions, and a real partner
signing in to see their own dashboard. Both need browser sessions. Add to the same pass
as the other checks: approve an application, use the partner's link in a private window,
sign up, then grant that account a membership from Sales Enquiries and watch the
commission appear.

**Standing bar:** tsc 0 · build green 25/25 (+ middleware) · leak 12/12 ·
matrix 49/49 + 23/23 + **15/15 partner isolation** · grants 27/27 · bulk self-check PASS.

### 39.8 W7 — legal routes, contact wiring, brand assets ✅ LANDED

**W7.1 — the routes exist, the copy does not, and that is the point.**
`/privacy` and `/terms` are real routes with correct metadata, both linked from the
footer (which pointed at `href="#"`) and both in `app/sitemap.ts`. They share
`components/legal-page.tsx`.

> **They deliberately contain no invented legalese.** A placeholder privacy policy is
> still a public statement about how personal data is handled, and a wrong one is a
> liability, not a placeholder. Each page says the policy is being finalised and gives a
> real email to ask in the meantime. **When the client's text arrives it is a paste into
> `LegalPage`'s children, not a build.**

**Build baseline moved: 25/25 → 27/27 static pages.** Expected, and exactly the +2 the
plan predicted. Verified live: both routes 200, both in `/sitemap.xml`, both linked from
the footer.

**W7.2 — contact details.** The engineering was already done in an earlier sprint:
`lib/contact.ts` reads `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER` and
`NEXT_PUBLIC_CONTACT_EMAIL`, and **renders nothing rather than a placeholder when a
value is empty**. The gate passes: `grep -rn "234) 567\|+1 (234)" app components` → **0**.
(The one remaining hit anywhere is a sentence inside `lib/contact.ts`'s own docblock
explaining why the helper exists — documentation, not output.)

What W7.2 actually had left to fix was **one admin tool that still had a fake number in
it**: the Click-to-Chat Link Generator hardcoded `+91 98765 43210` and displayed a
`wa.me/919876543210` link to match. It now starts from the configured number, generates
a real link as you type, copies it, and when nothing is configured says
*"No WhatsApp number configured — set `NEXT_PUBLIC_WHATSAPP_NUMBER`"* instead of showing
a link to a stranger's phone.

`NEXT_PUBLIC_CONTACT_EMAIL` was missing as a key from `.env.local` and `.dev.vars`
entirely — added, empty, so all three sit together and filling them is one line each when
the client sends the numbers (expected the week of 2026-09-08). **They are not set yet,
so the footer and contact page currently render those slots as nothing, which is
correct.** `NEXT_PUBLIC_CONTACT_EMAIL` falls back to `hello@boliwala.com`.

**W7.3 — brand assets: SKIPPED, as the plan instructs.** The client's assets are ~a week
out. `app/icon.tsx`, `app/apple-icon.tsx` and `app/opengraph-image.tsx` still generate the
amber mark at build time, and `components/logo.tsx` is unchanged. Nothing is blocked by
this; swap them when the files arrive.

**Standing bar:** tsc 0 · build green **27/27** · leak 12/12 · matrix 49/49 + 23/23 +
15/15 · grants 27/27. ✅

### 39.9 W8 — lint, the §36.5 defects, and one dishonest banner ✅ LANDED

**`pnpm run lint` runs for the first time in this project's life.** The script has been in
`package.json` since it was scaffolded; eslint was in neither `dependencies` nor
`devDependencies`, so it had never executed once. Added `eslint@9`,
`eslint-config-next@16.0.10` and a flat `eslint.config.mjs`.

> **Gotcha, cost ~10 minutes:** `eslint-config-next@16` ships **native flat config**.
> Wrapping it in `FlatCompat`, which every `.eslintrc` recipe online still shows, throws
> `TypeError: Converting circular structure to JSON`. Import
> `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` and spread them.

**The first run reported 11,998 problems. 11,710 of them were one file** —
`.wrangler/tmp/.../worker.js`, a generated dev bundle. Ignoring `.wrangler/**` leaves the
actual project.

**Four rules demoted to warnings, each for a stated reason** (the reasons are in
`eslint.config.mjs`, not just here):

| Rule | Count | Why a warning |
|---|---|---|
| `react-hooks/static-components` | ~220 | Presentational helpers declared inside `admin-view.tsx`. The real fix is to delete them and import the **identical components that already exist in `components/admin/ui.tsx`** — a genuine simplification, and one that touches every table in the admin panel. Not something to do at the end of the queue with no browser to check it. **Recorded as debt.** |
| `react/no-unescaped-entities` | 31 | Apostrophes in body copy. React renders them fine. |
| `react-hooks/set-state-in-effect` | 7 | Mostly a false positive: the flagged effects read `localStorage`/`window` and set state from it, which is exactly right in an SSR app — a `useState` initialiser would break hydration. |
| `@typescript-eslint/no-explicit-any` | 14 | `any` props on the same pre-existing admin helpers. |

`components/ui/**` (vendored shadcn) additionally relaxes `purity`, `refs` and
`rules-of-hooks`: it is generated upstream source, and editing it means diverging from
upstream for warnings nobody will action.

**Result: `pnpm run lint` → 0 errors, 287 warnings, exit 0.** It is now part of the
standing bar. **"0 errors" is not "nothing left to do"** — the table above is the debt.

**The linter immediately earned its place** by catching something real in W4's own code:
`HEADER_SYNONYMS` in `scripts/bulk-sample-selfcheck.mjs` is used only inside an `eval`'d
string, so it reads as unused. Annotated with the reason rather than silenced.

**The three §36.5 defects:**

1. **The header's Log In link dropped context.** Every other route into `/login` preserves
   where the visitor was — the unlock button, the save-property button, the partner login
   link — but the header sent them to `/profile` instead of back to the page they were
   reading. Both the desktop and mobile links now use `withNext("/login", currentPath())`.
   Computed only once the session state is known, which is the only time the link renders,
   so there is no server pass to disagree with and no `useSearchParams()` forcing pages
   out of static rendering.

2. **`bulkCommitListings` silently dropped rejected rows.** It incremented a counter on
   success and discarded the error otherwise, so a 40-row upload that inserted 12
   reported *"12 listings created"* and said nothing about the other 28. It now returns
   `rejected: { row, title, reason }[]`, the panel lists every rejection with the
   database's own message, and the toast turns destructive when anything was refused.
   Still best-effort per row rather than all-or-nothing — one bad row should not throw
   away the good ones — but nothing disappears quietly now. **This matters far more once
   the client's real inventory arrives, which is why it was done before the STOP.**

3. **"Real-time matching is ON" was a lie.** The Alert Engine panel announced that every
   new listing is instantly checked against alert rules and "matches fire email
   immediately". Nothing checks anything, and there is no email or WhatsApp integration to
   deliver a match with. It now reads **"Matching is designed, not running"** and says
   subscribers are being collected while delivery is not built.

**⚠️ The fourth item — re-measure the Worker bundle — is NOT done, and cannot be done
from this machine.**

`npx opennextjs-cloudflare build` fails here with
`Cannot read directory ... node_modules/.pnpm/next@16.0.10.../react: Access is denied`
— the Windows/pnpm symlink limitation already recorded as §5 gotcha #10. `wrangler
versions list` does not report size. So the number cannot be obtained locally.

**How to get it:** the Workers Builds log prints `Total Upload: … KiB / gzip: … KiB` on
every CI build. **The last baseline was 2.74 MiB gzip against a 3 MB free-tier cap — 92%
— and that predates W2, W4, W6 and W7.** This is worth an actual look rather than an
assumption; if the account is still on Workers Free, a deploy will be *rejected*, not
merely slow, when it crosses.

**Confirmed while checking:** Workers Builds **auto-deploys on push to `main`**. The live
worker at `boliwala.boliwaladevs.workers.dev` already serves W0–W6 (the Plus Jakarta font
and `/contact?plan=annual` are live; `/privacy` still 404s because W7 had not been pushed
at the time of checking).

**Standing bar — now including lint:**
```
npx tsc --noEmit                                    clean, exit 0        ✅
pnpm run build                                      green, 27/27         ✅
pnpm run lint                                       0 errors, exit 0     ✅  (NEW)
leak-test.mjs                                       12/12 PASS           ✅
access-matrix-test.mjs                              49/49 + 23/23 + 15/15 ✅
grants-test.mjs                                     27/27 PASS           ✅
bulk-sample-selfcheck.mjs                           PASS                 ✅
```

---

## 40. ☀️ RETURN SUMMARY — the pre-launch queue is complete (2026-09-01)

> **Read this first. Then §39 for per-workstream detail, then `immediate_plan.md`
> for what sits below the STOP.**

### 40.1 What landed

**Eleven commits**, all pushed to `main`, each with the standing bar green. (The table below
has nine rows but eleven hashes — W2 and W4 each landed across several commits.)

| | Workstream | Commit |
|---|---|---|
| W0 | Plus Jakarta Sans replaces the Satoshi files that were never fonts | `a124b61` |
| W1 | The fabricated admin tables query the DB or say they are empty | `cda2de8` |
| W2 | Contact Sales: table, action, CTAs, form | `7cb1d3c`, `56daff8` |
| W2 | Sales Enquiries in admin + the manual entitlement grant | `0ecc190` |
| W3 | Grants narrowed to match the RLS policies | `ac54d09` |
| W4 | banks → lenders, and the lender-type facet | `5644827`, `c0b8433` |
| W6 | The channel partner portal, on real referrals and commissions | `0c71ed4` |
| W7 | Legal routes, real contact wiring | `9374b23` |
| W8 | Lint runs, the three §36.5 defects, one dishonest banner | `df9fd84` |

**Five database migrations applied to the live database:** `0014` contact sales
enquiries · `0015` manual payments (nullable `razorpayOrderId`) · `0016` grants matching
policies · `0017` lenders · `0018` partner commissions.

### 40.2 What did NOT land, and why

**W5 — R2 storage and PDF documents. ⛔ Blocked, not skipped.**
`wrangler r2 bucket list` returns *"Please enable R2 through the Cloudflare Dashboard
[code: 10042]"*. Enabling it needs a payment method, which is a client conversation. The
user parked it deliberately and confirmed **R2 only** — Supabase Storage was offered as a
no-card alternative and declined.

**Nothing was half-built against it**, and in particular no `wrangler.toml` bindings: a
binding naming a bucket that does not exist breaks the CI deploy, which would turn a
blocked workstream into a broken deployment. Detail and the resume order: **§39.6**.

**The Worker bundle re-measure (a W8 item).** Cannot be done on this machine —
`opennextjs-cloudflare build` dies on pnpm symlinks with "Access is denied" (§5 gotcha
#10). Read it from the Workers Builds log instead: **last known 2.74 MiB gzip against a
3 MB free-tier cap, and that predates W2, W4, W6 and W7.** Worth a real look.

### 40.3 The standing bar, and what changed in it

```
npx tsc --noEmit                          clean, exit 0
pnpm run build                            green — 27/27 static pages   (was 25/25; W7 added two)
pnpm run lint                             0 errors, 287 warnings       (NEW — never ran before W8)
node scripts/leak-test.mjs <url>          12/12 PASS
node scripts/access-matrix-test.mjs       49/49 gating + 23/23 doors + 15/15 partner isolation  (NEW third tally)
node scripts/grants-test.mjs              27/27 PASS                   (NEW in W3)
node scripts/bulk-sample-selfcheck.mjs    PASS + 4 header spellings
```

**Keep the three access-matrix tallies separate.** 49, 23 and 15 are independent
baselines; folding them together makes every future comparison meaningless.

### 40.4 Things found and deliberately NOT touched

1. **`font-mono` is broken exactly the way Satoshi was** — `--font-mono` asks for the
   literal `"Geist Mono"` while `next/font` emits a hashed family name, and `_geistMono`
   in `app/layout.tsx:10` is assigned and never used. One line from W0's fix; out of its
   scope. §39.1.
2. **~220 `react-hooks/static-components` warnings** whose real fix is deleting
   `admin-view.tsx`'s inline helpers in favour of the identical ones already in
   `components/admin/ui.tsx`. A real simplification, touching every admin table — not for
   the end of a queue with no browser. §39.9.
3. **`listings."bankContact"` keeps its name.** Not a foreign key; renaming means another
   migration plus `redact.ts` and access-type changes for no functional gain. Its label
   now reads "Lender Contact". §39.5.
4. **No admin UI for lenders** — no create, no edit, no way to set a type, so the new
   NBFC/ARC/HFC facet stays empty until W-INGEST creates lenders from the real file. The
   user checked the URD and confirmed it was never scoped; **skip stands**. §39.5.

### 40.5 What needs the user's hands

1. **Enable R2** → then W5 is a clean run.
2. **Read the bundle size** off the next Workers Builds log.
3. **Check `annual_price`.** The live settings row is **₹2,999**, not the ₹999 in the
   spec — so a 10% partner commission earns ₹300, as the end-to-end run demonstrated.
   Change it in admin → Settings if ₹999 is intended; it also drives the pricing page.
4. **Browser checks** (nothing here can hold a signed-in session): the Sales Enquiries
   grant buttons ✅ *already confirmed by the user*, plus **approve a partner → use their
   link in a private window → sign up → grant that account a membership → watch the
   commission appear**.
5. **Tier thresholds**, when decided — they are stored as `null` today and admins assign
   tiers by hand, which is what the URD describes anyway.
6. **Legal copy, contact numbers, brand assets** — expected the week of 2026-09-08. All
   three are a paste or a config change now, not a build.

### 40.6 🛑 THE STOP

**`immediate_plan.md`'s `=== STOP: CSV REQUIRED ===` has been reached and respected.**
W-INGEST, W-SEO and W-DNS were not started.

> **The inventory CSV is now the only thing between here and launch.** The two standing
> client asks:
>
> 1. **One sample CSV/Excel file** — not the dataset, one file. W-INGEST's deduplication
>    key cannot be designed without the real column names, and a dedup key designed
>    against imagined ones is worse than none because it looks finished. W4 already put
>    `bank`, `bankname` and `financialinstitution` into the importer's header synonyms,
>    so a real file's own spelling should map on arrival.
> 2. **Commission rates ✅ answered** (10% / 15%) — **tier thresholds still open**.
>
> The other two things below the STOP are not CSV-blocked: **W-SEO** needs only the
> lender model, which W4 landed, and the client's willingness to pull it forward;
> **W-DNS** needs the domain connected.
---

## 41. 📦 THE WORKER BUNDLE — MEASURED (2026-09-01)

> **This closes the one W8 item that could not be done, and it closes it with a real
> number rather than a reading off someone else's log.** The measurement was the point;
> the workaround that made it possible is §41.3 and gotcha #11.

### 41.1 The number

```
$ npx opennextjs-cloudflare build          →  OpenNext build complete.   ✅ first success on this machine
$ npx wrangler deploy --dry-run --outdir <tmp>

  ✨ Read 57 files from the assets directory .open-next/assets
  Total Upload: 11158.17 KiB / gzip: 2599.55 KiB
```

| | 2026-08-30 (§27, 24 pages) | **2026-09-01 (27 pages)** | Change |
|---|---|---|---|
| Raw upload | 12063.84 KiB | **11158.17 KiB** | **−905.67 KiB (−7.5%)** |
| **Gzip — the number that counts** | 2809.30 KiB (2.74 MiB) | **2599.55 KiB (2.54 MiB)** | **−209.75 KiB (−7.5%)** |
| Against the **3 MB free cap** | ~92% | **~85%** | **+7 points of headroom** |
| Against the 10 MB paid cap | 27% | 25% | — |

**Headroom on the free plan: roughly 470 KiB gzip.**

Same tool, same command, same units as §27 — the two figures are directly comparable.

### 41.2 What this changes, and what it does not

**It went down, not up.** W2, W4, W6 and W7 all landed between the two measurements and
the bundle still shrank by 7.5%. The plausible cause is that W1 and W6 **deleted** far
more than the new work added: nine fabricated admin table bodies and a 583-line
hardcoded partner dashboard, all of it inline mock data that was being bundled.
**That explanation is a hypothesis — it was not isolated or verified.** The measurement
itself is solid; the reason for it is not.

**Where that leaves the risk:**

- **The alarm was overstated, and this is a correction to a warning this file has been
  carrying since §27.** "92% full and rising" was a fair reading of the evidence
  available, but the evidence was eight days stale and pointed the wrong way. At 85%
  with ~470 KiB of room, **nothing is about to be rejected.**
- **The risk is real but not imminent.** On Workers Free an over-cap deploy is
  **rejected outright**, not slowed — so the failure mode is still a green pipeline that
  suddenly cannot deploy, with no code change to blame. What has changed is the distance
  to that cliff, not the shape of it.
- **What is still queued to move it:** W5's R2 client, W-INGEST, and W-SEO's route
  matrix. R2's client is a few tens of KiB; the SEO matrix is generated routes, which is
  where bundles usually grow.
- **The $5/month recommendation stands unchanged** (`client_requirement.md` §1.2b). It
  is now a sensible precaution rather than an emergency, and it should be presented to
  the client that way. Buying 10 MB for ₹450/month removes the question permanently.

**Re-measure before adding any dependency, and after W5 and W-SEO specifically.**

### 41.3 How to reproduce it on this machine

The build has never completed here before — gotcha #10 records that a Windows build is
not *deployable*, and gotcha #11 records why it would not even *finish*. It finishes now:

```bash
# 1. Record and dereference the 21 pnpm symlinks the adapter copies.
#    They are: .pnpm/next@…/node_modules/{@next/env,@swc/helpers,react,react-dom,styled-jsx}
#              .pnpm/node_modules/{@next/env,@swc/helpers,buffer-from,client-only,
#                                  detect-libc,semver,source-map,source-map-support,styled-jsx}
#              .pnpm/react-dom@…/node_modules/react
#              .pnpm/sharp@…/node_modules/{detect-libc,semver}
#              .pnpm/source-map-support@…/node_modules/{buffer-from,source-map}
#              .pnpm/styled-jsx@…/node_modules/{client-only,react}
#    Save each path and its readlink target first — you must put them back.
#    Note the targets are a mix of relative and absolute; handle both.
#
# 2. npx opennextjs-cloudflare build
# 3. npx wrangler deploy --dry-run --outdir <tmp>     ← read Total Upload / gzip
# 4. Restore all 21 symlinks from the saved manifest, exactly as they were.
# 5. Re-run the standing bar to prove node_modules is intact.
```

**Step 4 is not optional.** Leaving them dereferenced puts two physical copies of
`react` in the tree — Next's internals would resolve one and the app the other, which is
how you get two React instances and hook failures. Restored and verified on 1 Sep;
`tsc`, `build` (27/27) and `lint` (0 errors) all green afterwards.

**And the number is still only a size.** Gotcha #10 stands: **this bundle must never be
deployed.** Size is unaffected by the manifest-path bug — every module is present and
bundled either way — but the artefact itself 500s on every route. Deploys come from
Workers Builds on Linux, always.

> **Sanity-check it once against CI.** The next Workers Builds log prints its own
> `Total Upload / gzip`. A Linux build should land within a few KiB of 2599.55. If it
> does not, trust CI and correct this section.

---

## 42. 📋 SESSION LOG — 2026-09-01, afternoon

Five tasks, handed over as a batch after §40. What actually happened:

### 42.1 Push — nothing to do

`git status` clean, `git fetch origin` then `git rev-list --left-right --count
origin/main...main` → **`0  0`**. Every commit through `9ac9558` was already on
`origin/main` before this session started. **No push was performed because none was
needed**, not because one was skipped.

### 42.2 `client_requirement.md` — new

The client-facing critical path, in one document. Twelve items across three sections:
what blocks launch (§1), commercial (§2), what has already been answered (§3), and what
is deliberately *not* being asked for yet (§4).

**Beyond the list that was handed over, these were added because the repo shows they are
outstanding and nothing else was tracking them:**

- **Contact details** — `NEXT_PUBLIC_CONTACT_PHONE`, `_WHATSAPP_NUMBER` and
  `_CONTACT_EMAIL` are **empty in both `.env.local` and `.dev.vars`**. W7.2 wired the
  site to render *nothing* rather than a placeholder, so the omission is invisible and
  therefore easy to forget.
- **DLT registration** — from `CLIENT_ACTIONS_FOR_SMS.md`. A ~₹5,900 fee, a sender ID, a
  registered template, 2–3 days of approval, and **required even if SMS goes via
  Twilio**. It belongs beside the Meta ask because both are slow third-party reviews.
- **A clean, unregistered phone number** for the WhatsApp sender — the constraint that
  most often derails a Meta onboarding.
- **Business documents** (GST certificate, Certificate of Incorporation) for Meta
  Business Verification.
- **The annual price question**, promoted from a footnote to a numbered blocker, because
  it drives partner commissions and not just the pricing page.
- **The Workers paid upgrade**, folded into the same 30-minute meeting as R2 and the
  domain — one sitting, one card, three problems solved.
- **Substantiable About-page statistics**, or a decision to leave them out. The old
  figures (₹2,100 Cr won, 840+ auctions, 28% average saving) were removed as
  unsupported; the client should know they are gone and why.

**Deliberately excluded:** Play Store / App Store developer credentials. The APK is not
ready, so asking now would put a credential in a drawer for weeks. Recorded in §4 of that
document as considered-and-deferred rather than left silent.

### 42.3 `immediate_plan.md` — W5 re-filed below the STOP

**W5 moved out of the workstream queue and into a new `§0 — Blocked on the Cloudflare
account`,** which now sits above §A (CSV-blocked) and §B (client-blocked) in the
after-the-STOP area. The three sections are ordered by what unblocks them: **§0 needs a
credit card, §A needs a file, §B needs the client's word.**

W5 was the only workstream left above the STOP. Also changed, so the document stops
reading as an unstarted to-do list:

- A completion banner at the top, and a **✅ DONE** stamp with its commit hash on each of
  W0, W1, W2, W3, W4, W6, W7 and W8
- The standing bar updated to the real post-W8 baselines (27 pages, lint, the three
  access-matrix tallies, grants, bulk-sample)
- The GROUND TRUTH table stamped as a **pre-execution snapshot** — every ❌ in it except
  email and Razorpay has since been fixed, and it was the most misleading thing left in
  the file
- CLIENT STATUS rewritten against reality, pointing at `client_requirement.md`
- The execution-order diagram redrawn with W5 below the STOP
- **W5.2's `0016_listing_images.sql` flagged as a stale migration number** — `0016`,
  `0017` and `0018` are taken. **The next free number is `0019`.** Whoever picks up W5
  would otherwise collide on the first file they create.

### 42.4 The bundle — measured

**§41.** 2599.55 KiB gzip, ~85% of the free cap, **down** from 2809.30. The local build
was made to work rather than waiting on a CI log; the blocker was gotcha #11, now
diagnosed and written up with a reproducible procedure.

### 42.5 `MEMORY.md` — compacted

**6,031 lines → this file.** §1–§38 moved verbatim to **`MEMORY_ARCHIVE.md`** under their
original numbers; §39, §40 and the gotchas kept in place, still under their own numbers,
so that every cross-reference in the code and in the other documents still resolves.

**The principle: nothing was deleted, and the numbering was not disturbed.** New
front-matter sections are lettered **§A–§H** precisely so they could not collide with any
existing reference. What was pulled forward out of the archive rather than left to rot:
the live gotchas (§E), the architectural decisions from §25 (§D), the §37.10 correction,
and the defect list from §40.4 (§G).

**One correction made while compacting:** §40.1 opens *"Nine commits"* above a table
listing **eleven** commit hashes — W2 and W4 each landed across several commits. Eleven
is the commit count; nine was the count of workstream rows. Fixed in place.

### 42.6 Verified before handing over

```
npx tsc --noEmit     exit 0
pnpm run build       green, 27/27 static pages
pnpm run lint        0 errors, 287 warnings
```

Run **after** the node_modules symlinks were restored (§41.3 step 4), specifically to
prove the bundle measurement left nothing broken behind it.

**Not run this session:** `leak-test`, `access-matrix-test`, `grants-test` and
`bulk-sample-selfcheck`. **No application code was changed** — this session touched
documentation only — so those four baselines stand as recorded in §40.3. Anyone who does
change code runs the full bar.

### 42.7 Still yours

Unchanged from §40.5 except where noted:

1. **The sample CSV**, and **thirty minutes with the card and the domain login.** These
   two unblock more than everything else combined.
2. **`annual_price`** — ₹2,999 live vs ₹999 in the spec.
3. **Tier thresholds**, when decided.
4. **Legal copy, contact numbers, brand assets** — expected w/c 8 September.
5. **The browser check** — approve a partner, use their link in a private window, sign
   up, grant that account a membership, watch the commission appear.
6. ~~Read the bundle size off the Workers Builds log~~ — **done, §41.** Worth one
   glance at the next CI log to confirm the Linux build agrees.
