# SPRINT_CALENDAR.md — Boliwala.com

> [!IMPORTANT]
> **🔄 UPDATE RULE:** On every code change and commit, the following files MUST be updated
> to reflect the current state: `MEMORY.md`, `project_calendar.html`, `SPRINT_CALENDAR.md`.
> Mark completed items, update dates, and move status indicators. This rule is canonical
> and repeated in `CLAUDE.md`, `MEMORY.md`, and `project_calendar.html`.

**Created:** 9 August 2026  
**Last Updated:** 9 August 2026  
**Launch date:** 🚀 **15 September 2026** — non-negotiable  
**Source of truth:** `boliwala_features.txt` (URD v2.0) + `SCOPE_AUDIT.md` + `MEMORY.md`

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

## Part 2 — Sprint Plan: 10 Aug → 15 Sep Launch

### 🔴 NON-NEGOTIABLE PREREQUISITE

**All blocked credentials MUST arrive by 17 August.** Without them, the 15 Sep date is impossible.

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

**Status:** 🟢 UNBLOCKED — start immediately  
**Duration:** 1 week

| # | Task | URD Ref | Status |
|---|---|---|---|
| 6.1 | Profile — **My Alerts tab**: wire to `alert_subscriptions`, show saved search criteria, manage/delete | §3.2 Tab 2 | `[ ]` |
| 6.2 | Profile — **My Details tab** full build: add `city`, `panNumber`, `aadhaarNumber`, `preferences` columns + form fields | §3.2 Tab 6 | `[ ]` |
| 6.3 | `/search` **email-alerts banner**: wire to `alert_subscriptions` with filter-to-JSON mapping | §2.2 | `[ ]` |
| 6.4 | **Protect `/partner/dashboard`**: add auth guard (redirect guests to `/login`) | §4 / Security | `[ ]` |
| 6.5 | **Dead code cleanup**: remove `components/projects.tsx` + unreferenced images | Debt | `[ ]` |
| 6.6 | **Data audit**: fix `flatNumber`/`addressLine` overlap on Jaipur listing | Debt | `[ ]` |
| 6.7 | **DB password rotation** | Security | `[ ]` |

**Verify:** `tsc --noEmit` clean · `pnpm build` clean · leak test + access matrix pass · Profile My Alerts real

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

### Week 3 (24–30 Aug) — Sprint 7 + Sprint 8 + Sprint 5.5 (Parallel)

**Duration:** Sprint 3.5 wraps up early this week. Three sprints run in parallel.

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

**Verify:** All admin tabs show real data · all 6 profile tabs real · Privacy/Terms render · footer links work · real contact info

---

### Week 4 (31 Aug–6 Sep) — Sprint 10 + Sprint 11 (Parallel)

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

#### Sprint 11 — CP Creatives & WhatsApp

| # | Task | URD Ref | Status |
|---|---|---|---|
| 11.1 | **Co-Branded Creatives**: auto-personalized (partner name/phone/link), 4 formats | §4.4 | `[ ]` |
| 11.2 | Admin **Creative Templates Management**: upload base templates, auto-personalize | §5.11 | `[ ]` |
| 11.3 | Partner **creatives gallery** `/channel-partner/creatives` | §4.4 | `[ ]` |
| 11.4 | **WhatsApp Phase 1**: click-to-chat links, manual alert queue, segment export | §6.6 | `[ ]` |
| 11.5 | Admin **WhatsApp Tools panel** | §6.7 | `[ ]` |

**Verify:** Partner can sign up, get approved, log in · commissions calculate · referral tracking works · co-branded templates render properly.

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

### Week 6 (16 Sep onwards) — Post Launch Phase 2

#### Sprint 12 — Mobile

| # | Task | URD Ref | Status |
|---|---|---|---|
| 12.1 | **PWA enhancement**: service worker for offline shell, install prompt | — | `[ ]` |
| 12.2 | **Push notifications** setup (if PWA) | — | `[ ]` |
| 12.3 | **Or Capacitor APK** build if client requires native app | — | `[ ]` |

---

## Part 3 — Timeline at a Glance

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  WEEK 1 │  WEEK 2 │  WEEK 3 │  WEEK 4 │  WEEK 5   │ 15 SEP │  WEEK 6        │
│ 10–16   │ 17–23   │ 24–30   │ 31–6    │ 7–14      │ LAUNCH │ 16–22 Post-L.  │
├─────────┼─────────┼─────────┼─────────┼───────────┼────────┼────────────────┤
│Sprint 6 │Sprint3.5│Spr3.5fin│Sprint 10│Sprint 9   │  🚀    │ Sprint 12      │
│Profile  │Razorpay │Sprint 7 │Chan.Part│Mktg+Eng   │LAUNCH  │ Mobile App     │
│  Debt   │────────►│Admin Fin│Sprint 11│──────────►│        │                │
│         │Sprint4.5│Sprint 8 │Creatives│Sprint 13  │        │                │
│         │Email    │Spr 5.5  │+ WA     │QA+Deploy  │        │                │
│         │         │Content  │         │           │        │                │
└─────────┴─────────┴─────────┴─────────┴───────────┴────────┴────────────────┘
```

## Part 4 — Client Deadlines (Hard)

| Date | What | Consequence if missed |
|---|---|---|
| **10 Aug** | Start Sprint 6 | Every day lost = day off QA |
| **17 Aug** | Razorpay test keys + Resend API key | **Launch slips day-for-day** |
| **24 Aug** | Privacy/Terms copy, contact number, WhatsApp, headline stats | Content pages won't exist at launch |
| **31 Aug** | Brand assets (logo, favicon, OG image) | Launches with placeholder branding |
| **7 Sep** | Production domain + Razorpay live KYC complete | Cannot do production cutover |
| **11 Sep** | All code complete — QA freeze | No new features after this date |
| **15 Sep** | 🚀 **LAUNCH** | — |
