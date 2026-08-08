# Boliwala.com — Phase 1 Implementation Plan

**Client:** Optimistic IP · **Build window:** 5 Jul – 20 Aug 2026 (6 weeks)
**Stack:** Next.js 14 (App Router, TS) · Tailwind · Supabase · Prisma · Vercel · Razorpay · Resend
**Status:** DRAFT — awaiting approval. No application code written.

---

## 0. Reference material audit — READ THIS FIRST

Section 2 of the build prompt lists six reference files. **Six of six are missing from disk.**

| # | Expected path | Status |
|---|---|---|
| 1 | `demo/boliwala-emergent-prompt.md` | **MISSING** |
| 2 | `demo/boliwala-frontend-complete.html` | **MISSING** |
| 3 | `demo/boliwala-admin-v3.html` | **MISSING** |
| 4 | `demo/boliwala-monetization-spec-visual.html` | **MISSING** |
| 5 | `demo/boliwala-listing-final2.html` | **MISSING** |
| 6 | `docs/Boliwala-Features-v1.docx` | **MISSING** (no `docs/` folder exists) |

What `demo/` actually contains is a **different artefact**: a compiled Next.js static export of seven public pages.

`index.html` · `search.html` · `login.html` · `signup.html` · `services.html` · `partner.html` · `about.html`
plus `_next/static/**` (compiled JS/CSS chunks, Satoshi + Geist Mono + Plus Jakarta Sans webfonts) and three images.

### What this changes

