# CLIENT_REQUIREMENT.md — what we need from Boliwala to launch

**Date:** 1 September 2026
**Status of the build:** the entire pre-launch engineering queue (`immediate_plan.md`
W0–W8) is **complete, committed and deployed**. Everything on this list is now the
critical path. None of it is engineering work — each item is a credential, a file, a
decision, a payment, or thirty minutes of someone's time.

> **How to read this:** §1 is what blocks launch. §2 is commercial. §3 is what you have
> already answered, recorded so nobody asks twice. §4 is what we are deliberately *not*
> asking you for yet.

---

## AT A GLANCE

| # | What we need | Blocks | When |
|---|---|---|---|
| 1.1 | **One sample listings CSV/Excel** | The entire data pipeline | **Now — top priority** |
| 1.2 | **30-minute infra meeting** — R2 card, Workers upgrade, domain | Images, PDFs, and going live on `boliwala.com` | **This week** |
| 1.3 | **Logo + brand assets** | Site identity, favicon, link previews | Week of 8 Sep |
| 1.4 | **Privacy Policy text** | Legal compliance at launch | Week of 8 Sep |
| 1.5 | **Terms of Service text** | Legal compliance at launch | Week of 8 Sep |
| 1.6 | **Contact details** — phone, WhatsApp, email, address | Footer, contact page, WhatsApp CTAs | Week of 8 Sep |
| 1.7 | **Meta Business account credentials** | WhatsApp / SMS OTP login | **Start now** — 3–7 day third-party approval |
| 1.8 | **Confirm the annual membership price** | Pricing page **and** partner commissions | **This week** |
| 1.9 | **Partner tier thresholds** | Automatic tier assignment | Before partner onboarding |
| 2.1 | **₹12,000** — balance of the first advance | — | **3 September 2026** |
| 2.2 | **₹30,000** — mid-project advance | — | **3 September 2026** |

---

# §1 — WHAT BLOCKS LAUNCH

## 1.1 One sample listings file (CSV or Excel) — TOP PRIORITY

**We need one file. Not the dataset — one representative file.**

This is the single largest blocker in the project. The bulk ingest pipeline reads your
inventory, and its **deduplication key** — the rule that decides whether an incoming row
is a new auction or an update to one we already hold — cannot be designed without seeing
your real column names and how a repeated listing actually looks in your data.

A dedup key designed against imagined column names is worse than no dedup key at all,
because it looks finished while quietly creating duplicates or silently swallowing new
listings.

**What the file should contain:**
- Real column headers, exactly as your source system writes them
- 20–50 real rows — the point is realistic variety, not volume
- If a listing can appear twice across files or dates, please include such a case
- If your system has a unique listing or auction ID, include that column

**What we do with it:** the importer already understands several spellings of the lender
column (`bank`, `bankname`, `financialinstitution`), so your file's own spelling should
map on arrival. We then design the dedup key and build the daily refresh job.

**Also useful if it exists:** one sample auction/sale notice PDF and two or three sample
property images, so the document and image pipeline is built against real files rather
than assumed ones.

---

## 1.2 A 30-minute meeting to put the infrastructure live

One short session with whoever holds the company card and the domain registrar login.
**Three things, same sitting, roughly 30 minutes.**

### (a) Cloudflare R2 — card on file

R2 is the object storage for **listing images and auction PDFs**. Enabling it requires a
payment method on the Cloudflare account. Today the command returns *"Please enable R2
through the Cloudflare Dashboard"*, and the entire documents-and-images workstream is
parked behind it — deliberately left unbuilt rather than half-built against a bucket
that does not exist.

- **Cost:** R2's free tier is 10 GB of storage with **no egress charges**. At our
  projected volume this is expected to cost **₹0 for the foreseeable future**. The card
  is required to *unlock* the service, not because the bill will be large.
- **Alternative offered and declined:** Supabase Storage needs no card. You chose R2.
  That decision stands; we simply need the card on the account.

### (b) Cloudflare Workers — paid plan upgrade

The site runs as a Cloudflare Worker. The **free plan caps the deployed bundle at 3 MB
compressed, and a deploy over that cap is rejected outright** — not slowed, rejected.
The measured figure is in §1.2(b) note below and in `MEMORY.md` §41.

- **Cost:** Workers Paid is **$5/month (about ₹450)**. It raises the cap from 3 MB to
  10 MB and removes the 100,000/day request limit.
