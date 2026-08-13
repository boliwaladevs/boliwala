# Boliwala.com — Blockers, Risks & Open Questions

**As of:** 2026-08-09, after **Sprint 6**.
**Target launch:** 15 September 2026.
**Companion docs:** `testing_guide.md`, `MEMORY.md` (§14/§15 are current),
`project_calendar.html`.

---

## The one-paragraph version

Every sprint that could be built without the client has been built.
Sprints 0, 1, 1.5, 2, 2.1, 2.5, 2.7, 3, 4 and 5 are done and verified.
**Nothing unblocked remains.** What is left divides into three groups:
**B1–B3** are hard external blockers (credentials and DNS) that stop code
from being written at all; **B4–B8** are content and asset waits that stop
launch but not development; **B9–B12** are decisions we need an answer to
before building the affected feature. Of these, **B1 (Razorpay) is on the
critical path and is a build sprint, not a switch-flip** — it needs ~2
weeks of work *after* the credentials arrive, which is why it dominates
the schedule.

Every credential claim below was checked against `.env.local` on
2026-08-09, not carried over from an earlier note.

---

## Severity key

| | Meaning |
|---|---|
| 🔴 **Critical** | Blocks launch. Work cannot start or finish. |
| 🟠 **High** | Blocks launch, but development can proceed around it. |
| 🟡 **Medium** | Should be resolved before launch; a workaround exists. |
| 🔵 **Low** | Cleanup or nice-to-have. Safe to ship without. |

---

## Status after Sprint 6 — 2026-08-09

Sprint 6 shipped and closed or part-closed eight items on this register.
This section is the current state; each entry below carries its own note.

| | Items | |
|---|---|---|
| ✅ **Resolved** | T1 T2 T3 · B9 (security half) | Done in Sprint 6, verified |
| 🟨 **Engineering done, content pending** | B4 B6 | Only the client's copy or number is missing now |
| 🟠 **Open, actionable by us** | T4 T5 T6 T7 T8 · **T9 T10 (new)** · E1 | No client input needed |
| ⛔ **Cannot start** | B1 B2 B3 B5 B7 B8 B10 B11 B12 · E2 E3 | Genuinely waiting on someone else |

**What Sprint 6 closed:**

- **T1** — all 12 live listings audited; exactly one gated/public overlap
  existed and is fixed. `scripts/leak-test.mjs` now reports zero.
- **T2** — `components/projects.tsx` and six unreferenced images deleted;
  `public/images` down from 3.0 MB to 1.1 MB. Stray `_prisma_migrations`
  table dropped.
- **T3** — `/search` alerts banner wired end to end. Filters round-trip to
  identical result sets; `sort` and `page` are stripped so "page 2,
  cheapest first" never becomes part of a subscription.
- **B9 security half** — `/partner/dashboard` no longer serves a fabricated
  mockup to the open internet. The **scope decision is still open.**
- **B4 derivable half** — live auction / city / bank counts now computed
  from the database in all three files that carried invented figures.

**Two new items found while building:** T9 (`anon` holds table-level
TRUNCATE on `profiles`, which RLS does not cover) and T10 (Satoshi has
never actually loaded). Both in Group D.

# Group A — Hard external blockers (code cannot be written)

## 🔴 B1 — Razorpay credentials → the entire payments sprint

**Blocks:** Sprint 3.5 (Razorpay integration), and everything downstream —
admin Packages, admin Payments, Success Fee Tracker, the ₹999 and ₹9,999
purchase flows, and Sprint 5's "live-key switchover" step.

**Evidence:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and
`RAZORPAY_WEBHOOK_SECRET` are **all empty** in `.env.local`.

**Why this is the critical path.** This is commonly misread as a
configuration step. It is not. There is currently **no payment code in
the repo at all** — no order creation, no checkout, no webhook handler,
no entitlement granting, no signature verification. Once credentials
arrive this is roughly **two weeks** of build plus test: order →
checkout → webhook verification → entitlement, with idempotent webhooks
and failure/retry handling. It is the single largest remaining piece of
work and it cannot start early.

**What we need, in order:**
1. **Test-mode** key ID + secret — self-serve from the Razorpay dashboard,
   **no KYC required**. This alone unblocks the entire build.
