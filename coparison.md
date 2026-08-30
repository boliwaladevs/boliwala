# FindAuction.in — Competitive Teardown & Build Gap List

**Prepared:** 30 August 2026
**Method:** Direct inspection of the live public site (homepage, `/search`, `/pricing`,
`/faq`, `/about-us`, `/contact`, `/blog`, `/jobs`, `/register`, `/login`, city pages, bank
pages, individual auction pages), plus `robots.txt`, `manifest.json`, `sw.js` and page source.
**Viewpoint:** Guest / unauthenticated. Anything behind their paywall is inferred from their
own published feature list and their gating markup, and is marked as such.

> **Note on the brief.** The premise "they do not offer support" is **not accurate as
> stated**. Every FindAuction Premium tier explicitly lists **"Email support"**. What they
> genuinely do not have is *done-for-you service*. Our support differentiator therefore has
> to be sharper than "we have support" — it has to be **a named human, on phone + WhatsApp,
> with a published SLA, attached to the auction outcome.** See §7.

---

## 1. TL;DR — the honest scoreboard

| | FindAuction | Boliwala (today) |
|---|---|---|
| Live inventory | **96,234 indexed properties**, 140+ cities | **12 properties, 11 cities, 6 banks** |
| Age / trust | Founded 2018, Mumbai, 8 years of SEO | Pre-launch |
| Annual price | ₹7,000/yr (or ₹2,500 / 3 months) | ₹999/yr |
| Free tier | Address, notice and officer contact all paywalled | **Full address always free** |
| Free unlocks on signup | 3 | 5 |
| Mobile app | **Play Store app + PWA + web push** | None |
| Asset classes | Property **+ cars + plant & machinery** | Property only |
| Auction history per property | **Yes — 17 prior auctions linked on one flat** | No |
| Price-drop / re-auction badges | **Yes** | No |
| Shortlist / saved properties | **No** | Yes |
| Saved-search alerts (self-serve) | Premium only, **daily batch** | Yes, free, real-time by design |
| Done-for-you auction service | **No** — but hiring for it (§8) | ₹9,999 + 1% (spec'd, not built) |
| Channel partner programme | **No** | Spec'd, not built |
| Payments live | Yes (Razorpay) | **Blocked on client keys** |

**The one-line read:** we win on *product design, pricing and business model*; they win
decisively on *content, distribution and time in market*.

**Our single biggest competitive gap is not a feature — it is 96,222 missing properties.**
Everything in §6 P0 exists to close that.

---

## 2. What FindAuction actually is

- **Mumbai-based, founded 2018.** Office: S-10, Zoom Plaza Mall, Gorai, Borivali West,
  Mumbai 400092. Contact routing is segmented: `hello@` (support), `admin@` (banks wanting
  to list), `sales@` (business/promotion), `job@` (hiring).
- **Positioning, in their own words:** "India's largest online marketplace for all kinds of
  bank auction assets… 1000+ individuals helped." About-page stats: founded 2018,
  **17,800+ total properties, 1,060+ commercial, 450+ vehicles.** Their all-listings page
  title says **96,234** — so ~17.8k live, ~96k all-time including expired.
- **Their explicit scope limit, stated on About:**
  > *"FindAuction is a subscription-based platform that provides information about upcoming
  > auctions. We do not conduct auctions; our service is solely focused on helping users
  > discover auction opportunities through our membership plans."*

  **That single sentence is the entire gap Boliwala is built to fill.**
- **Data source: IBAPI.** Their image CDN paths are literally
  `cdn.findauction.in/ibapi/cache/filedata/…` — they ingest and cache the IBAPI feed.
- **Stack:** legacy PHP + Bootstrap-3-era front end; Workbox service worker; Razorpay;
  GA (`UA-133555870-2`) + Google Ads conversion tag (`AW-681858846`) + GTM (`GTM-TTTR3JJ7`).
  The Android app is a **TWA** (`in.findauction.twa`) with a Capacitor wrapper for
  status-bar handling — i.e. the app is the website in a shell, built cheaply.

---

## 3. Their pricing (verified on `/pricing`)

| Plan | Price | Anchor shown | Note |
|---|---|---|---|
| 3 Month | **₹2,500** | — | "Refund on 1st week Cancellation" |
| 6 Month | **₹4,000** | ₹5,000 | "Save 20%" |
| 1 Year | **₹7,000** | ₹10,000 | "Save 30%" |

All GST-included, paid via Razorpay. **Identical feature list on every tier:**
Auction Document/Notice · Auction History · Daily mobile notification · Daily email alert ·
Multiple city email alert · **Email support**.

Free-trial hook shown on every gated listing: **"Register Now & Claim 3 Free Auction Details!"**

**Read:** their tiers differ only in *duration*, not capability. It's a pure time-based
paywall with no upgrade ladder above ₹7,000 and no second revenue product.

---

## 4. Their listing page — exactly what is gated

Sampled: `/auction/canarabank/flat-in-parishram-apartment-rajmohalla-indore-1770930`

**Free to a guest:**
bank name · property type · **building / society name** ("Parishram Apartment") · locality ·
city · area (Sq Ft / Sq Mtrs) · possession type · reserve price · **reserve price per Sq Ft** ·
EMD amount · **bid increment** · **EMD submission deadline (date + time)** ·
**auction start AND end date + time** · breadcrumbs (Home › Indore › Canara Bank) ·
similar properties in the same locality · share buttons.

**Paywalled:**
- **Full address** — replaced with a notice + an "Unlock Full Address" button
- **Borrower name** — shown as `Mrs Unlock full borrower`
- **Bank / authorised officer contact** — masked as `Mr Banker Info 9XXXXXXXXX`
- **Auction notice PDF** — "Download Auction File → GET PREMIUM"

**One nice touch worth stealing:** a live banker-availability note —
*"The bank is closed today, please contact the banker on the next working day after
10:00 AM."* Small, human, and it prevents a wasted phone call.

---

## 5. Full feature inventory — what they have that we don't

### 5.1 Data & content depth
1. **96,234 properties across 140+ cities**, with live counts on the homepage
   (Mumbai 9,462 · Pune 3,369 · Surat 3,349 · Bangalore 1,983 · Kolkata 1,666 · New Delhi
   1,483 · Chennai 1,436 …).
2. **Asset classes beyond property**: `Car`, `Plant and Machinery`, `Industrial Plots, Land
   & Sheds`, `Factory Land & buildings`. Dedicated `/cars/{city}` hubs across ~60 cities.
3. **Full lender coverage, not just banks.** ARCs and NBFCs are first-class citizens:
   Edelweiss ARC, Phoenix ARC, HDB Financial Services, Cholamandalam, AU Small Finance,
   Jana Small Finance, RBL, Yes Bank, Hinduja Leyland Finance.
4. **Auction History — the single strongest data asset they own.** The same physical flat in
   Rajmohalla, Indore is linked to **17 prior auction records** stretching back years. A buyer
   can see it has repeatedly failed to sell, and watch the reserve-price trajectory.
5. **Derived fields** — reserve price **per Sq Ft**, computed and displayed.
6. **Building / society / project name** as a structured field ("Parishram Apartment",
   "Rajat Complex", "The Indore Central Mall"). Big for buyer confidence and for search.

### 5.2 Search & browse
7. **Advance Search** carries fields we don't have: **Borrower Name**, **From Date / To Date**
   (auction date range), Bank Name autocomplete, free-text keyword.
8. **Sort options:** Default · **Popular** · Newest · Recent · Price high→low · Price low→high.
9. **Quick-filter chips** on every city page: Popular · Car Auction · Physical · Symbolic.
10. **Price-drop badge** on result cards: *"5% Drop from ₹8,50,000"*, *"33% Drop from ₹6,00,000"*.
11. **Re-auction badge**: *"Re auction - Same Price"*.
12. **Constructive Possession** as a third possession type — we model only Physical/Symbolic.

### 5.3 SEO & distribution — their real moat
13. **A landing-page matrix on clean URLs:**
    `/bank-property/{city}` · `/bank-property/{city}/{bank}/all` · `/{bank}` (e.g. `/canarabank`) ·
    `/flat/{city}` · `/residential/{city}` · `/commercial/{city}` · `/cars/{city}` ·
    `/bank-property/{city}/all/{type}`.
    That is roughly **cities × lenders × types = tens of thousands of indexable pages.**
14. **Count-bearing title tags:** *"497 Bank auction property in Indore | Flat, House &
    Office"*, *"13236 Canara Bank auction property in India"*. Listing titles carry the
    reserve price **and** the auction date.
15. **Breadcrumb navigation** on every listing page.
16. **A blog with ~15+ posts**, including **Hindi-language content**, evergreen guides
    (7 Things to Check Before Bidding · Physical vs Symbolic Possession · Will I lose my EMD ·
    Can you get a loan for auction property) and **timed "Mega Auction" event posts**
    (Canara Bank, Union Bank, Indian Bank, Bank of Maharashtra) — a repeatable traffic-spike play.
17. **`/jobs` and `/sitemap` pages** as extra indexable surface.
18. **A defensive `robots.txt`** — blocks GPTBot, **ClaudeBot**, Bytespider,
    meta-externalagent, AhrefsBot, MJ12bot, DataForSeoBot, BLEXBot, PetalBot, amazonbot;
    bingbot gets a 20s crawl delay. They are actively protecting their index from AI
    scrapers *and* from competitor SEO tooling.

### 5.4 Mobile & re-engagement
19. **Android app on the Play Store** (`in.findauction.twa`), with
    `prefer_related_applications: true` so the PWA defers to it.
20. **A full PWA** — manifest with maskable icons, three store screenshots, `standalone`
    display, `window-controls-overlay` override, UTM-tagged `start_url`, and a Workbox
    service worker (v2.51) doing cache-first static assets plus a cached city-data endpoint.
21. **Web push notifications** ("Daily mobile notification") — app-grade re-engagement
    without requiring an install.

### 5.5 Account & conversion
22. **Google Sign-in** on register. (Ours is spec'd at Sprint 2.5, credentials confirmed
    live since 9 August, still not shipped.)
23. **Redirect-preserving auth**: `/login?red=<original-url>` and `/pricing?red=<original-url>`,
    so a paywall click returns the user to the exact property afterwards.
24. **Razorpay live**, with a defensive "in case of payment deducted please wait" note.
25. **A refund policy stated on the pricing page** (first-week cancellation) — a trust signal.
26. An `icon-promoted` entry exists in their SVG sprite → they have, or are building,
    **promoted / featured listings**: a lender-side ad product.

---

## 6. WHAT WE NEED TO BUILD — prioritised

### P0 — Existential. Nothing else matters until these ship.

**P0.1 — Inventory. Get to 50,000+ live listings.**
> A better product with 12 properties loses to a worse product with 96,234. Every session
> that ends in "no results in my city" is a permanently lost user.

- Build `scripts/ingest/` per `INFRA_R2_SCALING_ANALYSIS.md` §9: resumable, batched (~500),
  idempotent by external ID, per-row failure reporting that doesn't abort the batch.
- **A source decision is required from the client:** IBAPI licence (what FindAuction uses),
  direct bank-portal ingestion, or a purchased dataset. This is a **blocking commercial
  decision, not an engineering one** — escalate it this week.
- Extend the existing xlsx bulk-upload with bulk **image** and bulk **PDF** association.
- Automate a **daily refresh + expiry job**: mark past-auction-date listings expired rather
  than deleting them — they become our Auction History corpus (P1.1).

**P0.2 — Cover ARCs and NBFCs, not just banks.**
Roughly half the live inventory on their city pages is Edelweiss ARC, Phoenix ARC, HDB,
Cholamandalam, AU SFB, Jana SFB. Our schema and our "6 banks" framing under-model this.
Rename the concept to **Lender**, with a `lender_type` of Bank / NBFC / ARC / HFC.

**P0.3 — The SEO landing-page matrix.**
We have exactly one indexable search surface. They have tens of thousands. Build,
server-rendered:
- `/auctions/{city}` · `/auctions/{city}/{lender}` · `/lender/{lender}` ·
  `/auctions/{city}/{propertyType}`
- Title pattern: `{count} Bank Auction {Type} in {City} — Reserve from ₹{min} | Boliwala`
- Breadcrumbs, auto-generated `sitemap.xml` per surface, and JSON-LD structured data.
- **Do this before launch, not after.** Indexing compounds from day one; they have an
  eight-year head start we can only close by out-covering them.

**P0.4 — Payments (Razorpay) and transactional email (Resend).**
Already the known critical path. They have both live today. Nothing in this document changes
the fact that these have been blocked on client credentials since 17 August.

### P1 — Parity gaps that cost us deals

**P1.1 — Auction History per property.**
Their best feature. Requires a **property identity key** (lender + borrower + survey/flat no.
+ locality, fuzzy-matched) that survives across auction cycles, so re-listings link back to
the same property record. Then render a timeline: date, reserve price, outcome, % change.
*This is also our best answer to "why is this so cheap?" — it shows a property has failed to
sell four times, which is precisely what a serious buyer needs to know.*

**P1.2 — Price-drop and re-auction badges.**
Falls out of P1.1 almost for free, and it's the highest-signal element on a results card:
`"12% drop from ₹8,50,000"` / `"Re-auction — same reserve"`.

**P1.3 — Search fields we're missing.**
Borrower name · auction date range (from/to) · reserve price per Sq Ft · building/society
name · bid increment · EMD submission deadline · Constructive possession as a third type.

**P1.4 — Sort by popularity.**
We already track real, server-side view counts. Expose them as a sort option. Cheap to build,
and it's their default ordering.

**P1.5 — PWA + web push.**
Manifest, service worker, install prompt, and push for "new match in your city" and "your
saved auction is tomorrow". This is ~80% of the value of a native app at ~5% of the cost, and
it's the only re-engagement channel that still works when email lands in Promotions.

**P1.6 — Google Sign-in (Sprint 2.5).**
Credentials confirmed live since 9 August. Ship it — signup friction on a mobile-first Indian
audience is real and measurable.

**P1.7 — Redirect-preserving auth.**
`/login?next=<url>` from every gated CTA. We currently drop the user's context on the way to
login, which is a silent conversion leak.

**P1.8 — Property photos at scale.**
Note that they are *weak* here too — only 2 of 15 listings on the Indore city page carried an
image. Pull notice/IBAPI imagery in the ingest pipeline (the R2 rendition design already
exists) and we beat them on visual scan, which is what actually converts a browse.

### P2 — Where we should out-build them rather than match them

- **P2.1 — Vehicles + plant & machinery.** They earn real traffic from `/cars/{city}` across
  60 cities; our schema is property-only. *Recommend: defer past 15 Sep, but design the schema
  now so it isn't a rewrite later.*
- **P2.2 — Map view + locality clustering.** They have none. Neither do we.
- **P2.3 — Compare (2–4 properties side by side).** Neither of us has it.
- **P2.4 — EMI / bid-budget calculator.** Reserve + EMD + our 1% + stamp duty + registration →
  "what this actually costs you". A natural cross-sell into the ₹9,999 package.
- **P2.5 — Add auction date to calendar (.ics / Google Calendar).** They have a
  `calendar-plus-o` icon in their sprite but don't appear to use it. Trivial, genuinely useful.
- **P2.6 — Mega-auction event pages.** Their highest-traffic content play. When a bank runs a
  1,000-property mega auction, we should have a landing page live the same day.
- **P2.7 — Hindi (then Marathi / Tamil / Telugu).** They have exactly one Hindi post. The
  bank-auction buyer base is overwhelmingly not English-first.

### P3 — Things they do that we should deliberately NOT copy

- **Paywalling the full address.** It is our entire differentiator. Never.
- **Duration-only tiers.** No capability ladder, no reason to upgrade, no second product.
- **"Daily" alerts.** Our spec is real-time on listing publish. Keep it.
- **A dated, text-dense UI** with no faceted sidebar and almost no imagery on city pages.
- **Blocking AI crawlers.** In 2026, being absent from AI answer engines is a strategic error,
  not protection. We should be *aggressively legible* to them — structured data, clean
  semantics, an open `robots.txt`, and an `llms.txt`.

---

## 7. The support / service gap — corrected framing

They advertise **"Email support"** on all three tiers, so "we offer support, they don't" is
not a defensible claim as written. What *is* defensible:

| | FindAuction | Boliwala |
|---|---|---|
| Support channel | Email only | **Phone + WhatsApp + email**, named person |
| Response commitment | None published | **Publish an SLA** (e.g. 4 business hours) |
| Scope of help | Site / billing questions | **The auction itself** |
| Due diligence | Not offered | Title search, legal search, valuation |
| Bid execution | Not offered | End-to-end bid management |
| Post-win | Not offered | Possession support + loan assistance |
| Alignment | Subscription only — paid whether you win or lose | **1% success fee — we only get paid if you win** |

Their own About page draws the line for us: *"We do not conduct auctions."* The ₹9,999 + 1%
package is the product they have explicitly declined to build.

**Action:** make the support commitment concrete and visible on the pricing page — channels,
hours, first-response SLA, and a named human. A vague "support included" bullet reads exactly
like their "Email support" bullet and wins us nothing.

---

## 8. ⚠️ Threat watch — they are moving into our lane

Their `/jobs` page currently advertises:

> **Sales Support Executive / Manager – Auction Property (Mumbai)** — *"Looking for an
> experienced person who has worked in auction property field… Work includes **banker
> coordination, inspection scheduling, key collection follow-up, client coordination, field
> team support, and auction process support**."*

…plus a **Customer Relationship Associate** role for inbound service and **cross-sell**.

That is, line for line, the operational spine of a done-for-you auction service.

**Our ₹9,999 + 1% moat is a timing advantage, not a structural one.** They already have the
inventory and the traffic. If they add the service layer before we add the inventory, we lose
both halves of the comparison. This raises the urgency on P0.1 considerably.

---

## 9. Recommended sequencing

| Order | Work | Why |
|---|---|---|
| 1 | **Client decision: inventory data source** (P0.1) | Blocking, commercial, longest lead time |
| 2 | Razorpay + Resend (P0.4) | Already the known critical path |
| 3 | Lender model: Bank / NBFC / ARC (P0.2) | Schema change — cheapest *before* 50k rows land |
| 4 | Ingest pipeline + daily refresh/expiry (P0.1) | The actual gap-closer |
| 5 | SEO landing-page matrix + sitemap (P0.3) | Indexing lead time compounds; start early |
| 6 | Property identity key → Auction History + drop badges (P1.1 / P1.2) | Their best feature; needs the historical rows P0.1 brings |
| 7 | PWA + push, Google sign-in, redirect-preserving auth (P1.5–1.7) | Fast wins, direct conversion impact |
| 8 | Extra search fields + popularity sort (P1.3 / P1.4) | Parity polish |
| 9 | Calculator, compare, map, .ics, mega-auction pages (P2) | Out-build, post-launch |

---

## 10. Open questions for the client

1. **Where does our inventory come from?** IBAPI licence, direct ingestion, or a purchased
   dataset? Nothing else on this list matters until this is answered.
2. **Do we list vehicles and plant & machinery?** They earn real traffic from `/cars/{city}`.
3. **Is the Channel Partner portal in or out for 15 September?** Still unanswered from the
   last demo — and it's a differentiator they have no equivalent for.
4. **What support SLA are we willing to publish?** Channels, hours, first-response time.
5. **Is ₹999/yr right, or are we leaving money on the table?** They charge 7× that for a
   thinner product. See `upper.md` §6.

---

*Companion document: `upper.md` — where Boliwala is already ahead.*