- **Why it is on this list:** this is the one thing that can break a working deployment
  without anybody touching the code — the next feature we add is the one that fails to
  deploy. Buying the headroom for ₹450/month is cheaper than discovering the ceiling on
  launch day.

### (c) Connect `boliwala.com`

The domain is purchased. We need its **nameservers pointed at Cloudflare**, which needs
the login to the registrar where it was bought. Once that is done we can:

- Serve the live site at `boliwala.com` instead of the temporary `*.workers.dev` address
- Stand up `cdn.boliwala.com` for images and documents
- Finalise the Google sign-in and email-confirmation redirect URLs, which have to name
  the real domain

**Please bring:** the Cloudflare account login, a company card, and the domain registrar
login.

---

## 1.3 Logo and brand assets

The site currently renders a **generated placeholder mark**. We need:

| Asset | Format | Used for |
|---|---|---|
| Primary logo | SVG preferred, else PNG 1000px+ wide, transparent background | Header, footer, partner portal |
| Logo mark / icon only | SVG, or square PNG 512×512 | Favicon, app icon, mobile |
| Brand colours | Hex codes | Buttons, links, accents |
| Social share image | 1200×630 PNG/JPG — or we generate one from the logo | WhatsApp / LinkedIn / X link previews |

If a full brand kit is coming later, **send the logo alone first.** It unblocks most of
the visual work by itself.

---

## 1.4 Privacy Policy

`/privacy` is **live and linked in the footer today**, carrying a visible "being
finalised" placeholder. The page was built so that your text is a paste, not a build.

**Send the finalised policy text.** It has to genuinely cover what the platform does:

- What we collect — name, email, phone number, and Google sign-in profile data
- Authentication and session cookies
- The **referral cookie** for the channel partner programme, and its 30-day window
- Any analytics you want added
- Where the data lives — user data in Supabase, files in Cloudflare R2 once enabled
- User rights: access, correction, deletion, and who to contact for each

Send us the draft and we will check it against what the code actually does, and flag
anything the policy claims that the platform does not do. That mismatch is the usual
source of trouble.

---

## 1.5 Terms of Service

Same position: `/terms` is live with a placeholder body, awaiting your text.

**Points the terms need to address, because the product does them:**

- The **annual membership** — what it grants, how long it lasts, the refund position
- The **service package**, and what is and is not promised
- The **channel partner programme** — commission at 10% / 15%, when a commission is
  *earned*, when it is *approved*, and when it is *paid*. It should also state that a
  partner's claim on a referral is exclusive and first-come, because the system enforces
  exactly that: a second partner can never claim someone already referred.
- A disclaimer on listing accuracy — the data originates from lender auction notices
- Prohibited use, and grounds for account termination

---

## 1.6 Contact details

Three configuration values are **empty in production right now**. The site is
deliberately built to render *nothing* rather than a fake placeholder, so today the
footer and contact page simply omit them.

| We need | Used where |
|---|---|
| **Contact phone number** | Footer, contact page, structured data for Google |
| **WhatsApp business number** | WhatsApp CTAs, the Contact Sales flow |
| **Support email address** | Footer, contact page, replies to sales enquiries |
| **Registered office address** | Footer, legal pages, Google business listing |

If the phone and WhatsApp numbers are the same, say so and we will use one for both.

---

## 1.7 Meta Business account credentials

This buys phone verification at **₹0.13 per WhatsApp OTP** instead of ₹4–6 on
international SMS routes. Full detail is in `CLIENT_ACTIONS_FOR_SMS.md`; the short
version:

1. **Meta Business Manager access** — either add us as a partner, or complete the steps
   yourselves and hand over the generated token.
2. **Business Verification** in Meta's Security Center — needs your GST certificate and
   Certificate of Incorporation. **Meta takes 1–3 days to approve. Start this now.**
3. **A dedicated, clean phone number** to be Boliwala's WhatsApp sender. Critical: it
   must **not** currently be registered on the WhatsApp or WhatsApp Business app.
4. **A card on the Meta Developer console**, for message costs.
5. **A Permanent Access Token**, generated from a System User.

**Related, and equally slow — DLT registration.** For the SMS fallback at about ₹0.18
instead of ₹4–6, Indian telecom regulation requires Boliwala to register as a Principal
Entity on a DLT portal (Jio, Vi or Airtel), with a **one-time fee of roughly ₹5,900**,
then register a six-letter sender ID such as `BOLIWA` and the OTP message template.
Approval takes 2–3 days. **This is required even if we route SMS through Twilio.**

