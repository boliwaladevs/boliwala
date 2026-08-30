# Where Boliwala Is Already Ahead of FindAuction.in

**Prepared:** 30 August 2026
**Companion to:** `coparison.md` (the gap list — what we still need to build)
**Basis:** live inspection of findauction.in on 30 Aug 2026, compared against Boliwala's
verified working build (`show.md`, `MEMORY.md`) and the URD v2.0 (`boliwala_features.txt`).

> **How to read this.** Advantages are split into **[LIVE]** (built, working, demonstrable
> today), **[SPEC]** (designed and planned, not yet built) and **[STRUCTURAL]** (a business-
> model choice they cannot copy without breaking their own model). Don't market a [SPEC]
> item as if it were [LIVE] — §8 is the honesty check.

---

## 1. The three advantages that actually decide this

### 1.1 The full address is free. Theirs is not. **[LIVE] [STRUCTURAL]**

FindAuction paywalls the **full address**, the **borrower name**, the **authorised officer's
phone number** and the **auction notice PDF**. A guest sees `Mr Banker Info 9XXXXXXXXX` and a
grey box saying the location "is not publicly accessible".

Boliwala shows the **full address to everyone, always, with no signup**. We gate only the
operational last mile — flat/floor number, inspection details, officer contact, bank
phone/email.

This is not a feature difference, it's a **trust posture**. Their model needs a buyer to pay
₹2,500 before knowing whether the property is even in the right part of town. Ours lets them
qualify the property for free and pay only when they're ready to act.

**They cannot copy this** without gutting the only thing their ₹7,000 subscription sells.

### 1.2 We are 86% cheaper — with a real upgrade path **[LIVE for pricing, SPEC for tier 3]**

| | FindAuction | Boliwala |
|---|---|---|
| Entry | ₹2,500 / 3 months | **₹0 — browse everything, no signup** |
| Free unlocks on signup | 3 | **5 credits** |
| Annual | **₹7,000** | **₹999** |
| Second product | — | **₹9,999 + 1% success fee** |
| Tier differentiation | Duration only | **Capability ladder: free → credits → unlimited → done-for-you** |

Their three tiers are the *same product* at three durations. There is nothing to upgrade to
after ₹7,000, and nothing between ₹0 and ₹2,500.

Ours is a genuine ladder — a browser becomes a member becomes a subscriber becomes a client —
with a natural cross-sell at every step. And critically: **the top tier only gets paid when
the customer wins.** Nothing in their catalogue is aligned with the buyer's outcome.

### 1.3 We do the auction. They explicitly refuse to. **[SPEC] [STRUCTURAL]**

Their own About page:

> *"FindAuction is a subscription-based platform that provides information about upcoming
> auctions. **We do not conduct auctions**; our service is solely focused on helping users
> discover auction opportunities through our membership plans."*

The ₹9,999 + 1% package — title search, due diligence, bid management, possession support,
loan assistance — is the product they have publicly declined to build.

⚠️ **But see §8.** They are currently hiring a Sales Support Manager for *"banker
coordination, inspection scheduling, key collection follow-up, client coordination, field
team support, auction process support."* This advantage has a clock on it.

---

## 2. Product & UX — where we're simply better built

| | FindAuction | Boliwala | Status |
|---|---|---|---|
| **Shortlist / saved properties** | **None at all.** No favourite, wishlist or watchlist anywhere on the site. | Save from the card, the listing page, or the profile; removable; persisted | **[LIVE]** |
| **Saved-search alerts, self-serve** | Premium-only, and only a **daily digest** | Free. Create, **edit frequency, pause, resume, delete, "view matches" re-runs the live query** | **[LIVE]** |
| **Alert timing** | "Daily email alert", "Daily mobile notification" | **Real-time on listing publish** (per URD §6.1) | **[SPEC]** |
| **Faceted filtering** | 4 quick chips (Popular / Car / Physical / Symbolic). No sidebar. | Full left sidebar with **live result counts per bank, per type**, price range, sort, grid/list toggle | **[LIVE]** |
| **Shareable filtered URLs** | Partially (`/search?…`) | Every filter state is URL-driven and shareable; each is independently indexable | **[LIVE]** |
| **Design** | Bootstrap-3-era, text-dense, tiny thumbnails, ~2 images per 15 listings | Modern responsive build, parallax hero, image-forward cards | **[LIVE]** |
| **Homepage stats** | Static marketing claims | **Computed from the database.** Publish a 13th listing and the homepage says 13 | **[LIVE]** |
| **Property imagery** | Weak — most listings have no photo | R2 rendition pipeline designed (thumb/card/full WebP, content-hashed) | **[SPEC]** |