2. A webhook endpoint registered in the Razorpay dashboard, pointing at
   the deployed app, and its signing secret.
3. **Live-mode activation** — needs KYC, historically takes days to
   weeks. Only needed at launch, but **start it now**; it is the item
   most likely to slip the 15 Sep date without warning.

**Owner:** Client (Optimistic IP).
**Needed by:** Test keys **17 Aug** to hold the schedule. Live activation
started immediately, complete by **7 Sep**.

---

## 🔴 B2 — Resend API key + DNS → transactional email

**Blocks:** Sprint 4.5 — signup confirmation, payment receipts, callback
acknowledgements. Also the Phase 2 alert engine later.

**Evidence:** `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are both **empty**.

**Two separate things are needed:**
- An API key (immediate, self-serve) — unblocks development against
  Resend's sandbox domain.
- **DNS records on `boliwala.com`** to verify the sending domain — without
  this, production email either does not send or lands in spam. This is
  the original plan's **R1** risk and has been open since Sprint 0.

**Partial workaround:** development and testing can proceed on the
sandbox domain with just the API key. Only production sending is blocked
by DNS.

**Owner:** Client for the key; whoever controls `boliwala.com` DNS for the
records.
**Needed by:** Key **17 Aug**. DNS verified by **31 Aug**.

---

## 🔴 B3 — Production domain and registrar control

**Blocks:** production deployment, and the correctness of every canonical
URL, sitemap entry, OG tag and JSON-LD `url` the site emits.

**Evidence:** `NEXT_PUBLIC_SITE_URL` is still `http://localhost:3000`.

**Mitigated by design.** Sprint 5 routed **every** absolute URL through
`lib/seo.ts`'s `SITE_URL`, which reads that one variable. The cutover is
therefore a single environment-variable change in Vercel plus a redeploy —
no code changes. But it cannot be *verified* until the real domain exists,
and shipping with localhost URLs in the sitemap would be actively harmful
to indexing.

**We need:** the production hostname, DNS pointed at Vercel, and
confirmation of who controls the registrar.

**Owner:** Client.
**Needed by:** **7 Sep**, so there is a week of real-domain testing before
launch.

---

# Group B — Content and asset waits (development proceeds; launch does not)

## 🟨 B4 — C5: headline statistics — **derivable half resolved in Sprint 6**

**Blocks:** launch, for the three remaining claims only.

**Resolved:** live auctions, cities and banks are computed from the
database in `hero.tsx`, `auth-view.tsx` and `about-view.tsx` — they read
**12 / 11 / 6** and grow on their own. The site no longer contradicts
itself on bank count.

**Still open — three claims with no data behind them:**

- "₹2,100Cr total value won for clients"
- "840+ auctions bid and won"
- "28% average saving vs market for clients"

These were removed from `about-view.tsx` in Sprint 6 rather than left
published. **Do not restore them without signed-off figures.**

One nuance worth keeping straight: the average discount of reserve price
to `estimatedMarketValue` computes to **exactly 28%** across the live
listings, and that tile now ships with that meaning. It is *not* the same
claim as "our clients saved 28%" and must not be relabelled as such.

The About section heading also changed from "What Boliwala Has Done" to
"What Boliwala Tracks", because the original asserted a track record the
data cannot support. **That wording is ours, not client-approved — it
needs review.

**Why it matters.** The database currently holds **12 listings and 6
banks**. Publishing "12,400+ live auctions" is not a rounding difference,
it is a claim that is off by three orders of magnitude, and in a
financial-services context that carries real regulatory and reputational
exposure.

Note the prototype also contradicts itself on bank count: the homepage
says 18+, login/signup say 40+, About says "40+ Banks & NBFCs".

**Options — the client must pick one:**
1. Supply the real figures (preferred), or
2. Drive the counts from live data, so they are true by construction and
   grow on their own, or
3. Give **written** sign-off to ship specific figures as aspirational.

**Recommendation:** option 2 for anything derivable (listings, cities,
banks), option 1 with written sign-off for the rest. Option 3 alone is
the worst outcome and should be a last resort.

**Owner:** Client.
**Needed by:** **31 Aug**.

---

