# SCOPE_AUDIT.md — Boliwala.com

**Created:** 9 August 2026  
**Purpose:** Deep audit comparing what the AI agent *thinks* the scope is (as represented in `project_calendar.html`) versus the *actual* full scope from `boliwala_features.txt` (URD v2.0), `MEMORY.md`, and the prototype HTMLs (`boliwala-admin-v3.html`, `channel-partner-dashboard.html`).

---

## 1. Environment Variables Audit

### What Vercel currently has (from screenshot)

| Variable | Status |
|---|---|
| `DATABASE_URL` | ✅ Set |
| `DIRECT_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ Set |

### What `.env.local` has that Vercel is MISSING

> [!CAUTION]
> These must be added to Vercel before any production deployment works. The app will crash or silently fail without them.

| Variable | Why It's Needed | Priority |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Critical.** Every admin operation, view-count tracking, listing unlocks, and image upload use this to bypass RLS. Without it, the admin panel is dead and unlocks fail. | 🔴 Add now |
| `NEXT_PUBLIC_SITE_URL` | SEO canonicals, sitemap, OG URLs, and auth callback redirect. Currently `http://localhost:3000` — must be the production URL on Vercel (e.g. `https://boliwala.com` or the Vercel `.vercel.app` URL). | 🔴 Add now |

### Variables that exist in `.env.local` but are EMPTY (not needed on Vercel yet)

| Variable | Status | When Needed |
|---|---|---|
| `RAZORPAY_KEY_ID` | Empty | When Sprint 3.5 (Payments) is built |
| `RAZORPAY_KEY_SECRET` | Empty | When Sprint 3.5 is built |
| `RAZORPAY_WEBHOOK_SECRET` | Empty | When Sprint 3.5 is built |
| `RESEND_API_KEY` | Empty | When Sprint 4.5 (Email) is built |
| `RESEND_FROM_EMAIL` | Empty | When Sprint 4.5 is built |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Empty | Before launch (content blocker) |
| `NEXT_PUBLIC_CONTACT_PHONE` | Empty | Before launch (content blocker) |

### Extra variables in `.env.local` — likely NOT needed on Vercel

| Variable | Notes |
|---|---|
| `SUPABASE_ANON_PUBLIC_KEY` | Duplicate of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — no app code references this name |
| `SUPABASE_URL` | Duplicate of `NEXT_PUBLIC_SUPABASE_URL` — no `NEXT_PUBLIC_` prefix so not usable client-side; no server code references it either |
| `SUPABASE_PUBLISHABLE_KEY` | Same — duplicate without `NEXT_PUBLIC_` prefix |
| `SUPABASE_SECRET_KEY` | Unclear purpose — possibly a duplicate of `SUPABASE_SERVICE_ROLE_KEY` |
| `SUPABASE_JWKS_URL` | Not referenced by any app code |
| `GOOGLE_OAUTH_CLIENT_ID` | **Not needed on Vercel.** The app never reads this — Supabase's dashboard holds its own copy and handles the Google OAuth flow server-side. Kept in `.env.local` for documentation only. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Same as above — Supabase uses its own stored copy. |
| `GOOGLE_OAUTH_JSON_FILE_PATH` | Local filesystem path — absolutely should NOT go on Vercel |

