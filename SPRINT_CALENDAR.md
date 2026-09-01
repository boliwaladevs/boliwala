# SPRINT_CALENDAR.md — Boliwala.com

> [!IMPORTANT]
> **🔄 UPDATE RULE:** On every code change and commit, the following files MUST be updated
> to reflect the current state: `MEMORY.md`, `project_calendar.html`, `SPRINT_CALENDAR.md`.
> Mark completed items, update dates, and move status indicators. This rule is canonical
> and repeated in `CLAUDE.md`, `MEMORY.md`, and `project_calendar.html`.

> [!CAUTION]
> **⛔ 31 AUG 2026 — `immediate_plan.md` IS NOW THE EXECUTION QUEUE.**
>
> `ROADMAP.md` remains the strategic ordering, but the **active work queue** is
> **`immediate_plan.md`** — nine workstreams (W0–W8), all unblocked, ending at a hard
> `=== STOP: CSV REQUIRED ===` marker. The operating brief is **`MEMORY.md` §38**.
> Rationale and priority tiers: **`REALITY_CHECK.md`**. Post-launch: **`deferred_plan.md`**.
>
> Mark W0–W8 complete here as they land, alongside the sprint task detail below.

> [!CAUTION]
> **⛔ THE SCHEDULE IN THIS FILE IS HISTORICAL. `ROADMAP.md` IS THE AUTHORITY ON WHAT TO DO NEXT.**
>
> A brainstorm on **30 August 2026** reset the infrastructure plan and the launch
> sequencing (`MEMORY.md` §25). Three things in this file are now **false**:
>
> 1. **The 15 September launch date is dead** (`ROADMAP.md` **D0**). A new date has
>    not yet been agreed with the client.
> 2. **The "all credentials by 17 August" prerequisite is retired.** Razorpay is
>    deferred indefinitely — month-one monetisation is a manual "Contact Sales"
>    flow (`ROADMAP.md` Item 4). Sprints 7–11 are no longer gated on payments.
> 3. **The Week 1–6 schedule in Part 2 is superseded** by the dependency-ordered
>    items in `ROADMAP.md`. The stack is also moving to Cloudflare Workers + R2
>    (`ROADMAP.md` Item 1, in progress — `MEMORY.md` §27).
>
> **What is still valid here:** the per-sprint *task detail* (what each sprint
> contains). `ROADMAP.md` links back to it for exactly that. Read the task lists,
> ignore the weeks and dates.

**Created:** 9 August 2026  
**Last Updated:** 30 August 2026 — superseded-schedule notice added; task detail unchanged  
**Launch date:** ⛔ **15 September 2026 is dead** — a new date is owed (`ROADMAP.md` **D0**)  
**Source of truth:** `ROADMAP.md` for sequencing; `boliwala_features.txt` (URD v2.0) + `SCOPE_AUDIT.md` + `MEMORY.md` for scope

---

## Part 1 — Delivered Sprints (Complete)

All verified, committed, and pushed to `main`.

| Sprint | Name | Date | Key Deliverables | Status |
|---|---|---|---|---|
| 0 | Foundations | Jul 2026 | GitHub repo, Vercel, Supabase, Next.js 16 + TS + Tailwind v4 scaffold | ✅ Done |
| 1 | Public Pages | Jul 2026 | Homepage, search shell, listing page, Indian formatting, view tracking | ✅ Done |
| 1.5 | Design Replication | Jul 2026 | shadcn tokens, sticky parallax hero, rebuilt search panel, Lucide icons | ✅ Done |
| 2 | Auth & Accounts | Aug 2026 | Email/password auth, signup trigger (5 credits), profile page, password reset, alerts capture | ✅ Done |
| 2.1 | Search & Listings | 4 Aug | Real filterable search, `/listing/[slug]`, 4-state gating, credit unlock RPC, shortlists, view counts | ✅ Done |
| 2.5 | Google OAuth | 9 Aug | Google sign-in end-to-end, `/auth/callback`, no double credit grant | ✅ Done |
| 2.7 | RLS Hardening | 4 Aug | All RLS-disabled tables locked, trigger function execution revoked | ✅ Done |
| 3 | Admin Core | 5 Aug | Admin auth guard, live KPIs, listings CRUD, Storage image upload, bulk Excel upload | ✅ Done |
| 4 | Admin & Pages | 5 Aug | Callback pipeline, admin callbacks workflow, pricing settings, partner enrolment form | ✅ Done |
| 5 | QA, SEO, Perf | 9 Aug | Sitemap, robots, canonicals, per-listing metadata, JSON-LD, icons, manifest, typechecking on, leak test + access matrix scripts, image optimisation (98% reduction) | ✅ Done |

---

## Part 1b — Post-Audit Remediation (22 Aug)

