# IMMEDIATE_PLAN.md — Boliwala.com Pre-Launch Execution Plan

**Created:** 31 August 2026
**Revised:** 31 August 2026 (evening) — rebuilt as an executable queue with a hard STOP
**Executed:** 1 September 2026 — **W0–W8 complete except W5.** See `MEMORY.md` §40 (return summary) and §39 (per-workstream log).
**Companion:** `client_requirement.md` (**what the client owes — the whole critical path now**) · `deferred_plan.md` (post-launch) · `REALITY_CHECK.md` (why this order) · `MEMORY.md` §38 (the operating brief)

> [!IMPORTANT]
> ## ✅ THIS QUEUE HAS BEEN EXECUTED AND THE STOP WAS REACHED.
>
> **W0, W1, W2, W3, W4, W6, W7 and W8 are done, committed and deployed.**
> **W5 was blocked on R2 and has been moved below the STOP, into §0.**
>
> Everything that remains in this document is **below the STOP and blocked on the
> client**. There is no unblocked engineering work left in this file. Do not start
> anything below the STOP without checking `client_requirement.md` first — the
> blocker is a credential, a file or a decision, and it has not silently resolved
> itself.

---

## HOW TO USE THIS DOCUMENT

You are executing this queue **top to bottom**. Every workstream above the
`=== STOP: CSV REQUIRED ===` marker is unblocked **today** and needs nothing
from the client.

**Rules:**

1. **Work one workstream at a time, in order.** W0 → W1 → W2 → W3 → W4 → W6 → W7 → W8.
   *(W5 was in this chain; it is blocked on R2 and now lives below the STOP as §0.)*
   W0 first — it is one hour. Genuine parallelism is noted at the end.
2. **Run the standing verification bar at the end of every workstream** (below).
   A workstream is not done until its own "Done when" gate *and* the bar pass.
3. **One commit per workstream**, or per numbered sub-stage where noted.
   Commit message format: `W<n>: <what changed and why>`.
4. **Obey the UPDATE RULE** (`MEMORY.md` header): every commit also updates
   `MEMORY.md`, `SPRINT_CALENDAR.md`, and `project_calendar.html`. Non-negotiable.
5. **When you reach `=== STOP: CSV REQUIRED ===`, HALT.** Do not proceed past it.
   Do not start the sections below it. Write a return summary into `MEMORY.md`
   and tell the user the queue is complete and the CSV is now the only thing
   standing between here and launch.
6. **If a workstream turns out to be blocked mid-flight,** finish everything else
   in it, record precisely what is blocked and why in `MEMORY.md`, and move to the
   next workstream. Do not skip ahead silently.

---

## STANDING VERIFICATION BAR

Run all of these at the end of every workstream. These are the current baselines —
**they must not regress.**

**Updated 1 September 2026** — these are the baselines as they stand after W8.

```bash
npx tsc --noEmit
# expect: clean, exit 0

pnpm run build
# expect: green, 27/27 static pages          (was 25/25; W7 added /privacy and /terms)

pnpm run lint
# expect: 0 errors, 287 warnings             (NEW in W8 — this never ran before)

node scripts/leak-test.mjs http://localhost:3000
# expect: 12/12 PASS   (needs a local `next start` production server)

node --experimental-strip-types --import ./scripts/ts-resolve-hook.mjs scripts/access-matrix-test.mjs
# expect: 49/49 gating  +  23/23 login doors  +  15/15 partner isolation   (NEW third tally)

node scripts/grants-test.mjs
# expect: 27/27 PASS                         (NEW in W3)

node scripts/bulk-sample-selfcheck.mjs
# expect: PASS + 4 header spellings
```

> [!IMPORTANT]
> **Keep the three access-matrix tallies separate.** 49, 23 and 15 are independent
> baselines. Folding them into one number makes every future comparison meaningless.

---

## GROUND TRUTH (verified against the code, 31 Aug 2026)

> [!WARNING]
> **This table is the *pre-execution* snapshot and is kept only as a record of what
> the queue was aimed at.** Every ❌ in it was fixed on 1 September 2026 — the fonts,
> the fabricated admin tables, the hardcoded partner dashboard, the missing legal
> routes, `banks` → `lenders`. **For current state read `MEMORY.md` §40, not this.**
> The two rows still true: email and Razorpay remain unbuilt, both by decision.