> [!TIP]
> **Summary: Add 2 variables to Vercel now** (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`). The Google OAuth creds are handled entirely by Supabase's dashboard — the app never reads them. The rest are either empty (blocked) or duplicates.

---

## 2. What the Calendar Thinks the Scope Is

`project_calendar.html` covers **six workstreams** from 10 Aug → 15 Sep:

| # | Workstream | Calendar Description |
|---|---|---|
| 1 | Cleanup & hardening | Debt sprint — data audit, dead code, profile fields, partner route, rotate DB password |
| 2 | Payments — Sprint 3.5 | Razorpay build (blocked on test keys) |
| 3 | Email — Sprint 4.5 | Transactional email via Resend (blocked on API key + DNS) |
| 4 | Admin completion | Real admin tabs: Packages, Payments, Success Fees, Users, Partners |
| 5 | Content & legal | Privacy/Terms routes, real statistics, contact number, WhatsApp link |
| 6 | Domain, brand, cutover + QA & release | Domain cutover, brand assets, final regression, launch |

**What the calendar scopes as "done" (Delivered section — 10 sprint cards):**
Sprints 0, 1, 1.5, 2, 2.1, 2.5, 2.7, 3, 4, 5

---

## 3. What the ACTUAL Full Scope Is (from `boliwala_features.txt` URD v2.0)

The URD defines **8 major sections**. Here's each one mapped against what's built and what the calendar covers:

### §1 — Business Model
| Feature | Built? | In Calendar? |
|---|---|---|
| Free browse — all listings, no signup | ✅ Yes | — (shipped) |
| 5 free credits on signup | ✅ Yes | — |
| ₹999/year subscription — unlimited unlocking | ❌ No payment code exists | ✅ Sprint 3.5 |
| ₹9,999 + 1% per-auction service package | ❌ No payment code exists | ✅ Sprint 3.5 |

### §2 — Public Website Pages
| Feature | Built? | In Calendar? |
|---|---|---|
| Homepage (hero, screener, city grid, alerts) | ✅ Yes | — |
| Search Results (filters, pagination, cards) | ✅ Yes | — |
| Individual Listing Page (4 gated states) | ✅ Yes | — |
| Pricing Page (live from settings) | ✅ Yes | — |
| Services Page (live from settings) | ✅ Yes | — |
| Channel Partner Program Page (enrolment form) | ✅ Form submits | — |
| Contact Page | ✅ Yes | — |
| About Page | ⚠️ Has unverified statistics | ✅ Content & legal |
| **Privacy Policy page** | ❌ `href="#"` — no route exists | ✅ Content & legal |
| **Terms of Service page** | ❌ `href="#"` — no route exists | ✅ Content & legal |

### §3 — Authentication & User Accounts
| Feature | Built? | In Calendar? |
|---|---|---|
| Sign up / Login (email + password) | ✅ Yes | — |
| Google OAuth | ✅ Yes (Sprint 2.5) | — |
| Password reset | ✅ Yes | — |
| Profile — Shortlisted Properties tab | ✅ Yes | — |
| Profile — My Alerts tab | ❌ **Still mock cards** | ❌ **NOT IN CALENDAR** |
| Profile — My Services tab (4-step progress) | ❌ **Still mock** | ❌ **NOT IN CALENDAR** |
| Profile — My Subscription tab | ❌ **Not built** | ❌ **NOT IN CALENDAR** |
| Profile — My Reports tab (admin documents) | ❌ **Not built** | ❌ **NOT IN CALENDAR** |
| Profile — My Details tab (full personal info) | ⚠️ Partial (name/phone only; city/PAN/Aadhaar inert) | ❌ **NOT IN CALENDAR** |

### §4 — Channel Partner Portal ⚠️ MAJOR GAP
| Feature | Built? | In Calendar? |
|---|---|---|
| Partner Signup & Onboarding flow | ❌ Enrolment form submits but no CP account/login | ❌ **NOT IN CALENDAR** |
| Dashboard & Earnings (5 KPI cards) | ❌ **Static HTML prototype only** (`channel-partner-dashboard.html`) | ❌ **NOT IN CALENDAR** |
| Referral Link & Unlimited Invites | ❌ Not built | ❌ **NOT IN CALENDAR** |
| Co-Branded Marketing Creatives | ❌ Not built | ❌ **NOT IN CALENDAR** |
| Commission Rates & Payouts ledger | ❌ Not built | ❌ **NOT IN CALENDAR** |

> [!WARNING]
> **The entire Channel Partner Portal (§4 — 5 subsections) is absent from the calendar.** The `channel-partner-dashboard.html` prototype shows a full dashboard with: earnings breakdown, referral link, invite system, referral tracking table, and co-branded creative gallery. None of this is in any sprint plan. `/partner/dashboard` exists in the app but is a **completely static mockup with no auth guard** — it's publicly accessible to anyone.

### §5 — Admin Backend Panel
| Feature | Built? | In Calendar? |
|---|---|---|
| Dashboard (8 KPI cards, real queries) | ✅ Yes | — |
| Listings Management (CRUD, search, filter) | ✅ Yes | — |
| Image upload | ✅ Yes | — |
| Bulk Excel upload | ✅ Yes | — |
| Callback Requests (status workflow) | ✅ Yes | — |
| Settings — Pricing Controls (4 fields) | ✅ Yes | — |
| Package Purchases (₹9,999 engagements) | ❌ Mock | ✅ Admin completion (Week 5) |
| Service Pipeline (4-step progress) | ❌ **Not built** | ❌ **NOT IN CALENDAR** |
| Report & Document Upload (for ₹9,999 packages) | ❌ **Not built** | ❌ **NOT IN CALENDAR** |
| Finance — Payments tab | ❌ Mock | ✅ Admin completion |
| Finance — Subscriptions tab | ❌ Mock | ✅ Admin completion (implied) |
| Finance — Success Fee Tracker | ❌ Mock | ✅ Admin completion |
| Users tab (full table + filters) | ❌ Mock | ✅ Admin completion |
| Channel Partners tab (approve/reject/tier) | ❌ Mock | ✅ Admin completion |
| **Commission Settings (3 editable rates)** | ❌ **Not built** | ❌ **NOT IN CALENDAR** |
| **Creative Templates Management** | ❌ **Not built** | ❌ **NOT IN CALENDAR** |
| Recent Activity feed | ❌ Mock | ❌ Not explicitly in calendar |
| Revenue chart | ❌ Mock | ❌ Not explicitly in calendar |

### §6 — Marketing & User Engagement
| Feature | Built? | In Calendar? |
|---|---|---|
| Property Match Alerts (real-time trigger) | ❌ Capture only — no send engine | ❌ **NOT IN CALENDAR** |
| Email Lifecycle (10 templates) | ❌ Not built | ✅ Sprint 4.5 covers basics only |
| Credit Lifecycle nudges | ❌ Not built | ❌ **NOT IN CALENDAR** |
| Subscription Lifecycle (renewals, win-back) | ❌ Not built | ❌ **NOT IN CALENDAR** |
| Cross-Sell (₹999 → ₹9,999) | ❌ Not built | ❌ **NOT IN CALENDAR** |
| WhatsApp Strategy (Phase 1 + 2) | ❌ Click-to-chat only (link present, no automation) | ❌ **NOT IN CALENDAR** |
| Admin Engagement Tools (Alert Engine, Campaigns, Segments) | ❌ All mock | ❌ **NOT IN CALENDAR** |

### §7/§8 — Technology & Requirements
| Requirement | Status | In Calendar? |
|---|---|---|
| Fully responsive | ✅ Mostly (Sprint 5 QA) | — |
| SEO optimized with SSR | ✅ Sprint 5 | — |
| Indian formatting (₹, lakh/crore) | ✅ Yes | — |
| No hardcoded prices | ✅ Yes (live from settings) | — |
| View counts are real | ✅ Yes (deduped) | — |
| **Capacitor / Mobile APK** | ❌ **Not mentioned anywhere** | ❌ **NOT IN CALENDAR** |

---

## 4. The Diff: What's Missing from the Calendar

> [!CAUTION]
> **22 features from the URD are neither built nor represented in the calendar.** These are entirely unscoped — no sprint, no timeline, no mention.

### 🔴 Major Unscoped Items

| # | Feature (URD Section) | Effort Estimate | Dependency |
|---|---|---|---|
| 1 | **Channel Partner Portal — full build** (§4.1–4.5: onboarding, dashboard, earnings, referral links, invite system, creatives gallery, commission payouts) | 2–3 weeks | Payments (Sprint 3.5) must exist first for commission tracking |
| 2 | **Channel Partner auth system** — separate login for partners, distinct from user auth | 1 week | Decision needed: same `profiles.role` or separate table? |
| 3 | **Profile — My Alerts tab** (saved search criteria, manage/delete) | 2–3 days | Alert subscriptions table already exists |
| 4 | **Profile — My Services tab** (4-step progress tracker per ₹9,999 package) | 3–5 days | Payments + Service Pipeline admin |
| 5 | **Profile — My Subscription tab** (current tier, expiry, renewal) | 2–3 days | Payments |
| 6 | **Profile — My Reports tab** (admin-uploaded documents per package) | 3–5 days | Admin Report Upload |
| 7 | **Profile — My Details** full build (city, PAN, Aadhaar, preferences) | 1–2 days | Schema changes needed |
| 8 | **Admin — Service Pipeline** (§5.5: 4-step progress tracking) | 3–5 days | Payments |
| 9 | **Admin — Report & Document Upload** (§5.6: upload per package) | 3–5 days | Supabase Storage + Package schema |
| 10 | **Admin — Commission Settings** (§5.10: 3 editable rates, audit-logged) | 2–3 days | Channel Partner build |
| 11 | **Admin — Creative Templates Management** (§5.11: upload/manage base templates) | 1 week | Channel Partner build |
| 12 | **Property Match Alert Engine** (§6.1: real-time trigger on new listings) | 1 week | Resend (Sprint 4.5) |
| 13 | **Email Lifecycle — full 10 templates** (§6.2) | 1 week | Resend |
| 14 | **Credit Lifecycle nudges** (§6.3: soft nudge, paywall, social proof) | 3–5 days | Resend |
| 15 | **Subscription Lifecycle** (§6.4: receipts, renewal reminders, win-back) | 3–5 days | Payments + Resend |
| 16 | **Cross-Sell flow** (§6.5: ₹999 → ₹9,999 nudge) | 2–3 days | Both tiers must exist |
| 17 | **WhatsApp Phase 1** (§6.6: manual alert queue, export segments) | 3–5 days | Admin engagement tools |
| 18 | **Admin Engagement Tools** (§6.7: Alert Engine panel, Email Campaigns, WhatsApp Tools, Segments & Export, Analytics) | 2–3 weeks | Resend + WhatsApp |
| 19 | **Capacitor APK build** | 1–2 weeks | Full responsive QA first |
| 20 | **Admin Activity Feed** (real, from `admin_audit_log`) | 2–3 days | Audit log writes throughout |
| 21 | **Admin Revenue Chart** (real 8-month chart) | 2–3 days | Payments |
| 22 | **`/search` email-alerts banner** (wiring to `alert_subscriptions`) | 1–2 days | — |

**Conservative total estimate for unscoped work: 10–16 additional weeks of development.**

---

## 5. Access & Login Guide

### 5.1 How to Access the Admin Panel

1. **URL:** `http://localhost:3000/admin` (or production URL `/admin`)
2. **There is NO self-service admin signup.** You must promote a user via SQL:
   ```sql
   UPDATE profiles SET role='admin' WHERE email='your-email@example.com';
   ```
   Run this via the Supabase SQL editor or `node scripts/apply-sql.mjs`.
3. **The `ops@nesora.co.in` account** already exists in the live DB (Hriday Kampani's account, created via Google OAuth). Promote this account if not already admin.
4. **Access control verified:**
   - Guest → redirects to `/login`
   - Signed-in non-admin → redirects to `/`
   - Admin → Dashboard loads

### 5.2 What's Real vs Mock in Admin

| Tab | Status |
|---|---|
| Dashboard (KPIs) | ✅ Real queries |
| Listings | ✅ Full CRUD |
| Callbacks | ✅ Real workflow |
| Settings (Pricing) | ✅ Real, propagates to public pages |
| Packages | ❌ Static mock data |
| Payments | ❌ Static mock data |
| Success Fees | ❌ Static mock data |
| Users | ❌ Static mock data |
| Partners | ❌ Static mock data |
| Alerts | ❌ Static mock data |
| Email Campaigns | ❌ Static mock data |
| WhatsApp Tools | ❌ Static mock data |
| Segments | ❌ Static mock data |
| Engagement Analytics | ❌ Static mock data |

### 5.3 How to Access User Pages

1. **Sign up:** Go to `/signup` — email/password or Google OAuth
2. **Login:** Go to `/login`
3. **Profile:** `/profile` (redirects to `/login` if not signed in)
4. **Test account:** `ops@nesora.co.in` — do NOT delete this account

### 5.4 How to Access Channel Partner Dashboard

1. **URL:** `/partner/dashboard`
2. **⚠️ WARNING: This is a static mockup with NO auth guard.** Anyone can access it.
3. There is no channel partner login system. The enrolment form at `/partner` submits to `channel_partner_applications` but there is no account creation, no approval flow that gives access, and no separate auth for partners.
4. The `channel-partner-dashboard.html` prototype shows what it *should* look like when built — it's a reference file only, not functional code.

---

## 6. Capacitor APK — Not Scoped Anywhere

> [!IMPORTANT]
> Capacitor/mobile APK is not mentioned in any sprint plan, the calendar, `MEMORY.md`, or `boliwala_features.txt`. It is entirely absent from the project scope.

### What building a Capacitor APK would require:

1. **Capacitor setup:** `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
2. **Next.js static export:** Capacitor wraps a static site. Next.js SSR features (server components, server actions, `generateMetadata`) would need rethinking. The current app is **heavily server-component-based** — almost every page uses server-side data fetching.
3. **Alternatives to consider:**
   - **PWA (Progressive Web App):** Manifest already exists (Sprint 5). Add a service worker for offline and "Add to Home Screen". Much less work.
   - **WebView wrapper:** Simpler than Capacitor but limited native features.
   - **React Native / Expo:** Complete rewrite, not viable for this timeline.
4. **Estimated effort:** 1–2 weeks minimum for Capacitor, assuming you solve the SSR→static export problem (which is non-trivial for this codebase).

---

## 7. Summary: Calendar vs Reality

| Metric | Calendar Says | Reality |
|---|---|---|
| Sprints remaining | 2 (3.5 + 4.5 + admin completion + content + QA) | 2 sprints covers **only** payments, basic email, some admin tabs, and content — ignoring 22 features |
| Weeks to launch | 6 (by 15 Sep) | 6 weeks could cover the calendar's scope **if** Razorpay keys arrive by 17 Aug. Full URD scope is 10–16 weeks beyond that. |
| Channel Partner Portal | Not mentioned (only "Partner route" cleanup) | Full §4 of URD (5 subsections, 51KB prototype) — 2–3 weeks of work |
| User Profile completion | Not mentioned | 5 tabs still mock or missing — 2–3 weeks |
| Marketing & Engagement | Sprint 4.5 covers basic email only | URD §6 has 7 subsections, mostly unscoped — 4–6 weeks |
| Capacitor APK | Not mentioned anywhere | 1–2 weeks, significant architectural questions |
| Admin panel full build | "Real admin tabs" in 1 week (Week 5) | 11 mock tabs + 3 unscoped features — realistically 3–4 weeks |

---

## 8. Prompt to Update `project_calendar.html` to Actual Scope

> [!IMPORTANT]
> **Do NOT execute this yet.** This is the prompt to use when you're ready to update the visual calendar. Copy this into a new conversation or use it as a follow-up instruction.

```
UPDATE project_calendar.html to reflect the ACTUAL full scope from boliwala_features.txt (URD v2.0).

The current calendar only covers 6 workstreams for the 10 Aug – 15 Sep window.
It is missing 22 features. Here is what must change:

## 1. Update the masthead statistics
- Change "2 Sprints remaining" → actual number based on new scope
- Change "37 Days to launch" → "Scope TBD" or recalculate
- Add a new tile: "22 Unscoped features" (red)

## 2. Add these MISSING workstreams to the Gantt chart:

### Channel Partner Portal (§4, URD)
- Blocked on: Payments (Sprint 3.5) + Partner auth design decision
- Estimated: 2–3 weeks
- Sub-items: CP auth system, dashboard & earnings, referral link/invites, co-branded creatives, commission payouts
- Reference prototype: channel-partner-dashboard.html

### User Profile Completion (§3.2, URD)
- My Alerts tab (wire to alert_subscriptions)
- My Services tab (4-step progress, needs Payments)
- My Subscription tab (needs Payments)
- My Reports tab (needs Admin Report Upload)
- My Details full build (schema changes for city/PAN/Aadhaar)
- Estimated: 2–3 weeks total

### Admin Panel — Full Build (remaining §5 items)
- Service Pipeline (§5.5)
- Report & Document Upload (§5.6)
- Commission Settings (§5.10)
- Creative Templates Management (§5.11)
- Real Activity Feed (needs audit log writes)
- Real Revenue Chart (needs payments)
- Estimated: 3–4 weeks

### Marketing & Engagement Engine (§6, URD)
- Property Match Alert Engine (real-time trigger)
- Email Lifecycle (full 10 templates)
- Credit Lifecycle nudges
- Subscription Lifecycle
- Cross-Sell flow
- WhatsApp Phase 1
- Admin Engagement Tools (5 sub-features)
- Estimated: 4–6 weeks total
- Blocked on: Resend + Payments

### Capacitor / Mobile APK
- Not in URD but requested by client
- Needs architectural decision (SSR → static export problem)
- Estimated: 1–2 weeks
- Blocked on: Full responsive QA

## 3. Update the "Client Deadline Gates" section
- Add a new gate: "Scope Decision — by 17 August"
  Items: Channel Partner portal in/out, Capacitor in/out, which profile tabs are launch-critical, which marketing features are launch-critical
- This is the MOST IMPORTANT gate because it determines whether the 15 Sep date is realistic

## 4. Update the "Critical Path" section
- The current critical path is: Razorpay → Sprint 3.5 → admin → launch
- The REAL critical path depends on the scope decision:
  - Minimal launch (current calendar scope): Razorpay → 3.5 → admin → QA → launch (6 weeks, achievable by 15 Sep)
  - Full URD scope: 15 Sep is not achievable. Realistic date: late October to mid-November 2026.
  - Middle ground: Launch free tier + admin by 15 Sep, paid tiers + CP portal as Phase 2

## 5. Add a "Phase 2 Backlog" section after the Gantt
Show everything that doesn't fit in the 15 Sep window as a post-launch roadmap.

## 6. Keep the existing "Delivered" section unchanged — it's accurate.

## 7. Styling
- Keep the existing shadcn token palette and design language
- New workstream rows should use the same bar styles (blocked/scheduled/waiting)
- Add a new bar style for "unscoped" — a distinct visual (e.g., grey with question-mark pattern)
```

---

## 9. Recommendations

1. **Scope decision is the #1 priority** — before any more building, decide what "launch" means:
   - **Option A: Minimal launch (15 Sep achievable)** — current calendar scope. Free browse, paid via Razorpay, basic admin, basic email. Channel Partner portal, engagement engine, Capacitor APK are Phase 2.
   - **Option B: Full URD launch (late Oct–mid Nov)** — everything in `boliwala_features.txt`. Realistic only if Razorpay + Resend keys arrive within a week.
   - **Option C: Phased launch** — launch free tier + admin on 15 Sep (no payments needed), then paid tiers, then CP portal, then engagement.

2. **Add the 4 missing env vars to Vercel immediately** — the production deploy is broken without them regardless of scope.

3. **Protect `/partner/dashboard`** — it's currently a publicly accessible mockup with no auth guard. Either add an auth guard or remove the route.

4. **The Capacitor question needs an architectural answer first** — the current Next.js app is server-component-heavy. Capacitor wraps static files. These are fundamentally incompatible without significant refactoring. A PWA (service worker + manifest, which is partially built) is the pragmatic mobile solution.