**Recovered despite the gap.** `services.html` turns out to contain the full pricing/credit model as a rendered comparison table — it is effectively the monetization spec (#4) in prototype form. The single most business-critical piece of the app is therefore **well grounded**, not guesswork. Details in §2.

**Not recoverable — plan below is structurally sound but visually ungrounded here:**

- **Individual Listing Page** (#5). I have the *gating rules* but not the page layout, similar-properties block, or callback CTA design. Sprint 1's largest deliverable is designed from first principles.
- **Admin panel, all modules** (#3). Nothing recoverable. **Sprints 3–4 are planned from the scope list in §5 of the build prompt only.** Expect the widest estimate variance here.
- **User Profile page** — the 4 tabs (Shortlisted / My Alerts / My Services / My Details). `boliwala-frontend-complete.html` was said to include it; no profile page exists in `demo/`.
- **Feature List / URD** (#6), described as "the source of truth for scope". Its absence is the biggest single risk to scope confidence in this plan. Everything in §5–6 of the build prompt is honoured, but I cannot confirm the prompt's scope summary is complete against the URD.

**Action required from you:** supply the five missing files (or confirm they were superseded by what's in `demo/`). If the admin prototype and URD arrive before Sprint 3, no schedule impact. If they arrive later, Sprint 3–4 will need re-planning mid-flight.

---

## 1. What the existing prototype establishes

Extracted from the seven live pages — treat as confirmed design intent.

**Brand & nav.** Logo "Boli wala", tagline "We Know Auctions!". Primary nav: Home · Properties · Services · Channel Partner · About · **Free Consultation** (CTA). Footer: Platform (Search Auctions / Pricing / Services / Channel Partner) · Connect (hello@boliwala.com, phone, Instagram, LinkedIn) · © 2026 · Privacy · Terms.

**Design tokens** (from compiled CSS):
- Fonts: **Satoshi** (primary UI), **Geist Mono**, **Plus Jakarta Sans**
- Neutrals: `#fafafa` `#f7f5f1` (cream) `#262626` `#171717` `#0a0a0a`
- Dark surfaces: `#0a0f1c` (navy) `#14110d` (warm black)
- Accent amber/orange: `#ffc981` `#fb923c` `#f99c00` `#fe6e00`
- Semantic: red `#e40014`, green `#20bd5a` / `#00bb7f`, blue `#1447e6`
- **The prototype is Tailwind v4** (uses `--color-*` theme vars, oklch-era palette). See risk R3.

**Search filter set** (identical on Home hero and Search): Location keyword · Price range · Bank name · Property type (Residential / Commercial / Industrial / Agricultural / Mixed Use) · Possession type (Physical / Symbolic).

**Homepage sections:** hero + inline search · trust strip (Verified / Daily Updated / Free to Browse / Due Diligence) · 5-step process (Browse & Shortlist → Due Diligence → We Bid For You → Possession Support → Loan Arranged) · Auctions by City (8 states shown, "View All States") · Alerts capture (Email + WhatsApp number) · final CTA.

**Auth pages:** email + password, "Or continue with Google", and separate **"Login as Channel Partner"** / **"Login as Admin"** entry points. See conflict C1.

**Note:** `search.html` renders its result grid client-side — the static export contains only the filter shell, no card markup. Listing-card design must be derived from the homepage/services visual language.

---

## 2. The monetization model — RECOVERED, and it is the spine of the build

From the `services.html` comparison table. This is authoritative and directly drives the gating layer.

### Always public — never paywalled, no login required

Full property address · Reserve price · EMD amount · Auction dates · Bank notice download · Unlimited listing search across 140+ cities

### Gated fields and their credit cost

| Field group | Cost |
|---|---|
| Flat number & floor | 1 credit |
| Inspection date & time | 1 credit |
| Authorised officer & bank contact | 1 credit |

### Tiers

| | Free | Annual Member | Full Service |
|---|---|---|---|
| Price | ₹0 forever | **₹999 / year** | **₹9,999 + 1% success fee** |
| Credits | 5 on signup | Unlimited unlocking | Unlimited unlocking |
| Alerts | Email | Email + WhatsApp | Priority |
| Shortlists | Yes | Unlimited | Unlimited |
| Expert service | — | — | Title search, bid management, possession support, loan assistance, dedicated RM |
| Success fee | — | — | 1% of winning bid, **only if you win** |

**Confirmed from FAQ:** the ₹9,999 package covers **one specific property**, not an account-wide entitlement. A second property requires a second package. This materially affects the `service_packages` schema — it is per-listing, not per-user.

### The four access states

```
guest              → sees public fields; gated fields show paywall teaser + "Create free account"
member_no_credits  → sees public + previously-unlocked; gated show "Out of credits → Upgrade ₹999"
member_with_credits→ sees public + unlocked; gated show "Unlock for 1 credit"
subscriber         → sees everything, no unlock step
```

Per requirement #1 this is **one module**, not per-field logic:

```ts
// lib/access/resolveListingAccess.ts
resolveListingAccess(user, listing) → {
  state: AccessState
  unlockedGroups: FieldGroup[]
  creditBalance: number
  costFor(group): number      // reads live from settings
  canUnlock(group): boolean
}
```

Everything — listing page, search cards, profile, admin preview — consumes this one function.

---

## 3. Proposed Supabase schema v1

### Core

**`profiles`** (1:1 with `auth.users`) — id, full_name, email, phone, role (`user|admin|channel_partner`), credits_balance, created_at, updated_at

**`banks`** — id, name, short_name, logo_url, is_active
**`listings`** — id, slug (unique, SEO), title, property_type, possession_type, bank_id → banks, status (`draft|live|closed|cancelled`), view_count, created_by, timestamps
- *Public columns:* address_line, locality, city, state, pincode, reserve_price, emd_amount, auction_date, emd_deadline, notice_url
- *Gated columns:* flat_number, floor, inspection_datetime, inspection_notes, authorised_officer_name, authorised_officer_phone, authorised_officer_email, bank_contact

**`listing_images`** — id, listing_id, url, sort_order, is_primary

### Monetization

**`unlocks`** — id, user_id, listing_id, field_group (`flat_floor|inspection|officer_contact`), credits_spent, created_at · **UNIQUE(user_id, listing_id, field_group)** so nobody pays twice
**`credit_transactions`** — append-only ledger: id, user_id, delta, reason (`signup_grant|unlock|admin_adjust|refund`), ref_id, balance_after, created_at
**`subscriptions`** — id, user_id, plan, status (`active|expired|cancelled`), started_at, expires_at, razorpay ids, amount_paid
**`service_packages`** — id, user_id, **listing_id** (per-property, see §2), status (`pending|active|completed|cancelled`), amount_paid, success_fee_pct, razorpay_payment_id
**`payments`** — unified Razorpay ledger: id, user_id, type, razorpay_order_id/payment_id/signature, amount, status, raw_payload jsonb

> `credits_balance` on `profiles` is a denormalised cache. The ledger is the source of truth; balance is recomputed via trigger. Never mutate the balance directly.

### Engagement & intake

**`shortlists`** — user_id, listing_id, UNIQUE pair
**`callback_requests`** — **no login required**: listing_id (nullable), name, phone, email, message, source (`listing|contact|services|homepage`), status (`new|contacted|closed`), assigned_to, notes
**`alert_subscriptions`** — Phase 1 captures only (engine is Phase 2): user_id (nullable), email, whatsapp, filters jsonb, is_active
**`channel_partner_applications`** — enrolment form only: name, phone, email, city, state, occupation, experience, status (approval workflow deferred to Phase 2)
**`listing_views`** — real server-tracked: listing_id, user_id (nullable), ip_hash, session_id, viewed_at (dedupe window → increments `listings.view_count`)

### Admin

**`settings`** — key/value jsonb, single source for **all** pricing per requirement #2:
`free_signup_credits` · `annual_price` · `service_package_price` · `success_fee_pct` · `credit_cost_flat_floor` · `credit_cost_inspection` · `credit_cost_officer_contact`
**`bulk_upload_batches`** — id, admin_id, filename, storage_path, status (`uploaded|previewed|committed|failed|cancelled`), row_count, valid_count, error_count, parsed_rows jsonb, errors jsonb — **this table is what makes preview-before-commit possible** (req #7)
**`admin_audit_log`** — admin_id, action, entity, entity_id, before/after jsonb

### RLS — the central security decision

Postgres RLS is row-level; we need **column-level** protection on `listings`. Two mechanisms, and I recommend using both:

1. **Column-level GRANTs.** `GRANT SELECT (public columns…) ON listings TO anon, authenticated` — never grant the gated columns. Database-enforced, survives any application bug.
2. **Server-only gated reads.** Gated fields are fetched exclusively in a server action after `resolveListingAccess()` passes. Gated values must never reach the client bundle — not even hidden behind a CSS blur, which is the classic way this model leaks.

Plus row-level: `status = 'live'` for anon; `unlocks`/`shortlists`/`credit_transactions` restricted to `user_id = auth.uid()`; admin bypass via role claim.

**Test for this:** view-source on a listing page as a guest must contain zero gated values. Add it to the Sprint 1 acceptance criteria and re-run it in Sprint 5.

---

## 4. Sprint plan

Milestones M1/M2/M3 held fixed as instructed. **One sequencing change proposed** — see the Sprint 1/2 note.

### Sprint 0 — Foundations · Wk 1 (5–11 Jul)
**Goal:** every external dependency linked, schema live, nothing blocking Sprint 1.

- GitHub repo → Vercel project → Supabase project, all linked; preview deploys on PR
- Next.js 14 + TS + Tailwind scaffold; design tokens from §1 as Tailwind theme; self-host Satoshi/Geist Mono
- Prisma schema for **all** of §3, migrated; seed `banks`, `settings`, states/cities
- Supabase Auth scaffolding: email/password + session middleware; role claim on JWT
- RLS policies + column-level GRANTs written and **tested with an anon client**
- `resolveListingAccess()` module skeleton + unit tests against all four states
- CI: typecheck, lint, migration check
- **Kick off Resend DNS verification (external dependency — see R1)**

**Needs from you:** repo access, Supabase/Razorpay/Resend keys, DNS access or client contact, logo/brand assets, real bank list.

---

### Sprint 1 — Core Public Pages · Wk 2 (12–18 Jul)
**Goal:** Home, Search, Listing page with gating fully working.

- Homepage: all sections per §1
- Search: filters, server-side pagination, sort, URL-driven state (shareable/SEO-friendly)
- **Listing page — the sprint's centre of gravity:** SSR with full metadata, image gallery, public fields, **gated fields via the access layer**, similar properties, callback CTA (no login), WhatsApp `wa.me` deep link pre-filled with property ID
- Real view-count tracking with dedupe
- Indian formatting utilities (₹ lakh/crore grouping, DD Month YYYY) — shared, used everywhere
- Guest-visible-source security test (§3)

> **Sequencing note.** The brief puts gating in Sprint 1 but credits/auth in Sprint 2 — gating has nothing to gate against. Resolution: auth + the credit *schema and ledger* land in Sprint 0; Sprint 1 builds gating on top; Sprint 2 builds the account *UI*. No milestone moves. **Please confirm.**

---

### Sprint 2 — Auth & Accounts · Wk 3 (19–25 Jul) → **M1: core build on staging, ~24 Jul**
- Signup / Login / forgot-password; Google OAuth **if confirmed** (see Q4)
- Signup grants `free_signup_credits` from settings via ledger
- Profile: Shortlisted · My Alerts · My Services · My Details
- Credit spend flow end-to-end: unlock → ledger → idempotent re-unlock → balance UI
- Shortlist add/remove; alert capture form
- **M1 demo on staging**

*Ungrounded:* no profile prototype exists. Designed from the established visual language; expect a review round.

---

### Sprint 3 — Payments & Admin Core · Wk 4 (26 Jul – 1 Aug)
- Razorpay: ₹999 subscription + ₹9,999 per-property package; order → checkout → **webhook verification** → entitlement; signature validation; failure/retry; idempotent webhooks
- Prices read live from `settings` — never hardcoded (req #2)
- Admin shell: auth guard, layout, dashboard metrics
- Listings Management: list/filter/create/edit/publish, image upload to Supabase Storage
- **Bulk Excel upload with row preview → validate → commit** (req #7), backed by `bulk_upload_batches`

*Ungrounded:* admin UX has no prototype. Highest estimate variance in the plan.

---

### Sprint 4 — Admin Completion & Remaining Pages · Wk 5 (2–8 Aug) → **M2: admin + payments live, ~7 Aug**
- Admin: Callback Requests (status workflow), Package Purchases, **Settings (pricing controls)**
- Verify a settings change propagates to every customer-facing surface — explicit test matrix
- Public: Pricing, Services, Channel Partner (enrolment form only), Contact, About
- Transactional email via Resend: signup, payment receipt, callback ack
- **M2 demo**

---

### Sprint 5 — QA, SEO, Polish & Launch · Wk 6 (9–20 Aug) → **M3: production launch, 20 Aug**
- Cross-device/browser QA; responsive audit; PWA manifest + service worker
- SEO: per-listing metadata, OG images, `sitemap.xml`, `robots.txt`, JSON-LD, canonicals
- Re-run the four-state gating matrix + guest-source leak test
- Lighthouse, Core Web Vitals, image optimisation
- Razorpay live-key switchover; production deploy; client walkthrough + handover docs

---

## 5. Conflicts found in the source material

**C1 — Channel Partner login vs stated scope.** `login.html` shows "Login as Channel Partner" and "Login as Admin". Phase 1 scope says Channel Partner is *enrolment form only, no partner portal*. **Recommendation:** ship the enrolment form, omit the CP login entry point. Confirm.

**C2 — Bank count inconsistent.** Homepage says "18+ Banks"; login/signup say "40+ banks"; About says "40+ Banks & NBFCs". The filter dropdown hardcodes only 4 (SBI, PNB, BoB, Canara). Need the real list and the real number.

**C3 — Placeholder contact details.** Footer phone is `+1 (234) 567-890` — a US placeholder. Need the real Indian number and confirmation of `hello@boliwala.com`.

**C4 — Pricing vs Services.** Footer links both; `services.html` currently serves as the pricing page. One page or two?

**C5 — Headline statistics.** "12,400+ Live Auctions", "₹2,100Cr won", "840+ auctions", "28% average saving", "140+ cities". Are these real, projected, or placeholder? If they ship as-is they are public marketing claims. **Recommendation:** drive counts from live data where possible; get written client sign-off on any static figure.

**C6 — "Flat number & floor — 1 credit each"** is ambiguous: 1 credit for the pair, or 1 credit per field? Plan assumes **1 credit for the group**. Confirm.

---

## 6. Risks

**R1 — Resend DNS verification (external, on the critical path).** Cannot send from a verified domain until Optimistic IP grants DNS access or adds records. Blocks all transactional email. *Mitigation:* raise Day 1 of Sprint 0; fall back to Resend's test domain for dev.

**R2 — Missing admin prototype + URD.** Sprints 3–4 are ~40% of the build and currently have no visual reference. *Mitigation:* supply before Sprint 3, or budget a design pass inside Sprint 3.

**R3 — Tailwind version mismatch.** Prototype is Tailwind **v4**; the stack spec says only "Tailwind CSS". The compiled output also suggests a Next.js newer than 14 with Turbopack. Recommend confirming Next 14 + Tailwind v4 (workable, different PostCSS setup) vs matching the prototype's actual versions. **Flagged rather than silently substituted, per §3 of the brief.**

**R4 — Satoshi font licensing.** Satoshi is Fontshare-distributed; confirm licence covers commercial web use and self-hosting.

**R5 — Razorpay activation lead time.** Live-mode activation needs KYC and can take days-to-weeks. Start immediately even though live keys aren't needed until Sprint 5.

**R6 — Gated-field leakage.** The whole revenue model depends on gated values never reaching an unauthorised client. Addressed by the dual mechanism in §3 and an explicit test in Sprints 1 and 5.

**R7 — 6 weeks is tight for this scope.** Sprint 5 has minimal slack. If something slips, the honest first candidates to defer are PWA offline support and the Channel Partner page.

---

## 7. Open questions — needed before Sprint 0

**Blocking:**
1. Where are the five missing reference files — superseded, or to be supplied?
2. Supabase project URL + anon + service-role keys; Razorpay **test** key/secret; Resend API key.
3. DNS access for boliwala.com, or the client contact who can add records.
4. Is Google OAuth required at launch, or can "Continue with Google" wait? (Prototype shows it on both auth pages.)
5. The definitive list of banks for the filter dropdown.

**Needed by Sprint 1:**
6. Brand assets — logo SVG, favicon, OG image.
7. Confirm the sequencing change in Sprint 1 (auth/credits schema moves to Sprint 0).
8. Resolve C1 (Channel Partner login) and C6 (flat/floor credit cost).
9. Real contact details (C3); Pricing vs Services page structure (C4).

**Needed by Sprint 3:**
10. Admin prototype + URD, or approval to design the admin from scope alone.
11. Sample bulk-upload Excel with real column headers.
12. Razorpay live activation status.
13. Sign-off on headline statistics (C5).

**Needed by Sprint 5:**
14. Privacy Policy and Terms copy.
15. Production domain cutover plan and who controls the registrar.

---

## 8. Recommendation

The plan is executable against the fixed milestones **provided items 1–5 arrive before 5 Jul**. The monetization core — the piece the brief calls most business-critical — is well grounded thanks to `services.html`, which lowers the biggest technical risk. The real exposure is the admin panel: 40% of the build with no reference material and no URD to check scope against.

If the missing files can't be produced, say so early and I'll re-plan Sprints 3–4 with a design pass built in rather than discovering the gap in week 4.

---
---

# Sprint 1.5 — UI & Design Replication (INTERIM)

**Added:** after Sprint 1 shipped and Supabase was connected.
**Status:** ✅ COMPLETE. All 8 steps executed and verified.
**Slots between:** Sprint 1 (built) and Sprint 2 (Auth & Accounts).

### Decisions taken
- **T1 — price input:** keep the bracket dropdown (client's call), not the
  prototype's free-text min/max.
- **T2 — button colour:** follow the prototype. Primary CTAs are now near-black
  (`--primary: #191511`); amber is a highlight accent only.
- **T3 — parallax:** built with `next/image`, rAF-throttled scroll listener,
  and `prefers-reduced-motion` respected. Hero art converted to WebP:
  **10.16 MB → 627 KB (94% smaller)**.

### One scoped exception to "don't touch the data layer"
Splitting Location and Keyword into two inputs is meaningless unless they
search different columns, so `ListingFilters` gained a `keyword` field and both
source implementations were updated: `q` matches locality/city/state/pincode,
`keyword` matches title/addressLine. Roughly 20 lines. Nothing in
`src/lib/access/`, `prisma/`, or the redaction path was touched.

### Verification results
typecheck clean · lint clean · 11/11 tests · production build passing ·
guest leak test 7/7 gated absent + 4/4 public present · all 8 search-filter
counts identical to Sprint 1 · keyword field works distinctly · view counter
still increments and dedupes · four access states correct · 12/12 routes 200 ·
hero h1, stats, city list and radio cards all present in server-rendered HTML.

Homepage First Load JS went 96.9 kB → 105 kB, the cost of the parallax hero,
city filter and icon set.

## Why this sprint exists

Sprint 1 was built without the design references, which were missing from
disk (§0). I designed the pages from the extracted content and colour values.
Having now read the demo's compiled markup properly, the gap is wider than a
colour tweak — the demo uses a different token architecture, a different hero,
and a different search UX. This sprint closes that gap.

**Nothing about the data or access layer changes.** The gating logic, redaction
boundary, Prisma queries, RLS and view counter are all correct and verified;
this is presentation only.

## What the demo actually uses (verified from `demo/`)

### 1. shadcn/ui semantic tokens — not literal colour names

This is the biggest divergence. The demo styles with `bg-background`,
`text-foreground`, `border-border`, `bg-secondary/30`, `text-muted-foreground`.
My build uses literal `bg-cream`, `text-ink-800`, `border-ink-800/10`.

Light theme (the only one shipped):

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `background` | `#f7f5f1` | | `secondary` | `#e7e4df` |
| `foreground` | `#14110d` | | `secondary-foreground` | `#24211c` |
| `card` | `#faf8f5` | | `muted` | `#e1ddd7` |
| `card-foreground` | `#14110d` | | `muted-foreground` | `#5a544c` |
| `popover` | `#faf8f5` | | `accent` | `#ab9c8b` |
| `primary` | `#191511` | | `accent-foreground` | `#fafafa` |
| `primary-foreground` | `#f7f5f1` | | `destructive` | `#e40014` |
| `border` / `input` | `#dbd7d0` | | `ring` | `#797065` |

`--radius: 0.25rem`. Chart palette: `#f05100 #00bb7f #f99c00 #fcbb00 #ff2357`.

A full dark set is defined in the CSS but **never activated** — no `.dark`
class, no toggle. Ship light-only; port the dark values as dormant tokens so a
future toggle is a one-line change.

> **`--primary` is near-black, not amber.** Primary buttons in the demo are
> dark; amber/orange appears as a *highlight* accent (headline span, icon
> tints). My current build made amber the primary button fill. Matching the
> demo means restyling every CTA. Flagging rather than deciding silently.

### 2. Sticky parallax hero

```
<section class="sticky top-0 h-screen ... bg-[#0A0F1C]">
  <img src="images/hously-background.png" class="... opacity-80">   ← sky, translateY on scroll
  ...headline + 4 stats...
  <img src="images/hously-foreground.png">                          ← building, translateY on scroll
  <ArrowDown class="animate-bounce">                                ← scroll cue
</section>
```

Full-viewport, `sticky top-0`, two layered images moving at different rates via
inline `transform: translateY()` driven by a scroll listener. Mine is a static
dark band with a blur blob. This is the single most visible difference.

### 3. Search is its own section below the hero — and richer

Mine folds a compact form into the hero. The demo puts it in
`<section id="search" class="py-20 bg-secondary/30 border-b border-border">`
with a card panel, and the fields differ:

| Field | Demo | Mine (Sprint 1) |
|---|---|---|
| Location | own input, map-pin icon | merged into one "Location / Keyword" |
| Keyword | **separate** input, search icon | — |
| Price | **Min / Max free-text pair** | single bracket dropdown |
| Bank | select | select ✓ |
| Property type | **6 selectable radio cards** with sub-labels | dropdown |
| Possession | **3 radio cards** | dropdown |
| Actions | Search Auctions + Reset Filters | ✓ |

Each label carries a Lucide icon with its own accent tint (map-pin
`orange-300`, search `blue-400`, rupee/credit-card `yellow-500`).

### 4. Other deltas

- **Icons**: 31 distinct Lucide icons (`gavel`, `landmark`, `shield-check`,
  `indian-rupee`, `sprout`, `handshake`, `trophy`…). Needs `lucide-react`.
- **Container**: `container mx-auto px-6 md:px-12`, not my custom `.shell`.
- **Header**: has a working mobile menu button; mine degrades to a scroll strip.
- **Auctions by City**: has a live city/state filter input above the grid.
- **Process section**: includes `images/exterior.png` alongside the 5 steps.

## Plan

Each step states its verification, per CLAUDE.md §4.

```
1. Token layer swap
   → verify: build passes; no literal ink-/cream-/brand- class remains
     (grep); pages render with correct light-theme colours

2. Add lucide-react + icon set
   → verify: build passes; bundle delta measured and recorded

3. Rebuild Header (mobile menu) + Footer on tokens
   → verify: nav works at 375px and 1280px

4. Sticky parallax hero (new client component)
   → verify: scrolls correctly; no layout shift; page still SSRs the
     headline text (view-source contains the h1)

5. Rebuild search panel — split Location/Keyword, min/max price,
   radio-card property + possession types
   → verify: form still submits as a plain GET with no JS; all 8 filter
     combinations from the Sprint 1 test return identical counts

6. Restyle listing cards, listing page, gated-field panels to tokens
   → verify: guest leak test still 7/7 absent, 5/5 public present;
     all four access states still render correctly

7. Restyle placeholder routes + city-filter input
   → verify: full route sweep returns 200

8. Full regression
   → verify: typecheck, lint, 11/11 tests, production build,
     leak test, search counts, view counter dedupe
```

**Estimate:** 1–1.5 days. Step 4 (parallax) and step 5 (search rebuild) carry
the most risk; steps 1–3 are mechanical.

## Assumptions — say if any are wrong

1. **Light theme only.** Dark tokens ported but dormant, matching the demo.
2. **Available images**: `hously-background.png`, `hously-foreground.png`,
   `exterior.png` get copied into `public/`. Per-listing photography does not
   exist and cards keep the current bank-monogram placeholder — you confirmed
   images come later.
3. **The listing page keeps my structure.** No listing-page prototype exists
   (§0), so only its *styling* moves to the new tokens; layout stays.
4. **Fonts stay Plus Jakarta Sans** until the Satoshi licence is settled (R4).
5. **Sprint 1's copy stays.** This is a visual pass, not a content rewrite —
   headline stats stay data-derived rather than reverting to the demo's
   unverified "12,400+ / 18+" claims (C5).

## Tradeoffs I want a decision on

**T1 — Min/max free-text price vs bracket dropdown.** The demo uses two
free-text inputs. That is what I will build, but it is weaker UX for a
JS-free GET form: no validation, no formatting, and users type "50 lakh" or
"5000000" interchangeably. The dropdown I built is more robust. *Default if
you don't reply: follow the demo, and add lenient parsing that accepts both
digits and "50L"/"1.2cr" shorthand.*

**T2 — Amber vs near-black primary buttons.** Matching the demo means CTAs go
dark with amber demoted to accent. It is a noticeably more restrained look.
*Default: follow the demo.*

**T3 — Parallax cost.** The hero needs a client-side scroll listener — the
only client JS on an otherwise fully server-rendered homepage, plus ~9.5 MB of
hero imagery that must be optimised before launch. *Default: build it, convert
the PNGs to WebP, and lazy-load the foreground layer.*

## Out of scope for this sprint

Listing photography · admin styling (no reference) · dark-mode toggle ·
content or copy changes · anything touching `src/lib/access/`, `src/lib/data/`
or `prisma/`.

---
---

# Sprint 2.1 — Search & Listing Page Rebuild (DEFERRED)

**Added:** 2026-08-04, during Sprint 2 (Auth & Accounts) execution.
**Status:** not started — deliberately deferred, see below.
**Slots between:** Sprint 2 (Auth & Accounts, in progress) and Sprint 2.5
(Google OAuth). Execute this one **before** 2.5.

### Why this is its own sprint, not a Sprint 2 line item

While wiring "replace hardcoded arrays with real Supabase queries" for
Sprint 2, opened `components/property-results.tsx` (search results) and
`components/listing-view.tsx` (individual listing page) and found the scope
is much larger than a data swap:

- Both are pure client-side mockups with **no props, no data-fetching** —
  content is either an inline hardcoded array or hand-typed JSX strings
  (e.g. `"Flat No. 303, Vithai Apartment"`)
- Filters, sort, and the "247 properties" result count are decorative —
  wired to nothing
- `/listing` is a single static route, not `/listing/[slug]` — no
  per-property routing exists yet
- Pagination buttons don't paginate

This is effectively the old plan's Sprint 1 core deliverable (§ Sprint 1 —
"Listing page — the sprint's centre of gravity") done again against the real
component structure, not a quick rewire. Decision (confirmed with the user):
land the smaller, already-interactive pieces first — auth, credit ledger,
profile tabs, shortlist/alerts, all of which already have real forms/state in
the UI, just no backend — then come back to this as its own reviewed chunk
rather than burying a 2-3x-larger rebuild inside the Sprint 2 diff.

### Scope, once picked up

- Convert `/search` to a real server-rendered, filterable, sorted, paginated
  page reading from `listings` (public columns only, `status = 'live'`)
- Add `/listing/[slug]` as a real dynamic route; retire the static `/listing`
  route (or make it redirect)
- Wire the access-gating layer (`lib/access/`, ported in Sprint 2 — see §
  "Access-gating layer" below) into the listing page so gated fields render
  through `resolveListingAccess()` / `redactListing()`, not hardcoded
- Real view-count tracking via `listing_views` with dedupe (per requirement #3)
- Bank filter counts and city listing counts computed from real data, not the
  hardcoded numbers currently in the sidebar
- Re-run the guest-visible-source leak test (old plan §3) once gating is live
  on a real route

---
---

# Sprint 2.5 — Google OAuth (DEFERRED)

**Added:** 2026-08-04, during Sprint 2 (Auth & Accounts) execution.
**Status:** not started — deliberately deferred, see below.
**Slots between:** Sprint 2 (Auth & Accounts) and Sprint 3 (Payments & Admin Core).

### Why this is its own sprint, not a Sprint 2 line item

Old Sprint 2 listed "Google OAuth if confirmed (see Q4)" — Q4 (§7) was never
answered, and `.env.local` has no `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
The client's shipped UI (`components/auth-view.tsx`) already includes a
"Continue with Google" button, wired only to the page's local mock handler
(`router.push('/profile')`) — no real auth logic exists in that component at
all yet. Decision: ship real **email/password** auth now as part of Sprint 2;
leave the Google button visually present (matches the shipped design) but not
wired to a real provider, so it doesn't silently break or mislead users mid-build.

### Scope, once unblocked

- Get Google OAuth client ID/secret from the client, register the Supabase
  project's callback URL with Google Cloud Console
- Enable the Google provider in Supabase Auth settings
- Wire `components/auth-view.tsx`'s Google button to
  `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Handle first-login profile creation the same way email/password signup does
  (5 free credits grant, `profiles` row) — the OAuth callback path needs the
  same signup-grant logic, not a separate one
- Test: new Google signup gets 5 credits once, not on every login

### Blocking

Needs from the client: Google OAuth client ID + secret, confirmation this is
required for launch (vs. a fast-follow).