| Claim | Verified state |
|---|---|
| Admin **KPI figures** | ✅ **Real.** All StatCards, all 5 sidebar badges and the Recent Activity feed query the DB (`lib/data/admin.ts` — `getDashboardKpis`, `getAdminSectionStats`, `getRecentActivity`). Landed in `0ef6598`…`2e991c0`. |
| Admin **table bodies** | ❌ **Still fabricated.** Six tables. See W1. |
| Partner **dashboard** | ❌ **Fully hardcoded**, 583 lines. Commission rates hardcoded at 10% / 15%. |
| Partner **application submit** | ✅ **Real.** `app/actions/partner.ts:22` inserts into `channel_partner_applications`. Only the dashboard is fake. |
| Satoshi font | ❌ The three `.woff2` files in `app/fonts/` are **597-byte ASCII CSS text**, not fonts. `app/globals.css:79` sets `--font-sans: "Satoshi", …`. Silently falls back to system-ui. |
| Contact env vars | ❌ `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER` — **both empty**. |
| Email | ❌ `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — **empty**. Zero email code in the repo. |
| Razorpay | ❌ All three keys empty. Zero payment code. Deferred — `deferred_plan.md` D4. |
| `/privacy`, `/terms` | ❌ **Routes do not exist.** Footer links point at `href="#"`. |
| `banks` → `lenders` | ⬜ Not started. **240 occurrences of `bank` across ~30 files** in `app/`, `lib/`, `components/`. |
| Migrations | Latest is `supabase/migrations/0013_superadmin_allowlist.sql`. New files continue from `0014`. |
| `profiles.role` | Is a Postgres **enum** (`public."Role"`), four values, DB-enforced. No CHECK constraint needed — see `MEMORY.md` §37.10. |

---

## CLIENT STATUS (updated 1 September 2026)

**The full list, with what each item costs the client and why it matters, is
`client_requirement.md`. This table is the index.**

| Item | Status | Gates |
|---|---|---|
| **Inventory data (Excel/CSV)** | 🔴 **Still outstanding — the #1 blocker** | §A W-INGEST. One sample file, not the dataset |
| **R2 / a card on the Cloudflare account** | 🔴 **Outstanding** | **§0 W5** — images and PDFs |
| **Workers paid upgrade ($5/mo)** | 🔴 **Outstanding** | Deploy headroom above the 3 MB free cap |
| **Domain `boliwala.com`** | 🟡 Purchased, not connected | §B W-DNS |
| **Legal copy** | 🟡 Expected w/c 8 Sep | §B W-LEGAL-COPY — routes are live and empty |
| **Real contact details** | 🟡 Env vars still empty in production | Footer, contact page — a config change, not a build |
| **Brand assets / logo** | 🟡 Expected w/c 8 Sep | §B W-BRAND |
| **Commission rates** | ✅ **ANSWERED — 10% / 15%** | W6, live |
| **Partner tier thresholds** | 🟡 Undecided; stored `null`, assigned by hand | Not blocking |
| **Annual membership price** | ⚠️ **Live settings say ₹2,999; the spec says ₹999** | Pricing page **and** partner commissions |
| **SEO landing pages** | 🟡 Client wants just-before-launch | §B W-SEO — **not CSV-blocked, can be pulled forward today** |
| **Font** | ✅ Plus Jakarta Sans | W0, done |

> [!IMPORTANT]
> **The two asks that unblock the most, as of 1 September 2026:**
>
> 1. **One sample CSV/Excel file** from the inventory set. Not the whole dataset —
>    one file. W-INGEST's deduplication key cannot be designed without seeing the
>    real column names. Still the highest-leverage unblock available.
> 2. **Thirty minutes with the company card and the domain registrar login** —
>    it enables R2 (§0 W5), buys the Workers headroom, and connects the domain
>    (§B W-DNS) in one sitting.
>
> *Commission rates are answered — 10% and 15%, live in the product.*

---

# ═══ WORKSTREAMS — ALL COMPLETE (1 September 2026) ═══

*Kept as the record of what each workstream was asked to do, and what it committed.
W5 was the ninth and is no longer here — it is below the STOP, as §0.*

## W0 — Font switch to Plus Jakarta Sans

> ✅ **DONE — 1 September 2026.** Commit `a124b61`.

**Status:** Unblocked · **Blocked by:** Nothing · **Effort:** ~1 hour · **Do first.**

`components/partner-dashboard-view.tsx` already uses `font-['Plus_Jakarta_Sans']`
inline in places — that inconsistency disappears with this change.

- [ ] Import `Plus_Jakarta_Sans` from `next/font/google` in `app/layout.tsx`
      (`Geist_Mono` is already imported there at line 3 — follow that exact pattern)
- [ ] Expose it as a CSS variable and point `--font-sans` at it in
      `app/globals.css:79`, replacing `"Satoshi", "Satoshi Fallback"`
- [ ] Delete `app/fonts/Satoshi-Bold.woff2`, `Satoshi-Medium.woff2`,
      `Satoshi-Regular.woff2` — they are CSS text, not fonts
- [ ] Remove the Satoshi `@font-face` blocks from `app/globals.css`
- [ ] Replace the inline `font-['Plus_Jakarta_Sans']` usages in
      `components/partner-dashboard-view.tsx` with the standard `font-sans`

**Done when:** `grep -ri satoshi app lib components public styles` returns **0 hits**.
The font loads from Google (visible in the network tab), not the system-ui fallback.
Standing bar passes.

**Commit as:** `W0: Plus Jakarta Sans replaces the Satoshi files that were never fonts`

---

## W1 — Purge the six fabricated admin tables (Item C6)

> ✅ **DONE — 1 September 2026.** Commit `cda2de8` — **nine** table bodies, not the six this heading assumes.

**Status:** Unblocked · **Blocked by:** Nothing · **Effort:** ~1 day

> [!CAUTION]
> **This is the top demo risk in the project.** Every *figure* on the admin panel
> is now real and honest. That makes the invented *people* sitting beside them more
> convincing, not less. A client who spots "Rajesh Kumar · RZP-98765" stops trusting
> the real numbers too.

Six table bodies in `components/admin-view.tsx` are hardcoded:

| Section | `activePage` | Fabricated rows at |
|---|---|---|
| Package Purchases | `packages` | `admin-view.tsx:518` |
| Payments | `payments` | `admin-view.tsx:543`, `:547` |
| All Users | `users` | `admin-view.tsx:571` |
| Service Pipeline | `requests` | `admin-view.tsx:603` |
| Success Fees | `success-fees` | `admin-view.tsx:626` |
| Channel Partners | `partners` | `admin-view.tsx:645` |

### W1.1 — The two tables that have real data behind them
- [ ] **All Users** — add `getAdminUsers()` to `lib/data/admin.ts` returning real
      `profiles` rows (name, email, phone, createdAt, role, shortlist count).
      Wire the `users` table body. Five real rows will show. That is correct.
- [ ] **Channel Partners** — add `getPartnerApplications()` reading
      `channel_partner_applications`. Wire the `partners` table body.
- [ ] **Also fix the hardcoded `31 active · 6 pending` string** in that section's
      `TcHead` title — it is a fabricated count sitting in a header, not in a cell,
      which is exactly why the earlier purge missed it.

### W1.2 — The four tables with genuinely zero rows
`service_packages`, `payments` and `subscriptions` are all **0 rows**, and no
success-fee table exists at all.

- [ ] **Packages**, **Payments**, **Service Pipeline**, **Success Fees** — replace
      each fabricated `<tbody>` with an honest empty state, matching the existing
      admin empty-state pattern already used elsewhere in the file.
- [ ] Empty-state copy must say *why* it is empty, not just "No data" — e.g.
      "No package purchases yet — packages are sold through Sales Enquiries."
- [ ] **Success Fees:** nothing backs this section at all. The empty state must say
      so. **Do not invent a success-fee schema here.**

### W1.3 — Sweep
- [ ] `grep -rn "Rajesh Kumar\|Vikram Patel\|Amit Sharma\|Suresh Nair\|Priya Mehta\|RZP-" components/ app/`
      must return **only** `components/partner-view.tsx:299` — a form `placeholder`
      attribute. That one is legitimate and stays.

**Done when:** The sweep grep is clean. Opening `/admin` as superadmin and clicking
through all six sections shows either real rows or an honest empty state, and **no
invented person appears anywhere.** Standing bar passes.

**Commit as:** `W1: the six fabricated admin tables now query the DB or say they are empty`

---

## W2 — "Contact Sales" enquiry flow

> ✅ **DONE — 1 September 2026.** Commit `7cb1d3c`, `56daff8`, `0ecc190`.

**Status:** Unblocked · **Blocked by:** Nothing · **Effort:** ~2 days
**Unblocks:** W6 — this is the only revenue event a commission can attach to pre-Razorpay

> [!IMPORTANT]
> **Decide this before writing code — notification.** `RESEND_API_KEY` is empty and
> there is zero email code in the repo. An enquiry that only lands in a DB table
> nobody watches is a lost sale.
>
> **Default: build admin-panel-only, and say so explicitly** in the success copy and
> in `MEMORY.md`. Do not half-build an email path. If the client wants email on
> submit, that is a scoped addition to request, not an assumption to make.

### W2.1 — Schema
- [ ] `supabase/migrations/0014_contact_sales_enquiries.sql`
- [ ] Table `contact_sales_enquiries`: `id`, `name`, `email`, `phone`,
      `plan` (enum `annual_subscription | service_package`), `message`,
      `status` (enum `new | contacted | converted | closed`), `notes`,
      `handledBy` (FK profiles, nullable), `createdAt`, `updatedAt`
- [ ] RLS: INSERT by `anon` + `authenticated`; SELECT/UPDATE by admin/superadmin only
- [ ] Follow the RLS pattern already established in
      `0007_lock_down_images_admin_tables_rls.sql`

### W2.2 — Server action
- [ ] `app/actions/contact-sales.ts` — mirror the shape of `app/actions/callback.ts:15`
      (`submitCallbackRequest`) exactly. It already does validated insert plus an
      `{ ok }` return. Match it; do not invent a new pattern.

### W2.3 — Pricing and Services CTAs
- [ ] `app/pricing/page.tsx` — plan CTAs become **"Contact Sales"**, linking to
      `/contact?plan=annual`
- [ ] `app/pricing/page.tsx:158` and `components/services-view.tsx:215` —
      "Hire Boliwala" links to `/contact?plan=service`
- [ ] Rewrite any pricing copy that implies instant self-serve purchase

### W2.4 — The form
- [ ] Extend `app/contact/page.tsx` with a Sales Enquiry mode, `plan` pre-filled
      from the URL parameter
- [ ] Success toast: "Our team will reach out within 24 hours"

### W2.5 — Admin: Sales Enquiries section
- [ ] New sidebar item under **Leads & Sales** — the group holding `callbacks`,
      `packages`, `requests` at `components/admin-view.tsx:157-159`
- [ ] Table: name, plan, phone, date, status. Status workflow
      New → Contacted → Converted → Closed, plus a per-enquiry notes field
- [ ] **"Grant Subscription" / "Grant Credits" action** — writes a real
      `subscriptions` row or credit-ledger entry. **This is the manual entitlement
      path, and the revenue event W6 depends on.** Record `handledBy`.
- [ ] Add an enquiry count to the sidebar badge, same pattern as
      `kpis.callbackRequestsUnread`

### W2.6 — Close the loop on W1
- [ ] The **Packages** and **Service Pipeline** empty states from W1.2 now have a
      real source — enquiries converted to `service_package`. Wire them.

**Done when:** A signed-out guest submits a plan enquiry from `/pricing` and from
`/services`; it appears in admin with status `new`; an admin grants a subscription
and the user's entitlement actually changes — verify by signing in as that user and
confirming unlock behaviour. Standing bar passes, **including the 49/49 gating
matrix**, because granting entitlement touches access.

**Commit as:** `W2.1`…`W2.6`, one commit per sub-stage.

---

## W3 — Security housekeeping

> ✅ **DONE — 1 September 2026.** Commit `ac54d09`.

**Status:** Unblocked · **Owner:** shared — the password rotation is a dashboard action
**Effort:** ~half a day · **Can run in parallel with W0 and W1.**

- [ ] **Rotate the Supabase DB password.** The current one was pasted into a chat
      transcript. Do this first, in the Supabase dashboard.
- [ ] Update `DATABASE_URL` and `DIRECT_URL` in `.env.local`, `.dev.vars`, and the
      Cloudflare Worker secrets
- [ ] Verify the app still builds and connects after rotation, **before** moving on

### Revoking the blanket grants — read this before writing any SQL

> [!WARNING]
> The migration originally drafted for this workstream was:
> ```sql
> REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
> GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
> ```
> **Do not run it.** The second line hands `anon` write access to *every* table and
> leans entirely on RLS to save you. It also has no `ALTER DEFAULT PRIVILEGES`, so
> every table W2, W5 and W6 create lands straight back at the permissive default.

- [ ] Enumerate the current grants first and save the output into `MEMORY.md` as
      the before-state:
      ```sql
      SELECT table_name, grantee, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public' AND grantee IN ('anon','authenticated')
      ORDER BY 1, 2;
      ```
- [ ] Revoke `TRUNCATE`, `REFERENCES` and `TRIGGER` from `anon` and `authenticated`
      across the schema. These are the actually-dangerous ones and nothing uses them.
- [ ] Grant SELECT / INSERT / UPDATE / DELETE **per table**, matching what each
      table's RLS policies actually expect. Read-only tables get SELECT only.
- [ ] Add `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, REFERENCES,
      TRIGGER ON TABLES FROM anon, authenticated;` so new tables inherit the safer default
- [ ] Drop the stray `_prisma_migrations` table if it is still present
- [ ] Re-run the enumeration query and diff it against the before-state

**Done when:** Password rotated and the app connects on the live Worker. No
`TRUNCATE` grant to `anon` or `authenticated` on any table. Default privileges set.
**Standing bar passes — the 49/49 gating matrix is the real proof here.**

**Commit as:** `W3: revoke the dangerous blanket grants, per-table and by default`
(the password rotation is not a commit — record it in `MEMORY.md`)

---

## W4 — Lender model (banks → lenders)

> ✅ **DONE — 1 September 2026.** Commit `5644827`, `c0b8433`.

**Status:** Unblocked · **Blocked by:** Nothing · **Effort:** ~2 days
**Must complete BEFORE:** W-INGEST, below the STOP

> [!IMPORTANT]
> **Do this now, at 12 rows.** The same migration against 50,000 rows with images
> and documents attached is a different and much worse job. This is the single best
> reason not to idle while waiting for the CSV.
>
> **Blast radius: 240 occurrences of `bank` across ~30 files** in `app/`, `lib/` and
> `components/`. Work file by file, lean on `tsc --noEmit` after each, commit in stages.

### W4.1 — Schema
- [ ] `supabase/migrations/0015_lenders.sql`
- [ ] Rename table `banks` → `lenders`; rename FK columns (`bankId` → `lenderId`) throughout
- [ ] Add enum `lender_type`: `bank | nbfc | arc | hfc`
- [ ] Backfill all 6 existing rows to `lender_type = 'bank'`
- [ ] If anything still depends on the old name mid-migration, create a temporary
      view `banks` and drop it in the same migration once the code lands

### W4.2 — Data layer
- [ ] `lib/data/types.ts`, `lib/data/listings.ts`, `lib/data/admin.ts`
      (note `getBanksForAdmin()` at `admin.ts:397` → `getLendersForAdmin()`),
      `lib/data/alerts.ts`, `lib/data/stats.ts`, `lib/stats.ts`, `lib/alerts.ts`,
      `lib/access/types.ts`, `lib/access/redact.ts`

### W4.3 — UI and admin
- [ ] `components/admin/listing-form-panel.tsx`, `components/admin/listings-panel.tsx`,
      `components/admin-view.tsx`, `components/auctions-by-city.tsx`,
      `app/search/page.tsx`, `app/listing/[slug]/page.tsx`
- [ ] Filter labels: "Bank" → "Lender" where the field now spans NBFC / ARC / HFC
- [ ] Add a `lender_type` facet to the search filters

### W4.4 — Bulk upload
- [ ] `components/admin/bulk-upload-panel.tsx` — `TARGET_FIELDS` "Bank" → "Lender",
      add an optional "Lender Type" column
- [ ] Regenerate the sample CSV; re-run `node scripts/bulk-sample-selfcheck.mjs`

### W4.5 — Copy sweep
- [ ] `app/about`, `app/faq`, `app/contact`, `app/pricing`, `app/services`,
      `app/partner`, `app/page.tsx`, `app/manifest.ts`, `app/opengraph-image.tsx`,
      `components/about-view.tsx` — marketing copy such as "18+ banks" becomes
      "18+ lenders" **only where it is now inaccurate**. Do not rewrite copy that is
      still correct.

**Done when:** `grep -rn '\bbanks\b\|bankId\|getBanksForAdmin' lib/ components/ app/`
returns **zero** schema or identifier hits — display prose about actual banks is fine.
Search filters by lender type. The bulk sample self-check passes. Standing bar passes.

**Commit as:** `W4.1`…`W4.5`, one per sub-stage. **Do not squash** — this one needs a
bisectable history.

---

## W6 — Channel Partner portal (must be live at launch)

> ✅ **DONE — 1 September 2026.** Commit `0c71ed4`.

**Status:** Unblocked once W2 lands · **Depends on:** **W2** · **Effort:** ~4 days

> [!IMPORTANT]
> **Why W2 must come first, and why this is not negotiable sequencing:** a commission
> has to attach to a revenue event. There is no Razorpay and there will be none before
> launch. The **only** revenue events that will exist at launch are the manual
> "Grant Subscription" / "Grant Credits" actions built in **W2.5**. Building the
> commission engine before that gives it nothing to hook into.

**What is already real:** `app/actions/partner.ts:22` genuinely inserts into
`channel_partner_applications`. The application flow works. **Only the dashboard is
fake** — `components/partner-dashboard-view.tsx`, 583 lines, with commission rates
hardcoded at 10% and 15% (lines 218 and 228).

### W6.1 — Schema
- [ ] `supabase/migrations/0017_partner_commissions.sql`
- [ ] `partner_referrals`: `id`, `partnerId`, `refCode`, `referredProfileId`,
      `landedAt`, `convertedAt`, `conversionType`
- [ ] `partner_commissions`: `id`, `partnerId`, `referralId`, `sourceType`
      (`annual_subscription | service_package | success_fee`), `sourceId`,
      `grossAmount`, `ratePct`, `commissionAmount`,
      `status` (`accrued | approved | paid`), `createdAt`
- [ ] `partner_payouts`: `id`, `partnerId`, `periodStart`, `periodEnd`, `totalAmount`,
      `status` (`pending | paid`), `paidAt`, `reference`
- [ ] RLS on all three: a partner reads **only their own rows**; admin reads all.
      **This is a new leak surface — treat it with the same seriousness as listing gating.**

### W6.2 — Configurable rates
- [ ] Commission rates live in the **admin settings table**, alongside the existing
      pricing settings — see `app/actions/admin-settings.ts` and
      `updatePricingSettings` at `lib/data/admin.ts:456`. Follow that pattern.
- [ ] Seed with the current hardcoded values (10% subscriptions, 15% packages),
      **explicitly labelled PLACEHOLDER in the admin UI**
- [ ] Tier thresholds (Associate / Silver / Gold) configurable the same way
- [ ] **Do not hardcode a single percentage anywhere.**

### W6.3 — Referral tracking
- [ ] A unique `refCode` per partner; referral URL `boliwala.com/?ref=<code>`
- [ ] Middleware or root-layout capture → cookie → attributed at signup
- [ ] Attribution window: 30 days — put it in settings, not in the code

### W6.4 — Accrual
- [ ] When W2.5's admin grants a subscription or package to a referred user, write a
      `partner_commissions` row at the configured rate
- [ ] Success-fee commissions can only accrue when a success fee exists, and there is
      no such table yet. Leave the `sourceType` value in the enum and the code path
      unbuilt. **Do not invent a success-fee schema here.**

### W6.5 — The dashboard, wired
- [ ] Replace all 583 lines of hardcoded figures in
      `components/partner-dashboard-view.tsx` with real queries
- [ ] The Earnings & Payouts view reads `partner_commissions` and `partner_payouts`
- [ ] Honest zeros throughout — a new partner sees ₹0 and 0 referrals, and that is correct
- [ ] Build the **Invitation Status** section — the one genuine UI gap, `MEMORY.md` §31.1

### W6.6 — Admin side
- [ ] Approve / reject `channel_partner_applications` from the `partners` section
      wired in W1.1. Approval flips the profile role to `channel_partner`.
- [ ] Per-partner stats; commission approval (`accrued` → `approved`); mark a payout paid

### W6.7 — Access proof
- [ ] **Extend `scripts/access-matrix-test.mjs`** with partner-data isolation cases:
      partner A must not read partner B's referrals, commissions or payouts.
- [ ] Keep the existing 49 gating assertions and 23 door assertions as their own
      tallies so the baselines stay comparable across sessions — **add a third tally**,
      do not fold the new cases into the existing counts.

**Done when:** A partner logs in at `/partner/login`, sees their real referral code and
honest zeros. An admin approves an application, grants a subscription to a referred user
via W2.5, and a commission row appears at the configured rate in that partner's
dashboard. The new isolation assertions pass. Standing bar passes.

**Commit as:** `W6.1`…`W6.7`.

---

## W7 — Legal, contact and brand scaffolding

> ✅ **DONE — 1 September 2026.** Commit `9374b23` — W7.3 brand assets skipped, still awaiting the client.

**Status:** Routes ship now; content lands when the client delivers · **Effort:** ~half a day

The point of doing this now is that **the routes and the wiring are the engineering
work, and neither depends on the copy.** When the client sends text, it becomes a
paste rather than a build.

### W7.1 — Legal routes
- [ ] Create `app/privacy/page.tsx` and `app/terms/page.tsx` — real routes, correct
      metadata, correct layout, with a visible "This policy is being finalised"
      placeholder body
- [ ] Update the footer links from `href="#"` to `/privacy` and `/terms`
- [ ] Add both to `app/sitemap.ts`

### W7.2 — Contact details
- [ ] Set `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER` and
      `NEXT_PUBLIC_CONTACT_EMAIL` in `.env.local`, `.dev.vars`, and the Cloudflare
      build vars
- [ ] Verify the footer, the contact page and the JSON-LD all read from the env vars,
      and **render nothing rather than a placeholder when a var is empty** — the US
      number `+1 (234) 567-890` must not survive anywhere
- [ ] `grep -rn "234) 567\|+1 (234)" app components` returns 0

### W7.3 — Brand assets (when they arrive, ~1 week)
- [ ] Swap the generated `app/icon.tsx`, `app/apple-icon.tsx` and
      `app/opengraph-image.tsx` for static assets
- [ ] Update `components/logo.tsx`
- [ ] **If the assets have not arrived, skip this and note it. Do not block.**

**Done when:** `/privacy` and `/terms` return 200 and appear in the sitemap. No US
placeholder phone number anywhere. Standing bar passes — the page count in
`pnpm run build` rises by 2, so note the new baseline.

**Commit as:** `W7: legal routes, real contact wiring, no placeholder contact details`

---

## W8 — Housekeeping and the known open defects

> ✅ **DONE — 1 September 2026.** Commit `df9fd84` — **all but the bundle re-measure**, which is now `MEMORY.md` §41.

**Status:** Unblocked · **Effort:** ~half a day · **Do last, immediately before the STOP.**

- [ ] **Install eslint** and make `pnpm run lint` actually run. Add it to
      `devDependencies` with a config matching the Next.js 16 / React 19 setup. Fix
      what it finds **only** where the fix is obvious and safe; record the rest in
      `MEMORY.md`. **Then add `pnpm run lint` to the standing verification bar.**
- [ ] **Header "Log In" link drops context** (`MEMORY.md` §36.5) — it should carry
      `?next=` the way the rest of the redirect-preserving auth does. Two lines, and
      it is the same conversion leak the overnight loop already closed elsewhere.
- [ ] **`bulkCommitListings` silently drops rejected rows** (`MEMORY.md` §36.5) — it
      must report what it rejected and why. **This matters far more once the CSV
      arrives**, which is exactly why it is fixed before the STOP and not after.
- [ ] **Re-measure the Worker bundle** (`MEMORY.md` §36.5) and record the number in
      `MEMORY.md`. W5's R2 work and W6's dashboard both moved it.
- [ ] **"Real-time matching is ON"** on the Alert Engine panel asserts a behaviour
      nobody has verified. Either prove something actually fires on listing change, or
      change the copy to describe the designed state honestly. There is no email
      system, so it almost certainly does not fire.

**Done when:** `pnpm run lint` runs and passes. The header link preserves `next`. Bulk
upload reports its rejections. The Alert Engine panel no longer claims a behaviour that
is not happening. Standing bar passes, now including lint.

**Commit as:** `W8: lint runs, the three §36.5 defects, and one dishonest status claim`

---

# ═══ STOP: CSV REQUIRED ═══

> [!CAUTION]
> ## 🛑 STOP HERE.
>
> **If you have completed W0 through W8, the queue is finished. HALT.**
>
> Everything below this line is blocked on the client. Do not start any of it.
>
> **Before you stop:**
>
> 1. Write a **return summary** into `MEMORY.md` as a new numbered section: what
>    landed, what did not and why, the final standing-bar numbers, and anything you
>    found and deliberately did not touch.
> 2. Sync `SPRINT_CALENDAR.md` and `project_calendar.html` — the UPDATE RULE.
> 3. Confirm the tree is clean, committed and pushed.
> 4. Tell the user plainly: **the pre-launch queue is complete, and the inventory CSV
>    is now the only thing between here and launch.** Re-state the two client asks —
>    the sample CSV file, and the commission rates.
>
> Do not start W-INGEST "to get ahead". A dedup key designed against imagined column
> names is worse than no dedup key, because it looks finished.

---

# ═══ AFTER THE STOP — DO NOT START ═══

> Ordered by what unblocks them: **§0 needs a credit card, §A needs a file, §B needs
> the client's word or their copy.** Each item names its blocker in
> `client_requirement.md`.

## §0 — Blocked on the Cloudflare account

### W5 — R2 storage and PDF documents

> [!CAUTION]
> **⛔ HARD BLOCKED — moved here from above the STOP on 1 September 2026.**
>
> `wrangler r2 bucket list` returns *"Please enable R2 through the Cloudflare
> Dashboard [code: 10042]"*. Enabling R2 needs a payment method on the Cloudflare
> account, which is a client conversation — `client_requirement.md` §1.2(a).
>
> **Nothing was half-built against it, and that was deliberate.** In particular
> **no `wrangler.toml` R2 bindings were added**: a binding naming a bucket that
> does not exist breaks the CI deploy, which turns a blocked workstream into a
> broken deployment.
>
> **Supabase Storage was offered as a no-card alternative and declined. R2 only.**

**Status:** ⛔ Blocked on the client · **Effort once unblocked:** ~2 days
**Unblocked by:** a card on the Cloudflare account. Nothing else.
**Then:** use the `*.r2.dev` public URL immediately and swap to `cdn.boliwala.com`
at DNS cutover. **Do not wait for the domain.**

> **Migration numbers have moved on.** W5.2 below says `0016_listing_images.sql`;
> `0016`, `0017` and `0018` are taken (grants, lenders, partner commissions).
> **The next free number is `0019`.**

#### W5.1 — Buckets and bindings
- [ ] Create R2 buckets `boliwala-images` and `boliwala-docs` (public)
- [ ] Add the bindings to `wrangler.toml` — it is currently 215 bytes and minimal, so extend carefully
- [ ] Record the `*.r2.dev` base URL in `MEMORY.md`, and put it behind a single
      `R2_PUBLIC_BASE` env var so the DNS cutover is a one-line change

#### W5.2 — Image pipeline
- [ ] `supabase/migrations/0016_listing_images.sql` — `listing_images`: `id`,
      `listingId`, `r2Key`, `width`, `height`, `sizeBytes`, `sortOrder`
- [ ] Renditions: thumb 200px / card 600px / full 1200px, WebP, content-hashed filenames
- [ ] **Renditions are generated in a Node job with `sharp`, never on the Worker.**
      Put the helper in `scripts/` so W-INGEST reuses it verbatim later.
- [ ] Admin single-image upload → store the original, generate renditions, write rows

#### W5.3 — PDF documents
- [ ] `listing_documents`: `id`, `listingId`, `r2Key`, `filename`, `label`,
      `visibility` (default `'public'`), `sizeBytes`, `createdAt`
- [ ] Admin: upload, label and delete a PDF against a listing
- [ ] Listing page: a "Documents" section with download links
- [ ] **PDFs are freely public** — client decision, confirmed. They are **not** behind
      the credit gate. Make sure the leak test still reflects that intent rather than
      silently passing for the wrong reason.

#### W5.4 — Migrate the existing 12
- [ ] Move the 12 current listing images to R2, write `listing_images` rows, update
      references, remove the old paths
- [ ] `0008_listing_images_storage_bucket.sql` created the old Supabase bucket —
      leave that migration alone, but note in `MEMORY.md` that the bucket is now unused

**Done when:** All 12 listings serve images from R2 with three renditions. A PDF
uploads from admin and downloads from the listing page. Standing bar passes —
**leak test 12/12 specifically, since listing rendering changed.**

**Commit as:** `W5.1`…`W5.4`.

---

## §A — Blocked on the inventory CSV

### W-INGEST — Bulk ingest pipeline (S4)
**Hard blocked on:** the client sharing the data files · **Depends on:** W4 ✅ and **W5 ⛔ (§0 — needs R2)**

A Node.js job — it needs `sharp`, so not Workers. Reads CSV/Excel, auto-detects columns
using the same approach as the admin bulk-upload panel, batched upserts of 100,
idempotent on re-run. Deduplication key: lender + address + auction date, **or a
provided unique ID — which cannot be decided until a real file is in hand.** Per-listing
image and PDF ingestion into R2, reusing W5.2's rendition helper. Daily refresh via
Cloudflare Cron, marking passed auctions `status = 'expired'` — that expired corpus
becomes the Auction History feature in `deferred_plan.md` D1. Per-row validation report
and an error log.

## §B — Held on other client deliverables (not CSV-blocked)

### W-SEO — SEO landing-page matrix (S5)
**Technically unblocked** once W4 lands — it needs the lender model, not the data.
**Held only because the client wants it just before launch.** `/auctions/{city}`,
`/auctions/{city}/{propertyType}`, `/lender/{lenderSlug}`, breadcrumbs, `ItemList`
JSON-LD, auto-generated sitemap entries, internal linking.

*If the client will agree to pull this forward, it is the best use of any waiting time
after W8 — indexing compounds from day one and there is nothing to lose by starting.*

### W-DNS — DNS cutover and production
**Blocked on:** `boliwala.com` being connected. Move DNS to Cloudflare, point the apex
at Workers, stand up `cdn.boliwala.com` for R2 — swapping W5.1's `R2_PUBLIC_BASE`, one
line — update `NEXT_PUBLIC_SITE_URL`, update the Supabase Redirect URLs and Google
OAuth, then remove `boliwala.boliwaladevs.workers.dev` from the Supabase redirect list.

### W-LEGAL-COPY — Paste the legal text
**Blocked on:** client copy. W7.1 already built the routes. This is a paste.

### W-BRAND — Static brand assets
**Blocked on:** client assets, ~1 week. W7.3 if it was skipped.

---

## EXECUTION ORDER

```
✅ W0  Font ──────────────┐
✅ W1  Admin tables ──────┤  parallel-safe
✅ W3  Security ──────────┘
                    │
