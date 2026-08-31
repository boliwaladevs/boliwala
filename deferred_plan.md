# DEFERRED_PLAN.md — Boliwala.com Post-Launch Execution Plan

**Created:** 31 August 2026  
**Scope:** Everything that ships after launch. These are real items, not nice-to-haves — they are deferred because they either depend on launch data or are not blocking day-one revenue.  
**Companion:** `immediate_plan.md` (pre-launch items)

---

## Workstream D1 — Auction History + Price-Drop Badges (S6)

**Depends on:** `immediate_plan.md` Workstream 6 (bulk ingest with expiry)  
**Priority:** High — FindAuction's best feature, our biggest feature gap

### What it is
When a listing's auction date passes without a sale, the property goes to re-auction with a (usually lower) reserve price. Tracking this history across cycles is FindAuction's strongest feature — they show 17 prior auctions per property.

### Build
- [ ] **Property identity key** — fuzzy-match across auction cycles using lender + address + borrower
- [ ] **`auction_history`** table: `propertyId`, `auctionDate`, `reservePrice`, `emdAmount`, `status` (sold/expired/cancelled)
- [ ] **Expired listings** feed the history corpus (from Workstream 6.4's daily expiry)
- [ ] **Price-drop badge** on search cards — "↓ 15% from last auction"
- [ ] **Re-auction badge** — "2nd Attempt" / "3rd Attempt"
- [ ] **History timeline** on listing page — every prior auction with date, reserve price, outcome
- [ ] **Average discount computation** — real "savings" figure replacing the removed "28% average saving"

**Done when:** A property that appears in two consecutive CSV files shows a timeline, a price-drop badge, and a re-auction count. Figures are provably correct against the source data.

---

## Workstream D2 — Search Field Expansion (S7 remainder)

**Depends on:** `immediate_plan.md` Workstream 4 (lender model) + Workstream 6 (data with new fields)  
**Priority:** Medium — parity with FindAuction's search

> [!NOTE]
> **Popularity sort + ₹/sq.ft are already done** (overnight loop, MEMORY §34.6). This covers only the remaining S7 items.

### Build
- [ ] **Borrower name** as a searchable field (for professionals tracking specific defaults)
- [ ] **Auction date range filter** — "auctions this week" / "next 30 days" / custom range
- [ ] **Bid increment** — display on listing page and optionally filter
- [ ] **EMD deadline as a filter** — "EMD closing in 3 days" as a nudge/sort
- [ ] **Building / society name** as structured field (not just in address string)
- [ ] **Constructive Possession** as 3rd possession type (beyond physical/symbolic)
- [ ] Schema migrations for new columns
- [ ] Bulk ingest updated to map new fields from CSV

**Done when:** All new fields render on listing pages. Filters work in search. Bulk ingest populates them from source data.

---

## Workstream D3 — Mobile Apps (Play Store + App Store)

**Depends on:** Stable production site on `boliwala.com`  
**Priority:** High — re-engagement channel

> [!WARNING]
> This is **NOT a PWA**. Client wants APK on Play Store and app on App Store.

### Options (evaluate in order of effort)

#### Option A — TWA (Trusted Web Activity) for Android + WebView for iOS
- **Android:** TWA wraps the PWA in an APK with full-screen, no browser chrome
- **iOS:** WKWebView wrapper with native navigation shell
- **Effort:** ~1-2 weeks
- **Pros:** Single codebase (the web app), cheapest path, automatic feature parity
- **Cons:** Limited native API access, Apple may reject thin wrappers

#### Option B — Capacitor (Ionic)
- **Both platforms:** Wraps the Next.js frontend in a native shell
- **Effort:** ~2-3 weeks
- **Pros:** Full native API access (push notifications, camera, biometrics), single JS codebase
- **Cons:** Needs API route handlers alongside server actions (MEMORY §25), build complexity
- **Note:** ROADMAP D11 flagged this — decide before building more frontend

#### Option C — React Native (separate app)
- **Both platforms:** Dedicated mobile codebase
- **Effort:** ~6-8 weeks
- **Pros:** True native performance, best UX
- **Cons:** Separate codebase, duplicate effort, maintenance burden

### Build (whichever option)
- [ ] **Android APK** — signed, uploaded to Google Play Console
- [ ] **iOS app** — Xcode project, submitted to App Store Connect
- [ ] **Push notifications** — Firebase Cloud Messaging (Android), APNs (iOS)
- [ ] **Deep linking** — `boliwala.com/listing/xxx` opens in app if installed
- [ ] **Offline indicator** — graceful "no connection" state
- [ ] **App Store assets** — screenshots, description, privacy policy URL
- [ ] **Play Store assets** — same, plus content rating questionnaire

### Recommendation
**Start with Option A (TWA + WebView).** It ships in days, not weeks, and gives you a real Play Store/App Store presence immediately. If Apple rejects the iOS wrapper, fall back to Capacitor for iOS only. React Native is not justified until the feature set diverges from web.

**Done when:** APK on Play Store, app on App Store, both functional, push notifications working.

---

## Workstream D4 — Razorpay Self-Serve Payments (ROADMAP Item 12)

**Depends on:** "Contact Sales" flow proving demand (immediate_plan.md Workstream 2)  
**Priority:** Medium — manual billing works for month one

### Build
- [ ] **Razorpay integration** — test keys first, then production
- [ ] **₹999 subscription checkout** — Razorpay Subscriptions API or one-time payment
- [ ] **₹9,999 service package checkout** — one-time payment
- [ ] **Webhook handler** — payment.captured, subscription.charged, refund events
- [ ] **Entitlement flow** — successful payment → auto-grant subscription/credits
- [ ] **Failure/retry** — handle payment failures, retry logic, grace periods
- [ ] **Admin: Payments dashboard** wired to real Razorpay data
- [ ] **Receipt/invoice generation** — email receipt on payment
- [ ] **Refund flow** — admin-initiated refunds
- [ ] **Success fee collection** — 1% of auction win, invoiced post-success
- [ ] **Grandfathering** — existing Contact-Sales customers keep their manually-granted entitlements

### Environment
- [ ] Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in `.env.local` + Cloudflare
- [ ] Test mode first, production after verification

**Done when:** A customer can pay ₹999 from `/pricing`, subscription auto-activates, payment appears in admin. Webhook handles all edge cases. Test + production modes both verified.

---

## Workstream D5 — Marketing Engine (ROADMAP Item 13)

**Depends on:** `immediate_plan.md` Workstream 6 (real listings to alert about)  
**Priority:** High — retention and re-engagement

### 5.1 — Email service
- [ ] **Resend integration** — API key, verified domain, from address
- [ ] **10 transactional templates** (from URD §6):
  1. Welcome + credit balance
  2. Property unlock confirmation
  3. Alert match notification (real-time)
  4. Credit balance low (2 remaining)
  5. Credits exhausted + upgrade CTA
  6. Subscription confirmation
  7. Subscription expiry warning (7 days)
  8. Service package purchase confirmation
  9. Password reset (already via Supabase, but branded)
  10. Account deletion confirmation

### 5.2 — Alert delivery
- [ ] **Wire `alert_subscriptions`** to actual sending
- [ ] On listing publish: match against all active alerts → send email/push
- [ ] Respect frequency preference (instant/daily/weekly, already in schema)
- [ ] Unsubscribe via signed token in footer
- [ ] Rate limiting — max N emails per user per day

### 5.3 — Credit lifecycle nudges
- [ ] 2 credits remaining → soft nudge (in-app banner)
- [ ] Last credit → paywall alert (email + in-app)
- [ ] 3 days since credits exhausted + no purchase → social proof email
- [ ] 3+ unlocks → offer ₹9,999 service package (cross-sell trigger)

### 5.4 — Push notifications
- [ ] Web push via service worker (for web users)
- [ ] FCM for Android app, APNs for iOS app
- [ ] Notification preferences in profile

**Done when:** All 10 email templates send correctly. Alerts fire on new listing publish. Credit nudges trigger at the right thresholds. Push notifications reach mobile users.

---

## Workstream D6 — Out-Build (ROADMAP S10)

**Depends on:** Large inventory + stable platform  
**Priority:** Low initially, escalates as inventory grows

### 6.1 — Compare properties
- [ ] Select 2-4 properties from search results or shortlist
- [ ] Side-by-side comparison table (price, area, location, EMD, auction date)
- [ ] Shareable comparison URL

### 6.2 — Map view
- [ ] Map-based property discovery (Mapbox or Google Maps)
- [ ] Locality clustering for dense areas
- [ ] Filter-integrated (same filters as list view)
- [ ] Pin click → property card popup

### 6.3 — Bid-budget calculator
- [ ] Input: budget, desired area, target city
- [ ] Output: "You can afford X-Y sq ft in {city}" based on current reserve prices
- [ ] EMD requirement calculator
- [ ] Stamp duty + registration estimate

### 6.4 — Calendar integration
- [ ] "Add to Calendar" button on listing page
- [ ] `.ics` file download with auction date, address, EMD deadline
- [ ] Google Calendar deep link

### 6.5 — Mega-auction event pages
- [ ] When a bank announces 50+ properties in one auction
- [ ] Dedicated event page with all properties, countdown, bank details
- [ ] Notification to relevant alert subscribers

### 6.6 — Hindi + regional languages
- [ ] Hindi first (largest buyer base)
- [ ] Then Marathi, Tamil, Telugu based on inventory distribution
- [ ] i18n framework (next-intl or similar)
- [ ] Listing descriptions in source language (not machine-translated — or flagged if so)
- [ ] URL structure: `/hi/auctions/pune` or subdomain

**Done when:** Each feature ships independently, verified, and accessible from existing navigation.

---

## Workstream D7 — Vector / Semantic Search (ROADMAP S8)

**Depends on:** `immediate_plan.md` W-INGEST — a meaningful corpus. Embeddings over 12 listings prove nothing.
**Priority:** Low pre-launch, high once inventory lands
**Moved here:** 31 Aug 2026, from `immediate_plan.md` Workstream 7.4

> [!NOTE]
> **Why this is not a pre-launch item.** `REALITY_CHECK.md` §7 places semantic search
> in **Tier 4 — differentiators that win the market**, after inventory, payments,
> legal and parity. It was sitting in the pre-launch plan, which contradicted that.
> It is a genuine differentiator against FindAuction's keyword-only search — it is
> just not what stands between the product and a launch.

### Build
- [ ] Enable the `pgvector` extension in Supabase
- [ ] Add an `embedding vector(1536)` column to `listings`
- [ ] HNSW index for fast approximate nearest-neighbour
- [ ] Generate embeddings during ingest (`text-embedding-3-small`, or a client-provided
      model) — backfill the existing corpus once
- [ ] Hybrid query: vector similarity intersected with the existing RLS-filtered search,
      **never bypassing it** — the gating matrix must still hold on semantic results
- [ ] UI: a natural-language search bar — "3BHK near a school in south Pune under 40L"
- [ ] Fallback to keyword search when the embedding service is unavailable

> [!WARNING]
> **The access matrix is the risk here.** A vector query that reaches the DB by a
> different path than the existing search is a new way to leak gated fields. Extend
> `scripts/access-matrix-test.mjs` with semantic-search cases before shipping.

**Done when:** Natural-language queries return relevant results, the 49/49 gating
assertions still pass against the semantic path, and keyword fallback works with the
embedding service disabled.

---

## Priority Matrix

| Workstream | Business Impact | Engineering Effort | When |
|---|---|---|---|
| D1 — Auction History | 🔴 High | Medium (2-3 weeks) | Month 1-2 post-launch |
| D2 — Search Expansion | 🟡 Medium | Low (1 week) | Month 1 post-launch |
| D3 — Mobile Apps | 🔴 High | Low-High (1-8 weeks) | Month 1 post-launch |
| D4 — Razorpay | 🟡 Medium | Medium (2 weeks) | When manual billing proves demand |
| D5 — Marketing Engine | 🔴 High | Medium (2-3 weeks) | Month 1-2 post-launch |
| D6 — Out-Build | 🟢 Low-Med | High (ongoing) | Month 3+ |
| D7 — Vector Search | 🟡 Medium | Medium (1-2 weeks) | Month 2-3, once the corpus is large |

### Recommended post-launch order:
1. **D3 (Mobile Apps, Option A)** — fastest win, Play Store presence
2. **D5 (Marketing Engine)** — retention is everything with a new product
3. **D1 (Auction History)** — the feature that beats FindAuction
4. **D2 (Search Expansion)** — parity
5. **D4 (Razorpay)** — when manual billing shows volume
6. **D7 (Vector Search)** — once there is a corpus worth searching semantically
7. **D6 (Out-Build)** — as resources allow

---

*Last updated: 31 August 2026, evening — D7 (vector search) moved in from `immediate_plan.md`.*