Both are third-party document reviews. They are the two items on this list with the
longest lead time and no way to accelerate them, so please start both this week even if
everything else waits.

---

## 1.8 Confirm the annual membership price

**The live settings say the annual membership is ₹2,999. Every specification document we
were given says ₹999.**

This is not a bug — the number is read from the database and used consistently — but one
of the two is wrong, and it matters in more places than the pricing page:

- The pricing page shows whichever value is in settings.
- A **channel partner's 10% commission is computed from it.** Our end-to-end test earned
  a partner **₹300, not ₹100**. The arithmetic is correct; the input may not be.

**We need a one-line answer: is the annual membership ₹999 or ₹2,999?** Either way it is
a single field in Admin → Settings. We just need to know which is intended before real
partners start earning against it.

While you are answering, please also confirm the **service package price** (spec says
₹9,999) and the **success fee** (spec says 1%).

---

## 1.9 Channel partner tier thresholds

Commission rates are settled and live — **10% of an annual membership, 15% of a service
package**. What is still open is **what makes a partner Silver, Gold or Platinum.**

The system stores the thresholds as `null` today and the admin panel says "not decided
yet", which is honest and works: **an admin assigns a tier by hand**, which is what your
product spec describes anyway. Nothing is blocked.

But if tiers are meant to be earned automatically, we need the rule — for example *"Gold
at 10 converted referrals, or ₹50,000 lifetime commission"* — and whether a higher tier
changes the commission rate or is recognition only.

---

# §2 — COMMERCIAL

## 2.1 First advance — balance outstanding

| | Amount |
|---|---|
| First advance, as quoted | **₹30,000** |
| Received to date | **₹18,000** |
| **Balance due** | **₹12,000** |
| **Due by** | **3 September 2026** |

## 2.2 Mid-project advance

The **mid-project advance of ₹30,000** falls due on the same date, **3 September 2026**,
now that the pre-launch queue is complete.

> ### Total payable on 3 September 2026: ₹42,000
> ₹12,000 balance of the first advance + ₹30,000 mid-project advance.

If your reading of the schedule differs from ours, tell us before the 3rd and we will
reconcile against the original quote.

---

# §3 — ALREADY ANSWERED (recorded so nobody asks twice)

| Question | Your answer |
|---|---|
| Channel partner commission rates | **10%** of an annual membership, **15%** of a service package *(1 Sep 2026)* |
| Are auction PDFs behind the credit paywall? | **No — PDFs are freely public** |
| Storage: R2 or Supabase Storage? | **R2 only.** Supabase Storage was offered as a no-card alternative and declined *(1 Sep 2026)* |
| Admin UI for managing lenders? | **Not scoped** — confirmed against the product spec, which lists the whole admin panel and contains no lender management *(1 Sep 2026)* |
| Contact Sales notifications | **Admin panel only** — no email or SMS notification needed *(1 Sep 2026)* |
| Razorpay / online payments | **Deferred by your decision.** Membership and package sales run through Contact Sales, with a manual grant in admin once payment is taken offline |
| SEO landing pages | You want them **just before launch**. They are unblocked and can be pulled forward at any time — search indexing compounds, so earlier is strictly better |
| Domain | `boliwala.com` purchased; needs connecting — see §1.2(c) |

---

# §4 — WHAT WE ARE **NOT** ASKING YOU FOR YET

Listed so you know these were considered and consciously deferred, not forgotten.

- **Google Play / App Store developer account credentials.** The Android build is not
  ready, so the developer account and its credentials are not needed yet. We will ask
  when there is an APK to upload.
- **Razorpay merchant credentials.** Deferred along with the payments integration
  itself, by your decision.
- **Marketing creatives for partners.** The partner portal has the section, showing an
  honest empty state. It needs both file storage (§1.2a) and your artwork, so it waits
  behind the R2 meeting.
- **Real "trust" statistics for the About page.** The figures previously shown —
  ₹2,100 Cr won, 840+ auctions, 28% average saving — were **removed because nothing
  supports them.** If you have figures you can substantiate, send them and we will put
  them back. If not, the page reads honestly without them.

---

## THE ONE-LINE SUMMARY

**Send one sample CSV, and give us thirty minutes with the company card and the domain
login.** Those two things unblock more than everything else on this list combined.

---

*Maintained alongside `MEMORY.md`. Last updated 1 September 2026.*
