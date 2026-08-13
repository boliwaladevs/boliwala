# Boliwala.com — Blockers, Risks & Open Questions

**As of:** 2026-08-09, after Sprint 5.
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

## Can we act on this today? — audit of 2026-08-09

Every item below was re-checked against the running code and a live
database introspection, not against this document. **Most of the register
is more actionable than it first appears.**

The actionable work is scheduled as **Sprint 6 in `SPRINT_CALENDAR.md`**;
the findings that change specific tasks in it are in `MEMORY.md` §18.

| Status | Items | Meaning |
|---|---|---|
| ✅ **Do now** | T1 T2 T3 T4 T6 T8 | No client input needed at all |
| 🟨 **Half now** | B4 B5 B6 B9 B10 B12 | Engineering half lands now; only content is missing |
| ⛔ **Cannot start** | B1 B2 B3 B7 B8 B11 E2 E3 | Genuinely waiting on someone else |

**Three corrections this audit made to the register:**

1. **B4 named only two files.** `components/auth-view.tsx` carries
   fabricated statistics too ("40+ banks", "12,400+"). Three files, not two.
2. **T3 is far cheaper than stated.** `alert_subscriptions` already has a
   `filters jsonb` column — the schema has been ready since Sprint 0, so
   wiring the banner is a mapping job, not a migration.
3. **T4 has a compliance dimension, not just dead UI.** `profiles` has no
   `city`/`pan`/`aadhaar` columns, and **Aadhaar storage is regulated
   under UIDAI rules**. The fix is to remove those fields, not add columns.

**What is derivable for B4:** live auctions, cities and banks can all be
computed from live data. The historical claims (₹2,100Cr won, 840+
auctions, 28% saving) cannot — there is no outcome data in the schema.
Note that *average discount of reserve price to estimated market value*
**is** computable and is an honest number — but it is a different claim
from "our buyers saved 28%" and must not be dressed up as one.

**Live row counts**, for calibration on what any new admin screen would
show: `profiles` 2 · `banks` 6 · `listings` 12 · `listing_views` 21 ·
`credit_transactions` 2 · `settings` 7 · **everything else 0**, including
`channel_partner_applications`, `payments`, `subscriptions`,
`listing_images` and `callback_requests`.

---

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

## 🟠 B4 — C5: headline statistics have never been verified

**Blocks:** launch. These are **public marketing claims**.

**Where they are:**
- `components/hero.tsx` — "12,400+ Live Auctions", "140+ Cities",
  "18+ Banks"
- `components/about-view.tsx` — "₹2,100Cr won", "840+ auctions",
  "28% average saving"

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

## 🟠 B6 — Real contact details (C3)

**Blocks:** launch, and it makes the primary lead-generation CTA
non-functional.

**Evidence:** `NEXT_PUBLIC_WHATSAPP_NUMBER` and
`NEXT_PUBLIC_CONTACT_PHONE` are both **empty**. The footer currently shows
`+1 (234) 567-890` — a **US placeholder** on an India-only product.

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

**Why it is urgent:** `/partner/dashboard` **returns 200 to a signed-out
guest today.** It is a static mockup with no auth guard and no real data,
so nothing leaks — but it should not be publicly reachable at launch.
Sprint 5 added `noindex` and a robots disallow, which is **not the same as
protecting it**.

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
| **T1** | Gated data duplicates public data | Jaipur agricultural listing: gated `flatNumber` is `"Khasra 210"`, and the **public** `addressLine` is `"Khasra 210, Village Bhankrota"`. A buyer spends a credit and receives a string already visible for free. Not a security bug — a data-entry/monetisation bug. Audit the other 11 listings for the same pattern. | 🟡 |
| **T2** | Dead code | `components/projects.tsx` (~170 lines) is imported by nothing. Its images `hously-1/2/3.png` plus unreferenced `desk.png`, `premium_property_bg.png`, `hously-4.png` total ~1.6 MB. | 🔵 |
| **T3** | `/search` alerts banner | "Get email alerts for this search" is decorative — never wired to `alert_subscriptions`. Needs a filter→JSON mapping. | 🔵 |
| **T4** | Profile fields with no columns | City / PAN / Aadhaar render on `/profile` but have no DB columns and silently do nothing. Either add columns or remove the fields. | 🟡 |
| **T5** | Supabase DB password rotation | Was pasted into a chat transcript during the original build. Should be rotated before launch. | 🟠 |
| **T6** | `SUPABASE_ANON_PUBLIC_KEY` | Present in `.env.local` but referenced by no code. Confirm whether it was meant to replace something, or delete it. | 🔵 |
| **T7** | Service worker / offline PWA | Manifest and icons ship; no service worker. Original plan **R7** names this the first thing to cut. | 🔵 |
| **T8** | No test runner | The codebase has no unit-test framework. Coverage today is the two scripts in `scripts/` plus manual QA. Adding Vitest is worthwhile post-launch. | 🔵 |

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
| **24 Aug** | Real contact number, WhatsApp, email, socials | B6 |
| **24 Aug** | Channel Partner scope decision | B9 |
| **24 Aug** | Which admin tabs are launch-critical | B10 |
| **31 Aug** | Headline statistics resolved | B4 |
| **31 Aug** | Privacy Policy + Terms copy | B5 |
| **31 Aug** | DNS records for Resend | B2 |
| **31 Aug** | Definitive bank list | B8 |
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