## 🟠 B5 — Privacy Policy and Terms copy

**Blocks:** launch. A site that takes payments and personal data cannot
ship without these, and they are already linked in the UI.

**Evidence:** `components/footer.tsx` lines 79 and 82 link both to
`href="#"`. Neither `/privacy` nor `/terms` exists as a route.

**Effort once copy arrives:** a few hours — two static routes plus footer
links.

**Owner:** Client (likely needs their legal review, so start early).
**Needed by:** **31 Aug**.

---

## 🟨 B6 — Real contact details (C3) — **engineering done in Sprint 6**

**Blocks:** launch. The code is ready; only the number is missing.

**Resolved:** contact details come from the environment via
`lib/contact.ts`. The `+1 (234) 567-890` US placeholder is deleted, and
the phone and WhatsApp entries render only once the vars are set — an
unset value shows nothing rather than something false. The homepage
`Organization` JSON-LD picks up `telephone` automatically when it exists.

**Still needed:** real values for `NEXT_PUBLIC_CONTACT_PHONE` and
`NEXT_PUBLIC_WHATSAPP_NUMBER`, both still empty. Setting them is now a
config change, not a code change.

**Also needs confirming:** whether `hello@boliwala.com` is real (it is
currently published in the homepage `Organization` JSON-LD), and the real
Instagram / LinkedIn URLs (footer links are `href="#"`).

**Owner:** Client.
**Needed by:** **24 Aug**.

---

## 🟡 B7 — Real brand assets

**Blocks:** nothing — but the placeholders should not ship as final.

**Current state:** Sprint 5 generated a favicon, Apple touch icon and OG
card from the gavel glyph and amber gradient already in
`components/logo.tsx`. They are brand-*consistent* but they are **not the
client's actual logo**.

**Swapping is cheap:** replace `app/icon.tsx`, `app/apple-icon.tsx`,
`app/opengraph-image.tsx`, or drop real image files alongside them. No
other code changes.

**We need:** logo SVG, favicon, and a designed OG share image.

**Owner:** Client.
**Needed by:** **7 Sep**.

---

## 🟡 B8 — Definitive bank list

**Blocks:** nothing structural — the mechanism is real (live `banks` table,
live per-bank counts on `/search`). But only **6 banks** are seeded, while
the marketing copy claims 18+ or 40+ (see B4).

**Owner:** Client.
**Needed by:** **31 Aug**.

---

# Group C — Decisions needed before building

## 🟠 B9 — Is the Channel Partner portal in or out of scope?

**Security half resolved in Sprint 6.** `/partner/dashboard` used to
return 200 to a signed-out guest — a mockup full of fabricated partner
earnings served to the open internet. It now redirects to `/login`, the
same as `/profile` and `/admin`. The guard is deliberately "is signed in"
only: there is no partner role in the schema, and inventing one ahead of
this decision would fork the access model.

**The scope decision is still open**, and still needs answering:

The scope documents disagree with the code: `boliwala_features.txt` §2.6
says "no partner portal or directory at launch", yet
`app/partner/dashboard/page.tsx` exists as a built page, and the
prototype's login screen offers "Login as Channel Partner".

**Three options:**
1. **Delete the route** for launch (cleanest, matches stated scope).
2. Put it behind an auth guard and ship it as a real feature (needs a
   partner role, approval workflow, and real data — a sprint of work).
3. Leave as-is — **not acceptable**; a public page full of fabricated
   numbers.

**Recommendation:** option 1 unless the client actively wants the portal.

**Owner:** Client decision; ~1 hour to execute option 1.
**Needed by:** **24 Aug**.

---

## 🟡 B10 — Which admin tabs must be real for launch?

Eleven admin tabs are still the original static mockup with fabricated
data: **Packages, Payments, Success Fees, Users, Partners, Alerts, Alert
Engine, Email Campaigns, WhatsApp Tools, Segments, Engagement Analytics**,
plus the dashboard's Recent Activity feed and revenue chart.

Three of these (Packages, Payments, Success Fees) are **soft-blocked on
B1** — there is no real payment data to show until Razorpay exists.

The rest are independent and each is genuinely optional for a launch. The
question is which the client actually needs on day one versus post-launch.