A full codebase audit on 22 Aug (`codebase_audit.md`) found that **production
had been stuck on `0e6cfd5` since 9 Aug** — every build since failed at
prerender, so Sprint 6 and the superadmin role were never deployed. Fixed in
`375a160`. The audit also found five real defects in current code, planned in
`post_audit_plan.md` and delivered as Sprint 15.

| Sprint | Name | Date | Key Deliverables | Status |
|---|---|---|---|---|
| — | Build hotfix | 22 Aug | `getSiteStats()` off the service-role client; production build unblocked | ✅ Done |
| 15 | Critical UX & Auth Repair | 22 Aug | Destructive-token fix (errors were invisible), header Login/Sign Up + signed-in state, `/search` renders without params, password show/hide, account header on `/profile` | ✅ Done |
| 16 | Account Self-Service | 22 Aug | Change password (re-auth required), alert frequency edit, alert delete, honest create-alert label, delete account with cascade | ✅ Done |

### Sprint 15 — task detail

| # | Task | Status |
|---|---|---|
| 15.1 | **Destructive colour token**: `--destructive-foreground` was identical to `--destructive` in light mode, making every error toast red-on-red. Fixed in both themes. | `[x]` |
| 15.2 | **Header Login / Sign Up** + signed-in "My Account", desktop and mobile. Header previously had no auth link anywhere. | `[x]` |
| 15.3 | **`/search` with no params** now renders listings and the filter sidebar (was gated behind `hasSearched`, so "Browse More" landed on an empty page). | `[x]` |
| 15.4 | **Password show/hide toggle** on `auth-view` and `reset-password-view`. | `[x]` |
| 15.5 | **Account header on `/profile`** — replaces the marketing `<Header>`/`<Footer>` so the portal no longer wears the public site's nav. | `[x]` |

**Verified:** `tsc --noEmit` clean · `pnpm build` clean **with
`SUPABASE_SERVICE_ROLE_KEY` blanked** (guards the `375a160` regression) · leak
test PASS 12/12 · access matrix PASS 49/7 · route sweep 20 routes unchanged ·
`/search` returns 12 cards with no params.

### Sprint 16 — task detail