**On alerts specifically:** their FAQ tells users to "subscribe to receive updates via email
or click on the push notification". That's a newsletter. Ours stores *the search itself* —
criteria, frequency, pause state — and can re-run it on demand. That's a product.

---

## 3. Monetisation infrastructure they don't have

### 3.1 A credit system, not just a paywall **[LIVE]**

They have a binary gate: 3 free unlocks, then ₹2,500. We have a **metered credit economy** —
5 free credits, 1 credit per property, per-field-group unlocking, with a full
`credit_transactions` ledger.

Why it matters commercially:
- It creates a **middle state** between "browsing" and "paying ₹2,500" — the state where most
  real buyers actually live.
- It generates a behavioural signal. Someone who has spent 4 of 5 credits is a qualified lead;
  someone who has spent 0 is not. The URD's credit-lifecycle nudges (2 left → soft nudge, last
  credit → paywall alert, 3 days unpaid → social proof) are built on data they don't collect.
- It gives us a cross-sell trigger they can't compute: **3+ unlocks → offer the ₹9,999 package.**

### 3.2 The paywall is enforced server-side, and provably so **[LIVE]**

Gated fields are **never sent to the browser** — not blurred, not hidden with CSS, not present
in the page source. There is an automated test asserting this across every property (192
checks) on every change, and it can be demonstrated live with View Source.

FindAuction's masked values (`Mrs Unlock full borrower`, `9XXXXXXXXX`) are *rendered
placeholders*, which means the redaction is happening somewhere in their template layer.
Ours is architecturally guaranteed. For a business whose entire revenue depends on that gate
holding, this is not a detail.

### 3.3 Nothing is hardcoded **[LIVE]**

Free credits, annual price, package price and success-fee % are **settings rows**, live-editable
from admin. Change 999 → 1499 in Settings and the pricing page, services page, comparison table
and FAQ copy all update together. Existing users are grandfathered.

FindAuction's tiers are, to all appearances, static markup. Every price experiment costs them a
deploy; ours costs a click. **Given they charge 7× what we do, our ability to run pricing
experiments cheaply may be the single most valuable operational advantage on this list.**

### 3.4 A second revenue stream, and a third **[SPEC]**

They have one: subscriptions. We have three — subscriptions (₹999), service packages (₹9,999),
and success fees (1%). The success fee in particular is uncapped, aligned with the customer,
and completely absent from their model.

---

## 4. The Channel Partner programme — a whole distribution channel they don't have **[SPEC]**

FindAuction has no broker or agent programme of any kind. Their growth channels are SEO,
Google Ads and a Play Store listing — all rented, all paid, all competitive.

Boliwala's URD §4 specifies a full partner portal:
- Three tiers (Associate → Silver → Gold), admin-approved
- Commissions on **all three revenue streams**, rates admin-set and audit-logged
- Unique tracked referral links + **unlimited** email/SMS invites
- **Auto-personalised co-branded creatives** — admin uploads a template once, the system
  overlays each partner's name, phone and referral link across WhatsApp / Instagram post /
  Instagram story / Facebook formats
- Monthly payout ledger

India's bank-auction market runs on local brokers. A programme that pays them on every stream
and hands them ready-made WhatsApp creatives is a **distribution channel with a marginal cost
near zero** — structurally different from buying clicks. Nothing in FindAuction's product
suggests they've considered it.

---

## 5. Admin & operations

| | FindAuction | Boliwala | Status |
|---|---|---|---|
| Listing CRUD with **per-field gating toggles** | Not visible externally; their gating looks global | Per-listing control over exactly which fields are paywalled | **[LIVE]** |
| Bulk upload | Unknown (feed-driven) | xlsx upload with **auto column detection, manual remap, per-row validation preview, drafts-then-publish** — deliberately not tied to one template | **[LIVE]** |
| Draft → Live workflow | Unknown | Draft listings are invisible publicly; flip to Live and they appear in search and the homepage count immediately | **[LIVE]** |
| Pricing controls | Apparently static | Live-editable settings, site-wide propagation | **[LIVE]** |
| Callback / lead pipeline | Contact form → email inbox | Structured queue: New → Contacted → Closed, notes, **convert to package** | **[LIVE]** |
| Role-based access | Separate admin presumably | Single sign-in; **role decides destination** — staff to `/admin`, customers to profile | **[LIVE]** |