**Recommendation:** build **Users** and **Partners** (both have real
tables and real data today, and an operator needs them). Defer the whole
Engagement group — Alert Engine, Email Campaigns, WhatsApp Tools,
Segments, Analytics — to Phase 2.

**Owner:** Client decision.
**Needed by:** **24 Aug**.

---

## 🟡 B11 — Listing photography

Every listing currently renders a bank-monogram placeholder. The upload
pipeline is **fully built and verified** (Supabase Storage bucket, admin
upload, public URLs, deletion) — there are simply no photos.

This also affects SEO: `generateMetadata` uses the first listing image as
the OG image, so social shares of listings currently fall back to the
generic site card.

**Owner:** Client.
**Needed by:** **7 Sep** (or accept placeholders at launch).

---

## 🔵 B12 — Google OAuth is live but its redirect config was never independently verified

Sprint 2.5 shipped and a **real Google sign-in was verified end to end**,
so this works. But two settings were confirmed only by the user, never
checked directly: the GCP client's Authorized redirect URI, and Supabase's
own URL Configuration (Site URL / Redirect URLs).

**Why it matters now:** both are **environment-specific**. They currently
point at localhost/the dev setup. When B3's production domain lands,
**both must be updated or Google sign-in will break in production** — and
it will break silently, only for real users.

**Action:** add to the domain-cutover checklist; re-test sign-in against
the production domain before launch.

**Owner:** Us, at cutover.
**Needed by:** **7 Sep**, with the domain switch.

---

# Group D — Technical debt and cleanup (not blocking)

| ID | Item | Detail | Severity |
|---|---|---|---|
| ~~**T1**~~ ✅ | ~~Gated data duplicates public data~~ | Jaipur agricultural listing: gated `flatNumber` is `"Khasra 210"`, and the **public** `addressLine` is `"Khasra 210, Village Bhankrota"`. **Fixed in Sprint 6.** All 12 live listings audited; this was the only overlap. Public `addressLine` generalised to "Village Bhankrota" so the Khasra number — the parcel identifier a buyer pays to unlock — is genuinely gated. `leak-test.mjs` reports zero overlaps. | ✅ |
| ~~**T2**~~ ✅ | ~~Dead code~~ | **Fixed in Sprint 6.** `projects.tsx` and six unreferenced images deleted; `public/images` 3.0 MB → 1.1 MB. Stray `_prisma_migrations` table dropped. | ✅ |
| ~~**T3**~~ ✅ | ~~`/search` alerts banner~~ | **Fixed in Sprint 6.** Wired to `alert_subscriptions.filters`, with a Profile → My Alerts tab to view, follow and pause them. Guests can subscribe; guest *unsubscribe* is deferred to Sprint 4.5, since proving email ownership needs an email flow. | ✅ |
| **T4** | Profile PAN/Aadhaar — stored, compliance work outstanding | Columns added per client decision (migration 0009), with per-column grants to `authenticated` only, own-row RLS, and format CHECK constraints. **Not yet done and needed before launch:** application-level encryption at rest, a retention/deletion policy, and an access audit trail. Volume encryption is not the same as protecting the value from anyone holding a session or the service key. | 🟠 |
| **T5** | Supabase DB password rotation | Was pasted into a chat transcript during the original build. Should be rotated before launch. | 🟠 |
| **T6** | `SUPABASE_ANON_PUBLIC_KEY` | Re-checked after Sprint 6: still in `.env.local`, still referenced by no code. Confirm whether it was meant to replace something, or delete it. | 🔵 |
| **T7** | Service worker / offline PWA | Manifest and icons ship; no service worker. Original plan **R7** names this the first thing to cut. | 🔵 |
| **T8** | No test runner | No unit-test framework. Coverage today is the two scripts in `scripts/` plus manual QA. Adding Vitest is worthwhile post-launch. | 🔵 |
| **T9** | **`anon` holds TRUNCATE on `profiles`** | Blanket table-level `DELETE`/`INSERT`/`TRUNCATE` grants to `anon` and `authenticated` (the Supabase default). RLS denies DELETE and INSERT because no policy permits them — but **TRUNCATE is not subject to RLS at all**. No known path to invoke it via PostgREST, so this is defence-in-depth rather than an open hole. Revoking blanket grants across every table deserves its own careful pass — pair it with T5. | 🟠 |
| **T10** | Satoshi font never loads | The three `app/fonts/Satoshi-*.woff2` files are 609-byte CSS stubs pointing at `cdn.fontshare.com`, not fonts, and nothing imports them. `--font-sans` names Satoshi, so the app silently falls back to `system-ui`. Also means **R4's licence question may be moot** — nothing is being self-hosted. The fix depends on the licence answer. | 🔵 |