✅ W2  Contact Sales ┼─────────────────────► ✅ W6  Channel Partner
                    │                           (needs W2's grant events)
✅ W4  Lender model ─┤
✅ W7  Legal/contact ┤
✅ W8  Housekeeping ─┘
                    │
                    ▼
         🛑 STOP: CSV REQUIRED   ← reached and respected, 1 Sep 2026
                    │
     ┌──────────────┼──────────────┬──────────────┐
     ▼              ▼              ▼              ▼
 §0 W5 R2      §A W-INGEST     §B W-SEO      §B W-DNS
 (needs a      (needs the      (needs only   (needs the
  card)         CSV — and       the client's  domain
                W4 ✅ + W5)     go-ahead)     connected)
```

**Genuine parallelism:** W0, W1 and W3 were independent of each other. W7 was
independent of everything. **W6 had to follow W2. W-INGEST must follow W4 ✅ and W5 ⛔.**

**The one dependency that still binds:** W-INGEST ingests images and PDFs into R2, so
it needs **W5**, which needs the card. The CSV and the card are therefore *both* on
W-INGEST's critical path — the CSV is simply the one that also blocks the design work,
which is why it is named first.

---

*Last updated: 1 September 2026 — the queue was executed, W5 was re-filed below the
STOP as §0, and the client-side asks moved into `client_requirement.md`. Vector/semantic
search was moved to `deferred_plan.md` D7 on 31 August — it is a Tier 4 differentiator
per `REALITY_CHECK.md` §7 and does not belong in a pre-launch queue.*