Their bulk-upload equivalent is an IBAPI feed. Ours adapts to whatever spreadsheet a bank
actually sends, which matters the moment we ingest anything the feed doesn't carry.

---

## 6. Technical & compliance posture

- **Modern stack** — Next.js 16, React 19, TypeScript, Tailwind v4, Supabase, SSR throughout.
  Theirs is legacy PHP with a Bootstrap-3-era front end and a Capacitor/TWA shell over the
  website. Every feature we add is cheaper to add than theirs.
- **Infrastructure planned for scale before it's needed.** `INFRA_R2_SCALING_ANALYSIS.md`
  models 70k listings on Cloudflare Workers + R2: **~$55–105/mo flat** vs. **$280–700/mo and
  spiky** on the naive path — largely because R2 egress is free. At their traffic, delivery
  cost is a structural margin advantage.
- **Semantic search designed in** (pgvector + embeddings in the ingest pipeline). Their search
  is keyword + dropdowns. "3BHK near a school in south Pune under 40 lakh" is a query they
  cannot serve.
- **Data-protection ready.** We store PAN and Aadhaar, so we shipped **account deletion with
  full cascade** and password change requiring the current password. Their register form
  collects less, and nothing on their site indicates a deletion path.
- **We will be legible to AI answer engines.** Their `robots.txt` blocks GPTBot, ClaudeBot,
  Bytespider and meta-externalagent. In 2026 that removes them from an entire and growing
  discovery surface. We should do the opposite — structured data, clean semantics, an open
  `robots.txt`, an `llms.txt`. **This is a free advantage they have handed us by choice.**

---

## 7. Positioning lines that follow from all this

Claims we can make that they cannot answer:

1. **"The address is free. It always will be."** — Their entire ₹7,000 subscription depends on
   it not being.
2. **"₹999 a year. They charge ₹7,000."** — Verifiable on their own pricing page.
3. **"Browse everything without signing up."** — They gate the useful half at registration.
4. **"We only take our 1% if you win."** — They get paid whether you win, lose, or never bid.
5. **"We don't just find you the auction. We run it for you."** — Their About page says, in
   their own words, that they don't.
6. **"Real-time alerts, not a daily digest."** — Their published feature list says "Daily".
7. **"Save properties, save searches, get told the moment something matches."** — They have
   no shortlist feature at all.

> **Sharpen the support claim.** "We offer support and they don't" is **false** — every
> FindAuction tier lists "Email support". The true version is:
> *"Email support versus a named person on WhatsApp and phone, with a published response time,
> who will actually attend the auction with you."* Put the SLA on the pricing page in numbers.

---

## 8. The honesty check — where "better" isn't true yet

This list is worth nothing if we oversell it internally. As of 30 August 2026:

| Advantage | Reality |
|---|---|
| ₹9,999 + 1% service | **Spec'd, not built.** Admin Packages / Service Pipeline / Success Fees are mockups. |
| Channel Partner programme | **Not built.** `/partner/dashboard` does not exist. |
| Real-time alerts | Alerts are **captured and stored correctly**, but nothing can be *sent* — blocked on the Resend key since 17 August. |
| Any paid tier at all | **Blocked on Razorpay keys** since 17 August. We currently cannot take money. |
| 3 revenue streams | Zero are live. |
| Inventory | **12 listings vs their 96,234.** This is the one that dwarfs everything above. |

**The strategic read:** we have built a materially better *product* around a materially better
*business model*, and we are competing against an eight-year-old *content and distribution
asset*. Their weaknesses are the kind that take a rebuild to fix. Ours are the kind that take
a data pipeline, two API keys and a decision — but only if we move now, because §8 of
`coparison.md` shows they are already hiring into our differentiator.

**Advantages on this page hold only if `coparison.md` P0 ships.** A better product nobody can
find, with 12 listings and no way to pay, wins nothing.

---

*Companion document: `coparison.md` — the full teardown and the build gap list.*