| # | Task | Status |
|---|---|---|
| 16.1 | **Change password** from the profile, current password required first (Supabase's `updateUser` does not ask for it). | `[x]` |
| 16.2 | **Edit alert** — frequency picker. Filter editing deliberately not built; "View matches" routes to `/search` where the real filter UI already lives. | `[x]` |
| 16.3 | **Delete alert**, distinct from Pause. | `[x]` |
| 16.4 | **"+ Create Alert"** relabelled — it was a bare link to `/search`, a button whose label lied. | `[x]` |
| 16.5 | **Delete account** — cascades profile, credits, shortlists, unlocks, alerts. Closes the PAN/Aadhaar deletion gap. | `[x]` |

> **16.2/16.3 needed no migration but could not be client-side.** `authenticated`
> holds `UPDATE` on `isActive` **only**, and there is no DELETE policy at all —
> so both run service-role after an ownership check. A client-side write would
> have been denied and reported as success-with-zero-rows, i.e. silently broken.

**Verified:** `tsc --noEmit` · build clean with the service key blanked · leak
test PASS 12/12 · access matrix PASS 49/7 · route sweep unchanged. **Not
click-tested in a browser** — skipped at the user's request ahead of a client
meeting; exercise the three new flows before relying on them.

> **Still open from the audit** — see `post_audit_plan.md`: Sprint 15.5
> (Vercel/Supabase dashboard config, DB password rotation), Sprint 16.5
> (Resend-blocked), Sprint 17 (Channel Partner scope decision).

---

## Part 2 — Sprint Plan: 10 Aug → 15 Sep Launch  ⛔ **SCHEDULE SUPERSEDED — see the notice at the top of this file**

> **The week-by-week plan below is historical.** Use `ROADMAP.md` for ordering.
> The task lists inside each sprint remain accurate and are still referenced.

### ~~🔴 NON-NEGOTIABLE PREREQUISITE~~ — RETIRED 30 Aug 2026

~~**All blocked credentials MUST arrive by 17 August.** Without them, the 15 Sep date is impossible.~~

**This prerequisite no longer applies.** Razorpay is deferred indefinitely
(`ROADMAP.md` Item 12) and the 15 Sep date is dead, so the 17 Aug / 24 Aug
deadlines below are moot. The table is kept because the *items* are still
wanted — only the dates and the launch-gating framing are wrong:

- **Razorpay keys** — no longer blocking anything. Item 12, unscheduled.
- **Resend** — still wanted, now for the "Contact Sales" flow (`ROADMAP.md`
  Item 4, **D7**); a stopgap email path is acceptable for month one.
- **Privacy/Terms, contact number, brand assets** — still genuinely blocking
  launch (`ROADMAP.md` Item 6, **D9**), just not on 24 Aug.

| Credential | Source | Action |
|---|---|---|
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | Razorpay Dashboard (self-serve, ~10 min) | Client creates test-mode keys NOW |
| `RAZORPAY_WEBHOOK_SECRET` | After webhook endpoint is registered | Created during Sprint 3.5 |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Resend.com (self-serve) | Client creates account NOW |
| Privacy Policy + Terms copy | Client/lawyer | Must arrive by 24 Aug |
| Contact number + WhatsApp | Client | Must arrive by 24 Aug |
| Brand assets (logo, favicon) | Client | Must arrive by 31 Aug |
| Production domain | Client | Must arrive by 7 Sep |

### Dependency Map (compressed for 5-week sprint)

```
WEEK 1: Sprint 6 (unblocked)
WEEK 2: Sprint 3.5 + Sprint 4.5 (parallel, keys must arrive)
WEEK 3: Sprint 3.5 (fin) + Sprint 7 + Sprint 8 (parallel) + Sprint 5.5
WEEK 4: Sprint 8 (fin) + Sprint 9 + Sprint 10 (parallel)
WEEK 5: Sprint 10 (fin) + Sprint 11 + Sprint 12 + Sprint 13 (QA)
15 SEP: 🚀 LAUNCH
```

---

### Week 1 (10–16 Aug) — Sprint 6: Profile & Debt Cleanup

**Status:** ✅ **COMPLETE (9 Aug)** — except 6.7, which needs Supabase dashboard access  
**Duration:** 1 week (delivered same day)

| # | Task | URD Ref | Status |
|---|---|---|---|
| 6.1 | Profile — **My Alerts tab**: wire to `alert_subscriptions`, show saved search criteria, manage/delete | §3.2 Tab 2 | `[x]` |
| 6.2 | Profile — **My Details tab**: `city`, `panNumber`, `aadhaarNumber`, `preferences` columns + form fields | §3.2 Tab 6 | `[x]` |
| 6.3 | `/search` **email-alerts banner**: wire to `alert_subscriptions` with filter-to-JSON mapping | §2.2 | `[x]` |
| 6.4 | **Protect `/partner/dashboard`**: add auth guard (redirect guests to `/login`) | §4 / Security | `[x]` |
| 6.5 | **Dead code cleanup**: remove `components/projects.tsx` + unreferenced images | Debt | `[x]` |
| 6.6 | **Data audit**: fix `flatNumber`/`addressLine` overlap on Jaipur listing | Debt | `[x]` |
| 6.7 | **DB password rotation** — ⚠️ needs Supabase dashboard access, cannot be done from the repo | Security | `[ ]` |
| 6.8 | **Statistics from live data**: wire live-auction / city / bank counts in `hero.tsx`, `about-view.tsx` **and `auth-view.tsx`** (third file, previously missed) | C5 / §2.1 | `[x]` |
| 6.9 | **Contact details env-driven**: delete the `+1 (234) 567-890` US placeholder in `footer.tsx`, hide the block when unset | C3 | `[x]` |

> **6.2 — PAN and Aadhaar: client decided to store them (9 Aug).** The
> compliance concern was raised and the client confirmed. Built with the
> safeguards the schema allows: per-column UPDATE grant to `authenticated`
> only (never `anon`), reads restricted to own row by the existing
> `own_profile` RLS policy, and format CHECK constraints so malformed values
> are rejected outright. **Still outstanding for whoever owns compliance:**
> application-level encryption at rest, a retention/deletion policy, and an
> access audit trail. See the header of `supabase/migrations/0009`.

> **6.3 and 6.1 are cheaper than they look.** `alert_subscriptions`
> already has a `filters jsonb` column, so both are mapping jobs with no
> migration. See `MEMORY.md` §18.2.

**Verify:** `tsc --noEmit` clean · `pnpm build` clean · leak test + access matrix pass · Profile My Alerts real · publishing a 13th listing changes the homepage count

---

### Week 2 (17–23 Aug) — Sprint 3.5 + Sprint 4.5 (Parallel)

**Status:** 🔴 BLOCKED until keys arrive  
**Duration:** Starts Week 2, Sprint 3.5 finishes early Week 3

#### Sprint 3.5 — Razorpay Payments (runs Week 2 → mid Week 3)

| # | Task | URD Ref | Status |
|---|---|---|---|
| 3.5.1 | Razorpay SDK integration + order creation API route | §1 | `[ ]` |
| 3.5.2 | **₹999 annual subscription** checkout flow | §1, §2.4 | `[ ]` |
| 3.5.3 | **₹9,999 per-auction package** purchase flow (per-property) | §1, §2.3 | `[ ]` |
| 3.5.4 | **Webhook endpoint** `/api/razorpay/webhook`: signature verification, idempotent | §7 | `[ ]` |
| 3.5.5 | **Entitlement logic**: payment → `subscriptions` row (₹999) or `service_packages` row (₹9,999) | §1 | `[ ]` |
| 3.5.6 | Failure handling, retry, stale-order cleanup | §7 | `[ ]` |
| 3.5.7 | Wire pricing/listing CTAs to real checkout | §2.3, §2.4 | `[ ]` |
| 3.5.8 | Verify subscriber auto-unlock works end-to-end after payment | §2.3 | `[ ]` |

#### Sprint 4.5 — Transactional Email (parallel, 1 week)

| # | Task | URD Ref | Status |
|---|---|---|---|
| 4.5.1 | Resend SDK setup + `lib/email/send.ts` | §7 | `[ ]` |
| 4.5.2 | **Welcome email** (3-part series) | §6.2 | `[ ]` |
| 4.5.3 | **Payment receipt email** (₹999 + ₹9,999) | §6.2 | `[ ]` |
| 4.5.4 | **Callback acknowledgement email** | §6.2 | `[ ]` |
| 4.5.5 | Hook emails into signup/payment/callback flows | — | `[ ]` |

**Verify:** Test-mode payment end-to-end · webhook idempotent · subscriber sees all gated fields · emails deliver in Resend dashboard

---

### Week 3 (24–30 Aug) — Sprint 7 + Sprint 8 + Sprint 5.5 + Sprint 10 (Parallel)

**Duration:** Sprint 3.5 wraps up early this week. Four sprints run in parallel.

#### Sprint 7 — Admin Completion (Finance & Users)

| # | Task | URD Ref | Status |
|---|---|---|---|
| 7.1 | Admin **Payments tab**: all transactions real | §5.7 | `[ ]` |
| 7.2 | Admin **Subscriptions tab**: active subs, ARR, renewals | §5.7 | `[ ]` |
| 7.3 | Admin **Success Fee Tracker**: won auctions, 1% due, invoice & mark paid | §5.7 | `[ ]` |
| 7.4 | Admin **Users tab**: full table with filters | §5.8 | `[ ]` |
| 7.5 | Admin **Package Purchases tab**: all ₹9,999 engagements | §5.4 | `[ ]` |
| 7.6 | Admin **Revenue Chart** (real data) | §5.1 | `[ ]` |
| 7.7 | Admin **Activity Feed** (real `admin_audit_log` entries) | §5.1 | `[ ]` |

#### Sprint 8 — User Services & Admin Pipeline (runs Week 3 → early Week 4)

| # | Task | URD Ref | Status |
|---|---|---|---|
| 8.1 | Admin **Service Pipeline**: by status, 4-step progress | §5.5 | `[ ]` |
| 8.2 | Admin **Report & Document Upload**: search user, select package, upload file | §5.6 | `[ ]` |
| 8.3 | Profile — **My Subscription tab**: tier, expiry, renewal options | §3.2 Tab 4 | `[ ]` |
| 8.4 | Profile — **My Services tab**: 4-step progress tracker per package | §3.2 Tab 3 | `[ ]` |
| 8.5 | Profile — **My Reports tab**: view/download admin-uploaded documents | §3.2 Tab 5 | `[ ]` |

#### Sprint 5.5 — Content & Legal (client copy must arrive this week)

| # | Task | URD Ref | Status |
|---|---|---|---|
| 5.5.1 | **Privacy Policy page** (`/privacy`) | Legal | `[ ]` |
| 5.5.2 | **Terms of Service page** (`/terms`) | Legal | `[ ]` |
| 5.5.3 | Wire footer links from `href="#"` to real routes | §2 | `[ ]` |
| 5.5.4 | **Real headline statistics** in `hero.tsx` and `about-view.tsx` | §2.1 | `[ ]` |
| 5.5.5 | **Real contact number** + WhatsApp deep link | §2.7 | `[ ]` |
| 5.5.6 | **Brand assets swap** (logo, favicon, OG image) | §7 | `[ ]` |
| 5.5.7 | **Font resolution** (Satoshi licence or switch to Plus Jakarta Sans) | Debt | `[ ]` |

#### Sprint 10 — Channel Partner Portal

| # | Task | URD Ref | Status |
|---|---|---|---|
| 10.1 | **CP Auth system**: `profiles.role = 'partner'`, login, email verification, onboarding | §4.1 | `[ ]` |
| 10.2 | **CP Dashboard & Earnings**: 5 KPI cards, earnings breakdown, total earnings | §4.2 | `[ ]` |
| 10.3 | **Referral Link system**: unique `ref=CP_xxx`, copy button, link tracking | §4.3 | `[ ]` |
| 10.4 | **Unlimited Invites**: paste emails/phones, send invite, status tracking | §4.3 | `[ ]` |
| 10.5 | **Commission calculation**: auto-commission on all 3 revenue streams | §4.5 | `[ ]` |
| 10.6 | **Referral table**: filterable list | §4.2 | `[ ]` |
| 10.7 | Admin **Partners tab** (real): approve/reject, assign tier | §5.9 | `[ ]` |
| 10.8 | Admin **Commission Settings**: 3 editable rates, audit-logged | §5.10 | `[ ]` |

**Verify:** All admin tabs show real data · all 6 profile tabs real · Privacy/Terms render · footer links work · CP onboarding works.

---

### Week 4 (31 Aug–6 Sep) — Sprint 11 + Sprint 12 (Parallel)

#### Sprint 11 — CP Creatives & WhatsApp

| # | Task | URD Ref | Status |
|---|---|---|---|
| 11.1 | **Co-Branded Creatives**: auto-personalized (partner name/phone/link), 4 formats | §4.4 | `[ ]` |
| 11.2 | Admin **Creative Templates Management**: upload base templates, auto-personalize | §5.11 | `[ ]` |
| 11.3 | Partner **creatives gallery** `/channel-partner/creatives` | §4.4 | `[ ]` |
| 11.4 | **WhatsApp Phase 1**: click-to-chat links, manual alert queue, segment export | §6.6 | `[ ]` |
| 11.5 | Admin **WhatsApp Tools panel** | §6.7 | `[ ]` |

#### Sprint 12 — Mobile

| # | Task | URD Ref | Status |
|---|---|---|---|
| 12.1 | **PWA enhancement**: service worker for offline shell, install prompt | — | `[ ]` |
| 12.2 | **Push notifications** setup (if PWA) | — | `[ ]` |
| 12.3 | **Or Capacitor APK** build if client requires native app | — | `[ ]` |

**Verify:** Co-branded templates render properly · Mobile PWA/APK builds successfully.

---

### Week 5 (7–14 Sep) — Sprint 9 + Sprint 13 (Parallel → QA)

#### Sprint 9 — Marketing & Engagement Engine

| # | Task | URD Ref | Status |
|---|---|---|---|
| 9.1 | **Property Match Alert Engine**: listing insert/update triggers email to matching subscribers | §6.1 | `[ ]` |
| 9.2 | **Remaining email templates**: weekly digest, re-engagement, post-callback, post-auction, abandoned alert | §6.2 | `[ ]` |
| 9.3 | **Credit Lifecycle nudges**: 2 credits left → nudge, last credit → paywall, 3 days → social proof | §6.3 | `[ ]` |
| 9.4 | **Subscription Lifecycle**: receipt, renewal reminders (30/7/0 days), win-back 14 days after lapse | §6.4 | `[ ]` |
| 9.5 | **Cross-Sell flow**: on 3+ unlocks → ₹9,999 nudge | §6.5 | `[ ]` |
| 9.6 | Admin **Alert Engine panel** | §6.7 | `[ ]` |
| 9.7 | Admin **Email Campaigns panel** | §6.7 | `[ ]` |
| 9.8 | Admin **Segments & Export** | §6.7 | `[ ]` |
| 9.9 | Admin **Engagement Analytics** | §6.7 | `[ ]` |

#### Sprint 13 — Final QA & Launch (11–15 Sep)

| # | Task | URD Ref | Status |
|---|---|---|---|
| 13.1 | **Full regression**: all `testing_guide.md` phases (0–10) | QA | `[ ]` |
| 13.2 | **Leak test + access matrix** against production build | Security | `[ ]` |
| 13.3 | **Cross-browser QA**: Chrome/Safari/Firefox/Edge × Desktop/Mobile | §8 | `[ ]` |
| 13.4 | **Lighthouse audit**: all scores ≥90 | §8 | `[ ]` |
| 13.5 | **Production domain cutover**: DNS, `NEXT_PUBLIC_SITE_URL`, OAuth redirects, Razorpay URLs | §7 | `[ ]` |
| 13.6 | **Razorpay live-key switchover** | §7 | `[ ]` |
| 13.7 | **Production deploy** to Vercel | §7 | `[ ]` |
| 13.8 | **Client walkthrough & handover docs** | — | `[ ]` |

**Verify:** ALL testing_guide.md phases pass · Lighthouse ≥90 · production build leak test PASS · live payment completes · all features functional

---

### Week 6 (16 Sep onwards) — Hypercare & Live Ops

#### Sprint 14 — Post-Launch Observation & Bug Fixing

| # | Task | URD Ref | Status |
|---|---|---|---|
| 14.1 | **Hands-on observation**: monitoring app works in production deployment | — | `[ ]` |
| 14.2 | **Instant bug fixing sprints**: if any errors pop | — | `[ ]` |

---

## Part 3 — Timeline at a Glance  ⛔ **HISTORICAL**

> This grid describes a 15 Sep launch that no longer exists. Kept as a record of
> what was planned on 9 Aug. `ROADMAP.md` orders the work by dependency instead
> of by week, deliberately, because no new date has been agreed (**D0**).

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  WEEK 1 │  WEEK 2 │  WEEK 3 │  WEEK 4 │  WEEK 5   │ 15 SEP │  WEEK 6        │
│ 10–16   │ 17–23   │ 24–30   │ 31–6    │ 7–14      │ LAUNCH │ 16–22 Post-L.  │
├─────────┼─────────┼─────────┼─────────┼───────────┼────────┼────────────────┤
│Sprint 6 │Sprint3.5│Spr3.5fin│Sprint 11│Sprint 9   │  🚀    │ Sprint 14      │
│Profile  │Razorpay │Sprint 7 │Creatives│Mktg+Eng   │LAUNCH  │ Hypercare      │
│  Debt   │────────►│Admin Fin│+ WA     │──────────►│        │ + Bug Fixes    │
│         │Sprint4.5│Sprint 8 │Sprint 12│Sprint 13  │        │                │
│         │Email    │Spr 5.5  │Mobile   │QA+Deploy  │        │                │
│         │         │Spr 10 CP│App      │           │        │                │
└─────────┴─────────┴─────────┴─────────┴───────────┴────────┴────────────────┘
```

## Part 4 — Client Deadlines (Hard)  ⛔ **ALL DATES VOID — 30 Aug 2026**

> Every date below was pegged to the dead 15 Sep launch, and the 17 Aug / 24 Aug
> ones were already missed before the plan was reset. **What is still owed from
> the client is tracked live in the `ROADMAP.md` decision register (D0–D12)** —
> use that, not this table.

| ~~Date~~ | What | Status as of 30 Aug 2026 |
|---|---|---|
| ~~10 Aug~~ | Start Sprint 6 | ✅ Done — Sprint 6 shipped 9 Aug (`MEMORY.md` §19) |
| ~~17 Aug~~ | Razorpay test keys + Resend API key | **Razorpay retired** (Item 12, unscheduled). Resend still wanted — **D7**, Item 4, stopgap acceptable |
| ~~24 Aug~~ | Privacy/Terms copy, contact number, WhatsApp, headline stats | ❌ Still outstanding — **D9**, Item 6, genuinely launch-blocking |
| ~~31 Aug~~ | Brand assets (logo, favicon, OG image) | ❌ Still outstanding — **D9**, Item 6 |
| ~~7 Sep~~ | Production domain + Razorpay live KYC | Domain still owed — **D2**, blocks Item 1b. Razorpay KYC no longer relevant |
| ~~11 Sep~~ | All code complete — QA freeze | Void — no agreed date to freeze against |
| ~~15 Sep~~ | ~~🚀 LAUNCH~~ | **Dead. A new date must be agreed — D0.** |

**Newly outstanding since this table was written:** **D3b** (inventory data
source) is the longest-lead commercial item and blocks Items 2·S4–S8 — the
~50,000 listings that `coparison.md` §1 calls our single biggest competitive
gap. It should be escalated ahead of everything else in this table.

---

## Admin tooling — outside the sprint grid (2026-08-31)

- [x] **Bulk-upload sample CSV** — downloadable from the Bulk Upload Excel page,
      generated from the importer's own field list. Fixed a silent
      date-corruption bug in the same commit (ISO dates were being committed as
      the year 46279). `MEMORY.md` §34.1–34.3.
- [x] **S9 · redirect-preserving auth** — `/login?next=` honoured with a tested
      open-redirect guard; gated CTAs, pricing CTAs and the server-side gates all
      pass it. Header login link is a known remaining gap. `MEMORY.md` §34.4–34.5.
- [x] **S7 (part) · popularity sort + reserve price per sq ft** — "Most Popular"
      sort on the already-tracked `viewCount`; ₹/sq ft on cards and listing pages,
      hidden when area is unknown. Rest of S7 still blocked on missing columns.
      `MEMORY.md` §34.6–34.7.
- [x] **§30.4 root-caused** — Worker listing pages 500 with `supabaseKey is
      required`; the Worker has no secrets and `SUPABASE_SERVICE_ROLE_KEY` is the
      only runtime var. Fix is one `wrangler secret put`, blocked by loop rule 4
      and written out for the user. Item 1a is a conditional go. `MEMORY.md` §34.8–34.10.
- [x] **Item 1a — Cloudflare go/no-go: GO (2026-08-31).** Secret set; leak test
      12/12 against the deployed Worker, access matrix 49/49, 22-route sweep clean.
      `MEMORY.md` §35.

### Post-loop findings, 2026-08-31 — see `MEMORY.md` §36

- [x] **`NEXT_PUBLIC_SITE_URL` set on Cloudflare (2026-08-31).** Added as a
      Workers Builds build variable and verified on the live Worker: canonical,
      `og:url`, `robots.txt` and all 20 sitemap entries read the real origin, and
      `grep -c localhost` returns 0. `MEMORY.md` §37.0.
- [ ] Sign in with email/password on the deployed origin and confirm `/profile`
      renders — the one Item 1a check never run. `MEMORY.md` §35.3.
- [ ] `prompt: "select_account"` on the Google sign-in call, if the account
      picker is wanted every time. `MEMORY.md` §36.3.
- [ ] Header "Log In" link still drops context (`components/header.tsx:119`, `:203`).
- [ ] `bulkCommitListings` silently drops rows the DB rejects
      (`app/actions/admin-listings.ts:211`) — fix before real inventory arrives.
- [ ] Re-measure the Worker bundle: 2.74 MiB of a 3 MB free-tier cap, and that
      figure predates the overnight work. `MEMORY.md` §36.4.
- Host decision reaffirmed: **stay on Workers + R2 + Supabase**. `MEMORY.md` §36.4.

### Afternoon loop, 2026-08-31 — the §37 queue, all three items landed

See `MEMORY.md` §37.7 for the return summary and §37.8–§37.12 for the detail.

- [x] **Item A — one email, one role** (`efb32d8`). `/login` and `/partner/login`
      each admit only their own roles, on the password path and the Google
      callback alike; a wrong-door sign-in is signed back out rather than left
      with a live session. `channel_partner` now lands on `/partner/dashboard`.
      Verified by 23 new assertions across 8 role/door pairs in
      `scripts/access-matrix-test.mjs`; the existing 49 gating assertions are
      untouched and still pass.
- [x] **Item B — collapsible admin sidebar** (`8fc1963`). Six Radix `Collapsible`
      groups, the active group forced open, badges rolled up onto a collapsed
      header, preference stored in `localStorage`.
      **⚠️ The visual check is still owed** — it needs a signed-in superadmin
      browser session, which was not available unattended.
- [x] **Item C — demo data purged from the admin panel** (`0ef6598`, `b3c02fd`,
      `1389991`, `dfaae2a`, `2e991c0`). Every StatCard on every panel now reads
      from the database; the Recent Activity feed shows real rows instead of five
      invented people; metrics with no table behind them render "—" with a reason
      rather than a fabricated figure; the success-fee banner no longer announces
      a debt that does not exist.
- [x] **Correction to `MEMORY.md` §37.3** (`1567903`). `profiles.role` **is**
      constrained — it is of Postgres enum type `public."Role"`. The CHECK-
      constraint migration written earlier in the window was unnecessary and has
      been deleted; **nothing is waiting on you there.**

- [x] **Demo table ROWS no longer name invented people** — Packages, Payments, Users,
      Partners, Success Fees and Service Pipeline, plus three more the plan had not
      listed. Fixed by W1; see `MEMORY.md` §39.2.
- [ ] Signing *up* at `/partner/login` still creates an ordinary `user` account.
      Not a hole, but confusing. `MEMORY.md` §37.8.
- [ ] `pnpm run lint` cannot run — **eslint is not a dependency of this project**
      and was not before this window. `MEMORY.md` §37.8.

### The pre-launch queue, `immediate_plan.md` W0–W8 (running, `MEMORY.md` §39)

- [x] **W0 — Plus Jakarta Sans.** The three `app/fonts/Satoshi-*.woff2` files were
      597-byte Fontshare CSS text, never imported by anything, so the site had always
      fallen back to system-ui. Replaced with `Plus_Jakarta_Sans` from
      `next/font/google` wired through a CSS variable, the fake files deleted, and the
      35 inline `font-['Plus_Jakarta_Sans']` classes in
      `components/partner-dashboard-view.tsx` removed. `grep -ri satoshi` is clean.
      Standing bar green: tsc 0, build 25/25, leak 12/12, matrix 49/49 + 23/23.
- [x] **W1 — the fabricated admin tables are gone.** Nine table bodies, not six —
      Alert Subscribers, the Dispatch Log and the WhatsApp Queue carried the same
      invented rows. All Users, Channel Partners and Alert Subscribers now query the
      database (5 real users; the other two are genuinely empty); Packages, Payments,
      Service Pipeline, Success Fees, the Dispatch Log and the WhatsApp Queue show an
      empty state that says why it is empty. The hardcoded "31 active · 6 pending"
      partner count and the invented Service Pipeline tab counts are gone too.
      `MEMORY.md` §39.2.
- [x] **W2 — Contact Sales enquiry flow.** `contact_sales_enquiries` + an insert-only
      RLS path; every "buy" CTA on Pricing and Services now goes to
      `/contact?plan=…` instead of a checkout that does not exist; a Sales Enquiries
      section in admin with status workflow, notes, and **Grant Subscription / Grant
      Package / Grant Credits** writing the real entitlement, a payment row and an
      audit entry. Packages, Payments and Service Pipeline read those rows.
      Notification is **admin-panel-only** — no email exists to send.
      `MEMORY.md` §39.3.
- [x] **W3 — grants now match the RLS policies** (`0016_grants_match_policies.sql`).
      Fifteen tables carried Postgres's blanket grant for anon *and* authenticated —
      RLS was the only thing stopping the anon key writing to the audit log. Every
      grant is now the narrowest its policies allow, TRUNCATE/REFERENCES/TRIGGER are
      revoked schema-wide and by default for future tables, and three load-bearing
      **column-level** grants were found and preserved: listings' 27-column SELECT (the
      credit gate at the database), profiles' 6-column UPDATE (not role, not credits)
      and alert_subscriptions' isActive. New permanent check:
      `node scripts/grants-test.mjs`, 27/27 — keep it as its own tally.
      `MEMORY.md` §39.4.
- [ ] **W3, still owed by the user: rotate the Supabase DB password** (it was pasted
      into a chat transcript), then update `DATABASE_URL`/`DIRECT_URL` in `.env.local`,
      `.dev.vars` and the Worker secrets.
- [x] **W4 — lender model.** `banks` → `lenders`, `bankId` → `lenderId`, a
      `"LenderType"` enum (bank/nbfc/arc/hfc) and a lender-type facet in search, done at
      12 listings rather than at 50,000. 69 identifiers across 21 files.
      Two things worth remembering: the PostgREST alias rename **type-checked clean
      while breaking every listing page at runtime** (the query result is cast, so tsc
      cannot see it), and the rename silently broke auto-detection of a real inventory
      file's "Bank" column — now covered by `HEADER_SYNONYMS` and asserted in the bulk
      self-check. `MEMORY.md` §39.5.
- [ ] **Decision needed: there is no admin UI for lenders** — no way to create one or
      set its type, so the NBFC/ARC/HFC facet stays empty until W-INGEST creates lenders
      from the real file. Pre-existing gap, newly visible. `MEMORY.md` §39.5.
- [ ] **W5 — R2 storage and PDF documents ⛔ BLOCKED.** R2 is not enabled on the
      Cloudflare account (`wrangler` returns code 10042) and enabling it needs a card,
      so it is a client conversation. Deliberately nothing was half-built — in
      particular no `wrangler.toml` bindings, which would break the CI deploy by naming
      buckets that do not exist. Supabase Storage was offered as a no-card alternative
      and declined: **R2 only**. `MEMORY.md` §39.6.
- [x] **W6 — Channel Partner portal.** Referral capture (`?ref=` → cookie → attributed
      at signup, both doors), commission accrual on the W2 grants at the client's
      confirmed 10% / 15%, a two-stage approve-then-pay flow, an admin panel for
      applications, tiers, commissions and payouts, and the 583-line invented-earnings
      mockup replaced with the partner's real data. Tier thresholds are stored as
      **null** until the client decides them — no invented numbers. Verified by a new
      15-assertion partner-isolation tally (kept separate from the 49 and the 23) and a
      10/10 live end-to-end run of the whole lifecycle. `MEMORY.md` §39.7.
- [ ] **Check `annual_price`:** the live setting is **₹2,999**, not the ₹999 in the spec
      — so a 10% commission earns ₹300. Fix in admin → Settings if ₹999 is intended.
- [x] **W7 — legal routes and contact wiring.** `/privacy` and `/terms` are live routes,
      linked from the footer (previously `href="#"`) and in the sitemap; build baseline
      is now **27/27** static pages. They carry no invented legalese — a wrong privacy
      policy is a liability, not a placeholder — so the client's copy pastes straight in.
      The Click-to-Chat generator in admin no longer shows a hardcoded `+91 98765 43210`
      and a fake wa.me link; it reads the configured number and says so when there is
      none. `NEXT_PUBLIC_CONTACT_EMAIL` added as a key to both env files.
      **W7.3 brand assets skipped** — not yet delivered, nothing blocked. `MEMORY.md` §39.8.
- [x] **W8 — lint runs, and the §36.5 defects are fixed.** `pnpm run lint` executes for
      the first time ever (eslint was never a dependency): 0 errors, 287 warnings, now
      part of the standing bar — the warning classes are recorded as debt in
      `MEMORY.md` §39.9 rather than hidden. The header Log In link preserves `?next=`;
      `bulkCommitListings` reports every row the database rejected instead of dropping it
      silently; the Alert Engine panel no longer claims real-time matching that does not
      exist. **Not done: the Worker bundle re-measure** — `opennextjs-cloudflare build`
      cannot run on this Windows machine (§5 gotcha #10), so the number must be read from
      the Workers Builds log. Last known: 2.74 MiB gzip against a 3 MB free cap, and that
      predates W2/W4/W6/W7.
- [ ] **Then STOP** — the inventory CSV gates everything after W8.

- [ ] **`font-mono` is broken the same way Satoshi was** — `--font-mono` asks for the
      literal `"Geist Mono"` but `next/font` emits a hashed family name, and
      `_geistMono` in `app/layout.tsx:10` is assigned and never used. Found during W0,
      deliberately not fixed there. `MEMORY.md` §39.1.