---

# Group E — Environment and delivery risks

## 🟠 E1 — Development machine disk pressure

`C:` reached **100% full (40 KB free)** during this session and blocked
`pnpm install` outright. Clearing npm's cache recovered 1.5 GB, which is
what the project is running on now. Worse, `node_modules` sits **inside a
OneDrive-synced folder**, which causes constant sync churn.

**Recommendation:** free 10 GB+, and move the repo out of OneDrive.
**Owner:** Us. **Severity:** 🟠 — this will stop work again.

## 🟡 E2 — Deployment is not verified against a real domain

The Vercel project's Production Branch was never re-confirmed
(`vercel whoami` had no credentials at last check). Worth a 30-second
check in the dashboard before relying on `main` → production.

## 🟡 E3 — Single-approver bottleneck

`main` requires 1 approving review, and only `boliwaladevs` can approve.
`nesora-ops` cannot self-approve. If `boliwaladevs` is unavailable during
the launch window, nothing merges. See `plans/version_control.md`.

## 🔵 E4 — SheetJS is installed from a CDN, not npm

`xlsx@0.20.3` comes from `https://cdn.sheetjs.com/...` because patched
releases moved off npm. Deliberate and correct (npm's latest has two
unfixed high-severity advisories), but it means `pnpm audit` and
Dependabot will not track it. Check their CDN manually for updates.

---

# Critical-path summary

The launch date is governed by one chain:

```
Razorpay TEST credentials  ──►  Sprint 3.5 build (~2 weeks)  ──►
admin Packages/Payments/Success Fees  ──►  full regression  ──►  launch
```

Everything else can run in parallel. **The single most valuable thing the
client can do today is create a Razorpay test key** (self-serve, no KYC,
~10 minutes) **and start live-mode KYC in parallel.**

## What we need, by date

| By | Item | ID |
|---|---|---|
| **17 Aug** | Razorpay **test** keys | B1 |
| **17 Aug** | Resend API key | B2 |
| **17 Aug** | Razorpay live-mode KYC **started** | B1 |
| **24 Aug** | Real contact number + WhatsApp — *now just env vars* | B6 |
| **24 Aug** | Channel Partner scope decision — *page is secured; scope still open* | B9 |
| **24 Aug** | Which admin tabs are launch-critical | B10 |
| **24 Aug** | **Sign-off on the new About wording** written in Sprint 6 | B4 |
| **31 Aug** | The three historical claims: ₹2,100Cr, 840+ auctions, 28% saving | B4 |
| **31 Aug** | Privacy Policy + Terms copy | B5 |
| **31 Aug** | DNS records for Resend | B2 |
| **31 Aug** | Definitive bank list | B8 |
| **31 Aug** | **PAN/Aadhaar compliance:** retention policy + who may access | T4 |
| **7 Sep** | Production domain + registrar access | B3 |
| **7 Sep** | Brand assets | B7 |
| **7 Sep** | Listing photography (or accept placeholders) | B11 |
| **7 Sep** | Razorpay **live** activation complete | B1 |

## Honest read on the date

**15 September is achievable, but only if B1 and B2 land by 17 August.**

Razorpay is ~2 weeks of build and must be followed by regression testing.
Working back from 15 Sep: launch prep needs the week of 8 Sep, admin
completion needs the week of 31 Aug, which means the Razorpay build must
run 17–30 Aug, which means credentials by 17 Aug. **Every week those
credentials slip pushes the launch date by a week**, because nothing else
can fill that slot.

If they slip past **31 August**, the realistic options are to move the
date or to launch without payments — shipping the free tier and lead
capture, with the paid tiers as a fast-follow. That is a genuinely viable
fallback: everything except payments is already built and tested.
