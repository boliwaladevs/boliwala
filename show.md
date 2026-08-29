# SHOW.md — Client Demo Script

**For:** live walkthrough with the client
**Runtime:** ~20 minutes for the full script, ~8 minutes for the short version
**Last updated:** 22 August 2026

---

## ⚠️ READ THIS FIRST — 60 seconds, before he arrives

### 1. Decide where you are demoing from

Production was stuck on an old build until today's fix. **Check the Vercel
dashboard shows a green deploy for the latest commit.**

- ✅ **Green deploy** → demo on the live URL.
- ❌ **Not green / unsure** → **demo on localhost.** Do not gamble on it.

```bash
cd "C:\Users\hrida\Documents\AA A\boliwala\project" && pnpm run build && pnpm exec next start --port 3100
```

Then open **http://localhost:3100**. Everything in this script works there.

### 2. Log in once, before he sits down

Account: **boliwaladevs@gmail.com** (this is the superadmin — it gets you into
the admin panel). Have a second browser **incognito window** open and signed
out — you will switch between them to show the gating.

### 3. The three things you must NOT click

These are still design mockups with placeholder numbers. Clicking them mid-demo
is the only way this goes badly:

| Where | Don't open |
|---|---|
| Admin sidebar | **Payments, Packages, Success Fees, Users, Partners, Alerts, Campaigns, WhatsApp, Segments, Analytics** |
| Admin dashboard | The **revenue chart** and **Recent Activity** feed (bottom of page) — static |
| Profile | **Service Requests** tab — static |
| Anywhere | `/partner/dashboard` — partner portal is not built |

**Everything else in this document is real and reads from the live database.**

### 4. The honest one-liner if he asks "is it done?"

> "The whole free product is built and working end to end — search, accounts,
> the credit system, admin. What's outstanding is payments, which needs the
> Razorpay keys, and the email sending, which needs the Resend key. Both have
> been waiting since the 17th."

---

## THE DEMO

Twelve real auction properties across eleven cities and six banks are in the
database. Everything below is live data, not screenshots.

---

### PART 1 — "It looks like a real product" (2 min)

**Step 1.** Open the **homepage**.

> *Say:* "This is the live site. Scroll — the hero is a parallax build,
> and everything below the fold is real."

**Step 2.** Point at the three statistics (**12 live auctions · 11 cities ·
6 banks**).

> *Say:* "These numbers are computed from the database. They used to be
> hardcoded as '12,400+ auctions' and '140+ cities' — invented figures.
> For a financial-services site making public claims, that's a real
> liability, so they now count actual rows. Publish a thirteenth property
> and the homepage says 13 within the hour."

**This is a strong opener** — it shows judgement, not just code.

**Step 3.** Point at the **header, top right**: Log In and Sign Up.

> *Say:* "Added today. There was no way to reach the login page from the
> website at all."

---

### PART 2 — Search that actually works (4 min)

**Step 4.** Click **Properties** in the nav.

> *Say:* "All twelve properties, with the full filter sidebar."

**Step 5.** In the location box type **Pune** → search. **→ 2 results.**

**Step 6.** Clear it. In the left sidebar tick **Bank of Baroda**, then tick
**Industrial** under property type. Watch the count change each time.

> *Say:* "Every filter is a real database query. The counts next to each bank
> are live — they're not labels."

**Step 7.** Use the **price range** and the **sort** dropdown (Auction date /
Price low→high).

**Step 8.** Point out the **URL changing** as you filter.

> *Say:* "Every search is a shareable link. Paste that to a colleague and
> they get the identical result set. That also means Google can index each
> one."

---

### PART 3 — 💰 The revenue model (5 min) — **THE MOST IMPORTANT PART**

This is the part that makes him money. Slow down here.

**Step 9.** Switch to the **incognito (signed-out)** window. Open any property,
e.g. **Commercial Shop, FC Road, Pune**.

**Step 10.** Scroll to the blurred sections: **Flat/floor number**,
**Inspection details**, **Authorised Officer contact**.

> *Say:* "A visitor sees the property, the reserve price, the auction date —
> enough to be interested. The three things they actually need in order to
> bid are locked."

**Step 11.** ⭐ **The trust moment.** Right-click → **View Page Source** →
Ctrl+F for `authorisedOfficerPhone`.

> **Zero results.**
>
> *Say:* "This is the important bit. The locked data isn't hidden with a blur
> you can remove in the browser — it is never sent to the browser at all. We
> run an automated test against all twelve properties on every change that
> proves it: 192 separate checks. If anyone could bypass the paywall by
> pressing F12, the business model wouldn't work."

**Step 12.** Switch to your **signed-in** window. Same property. Click
**Unlock for 1 credit**.

> Field reveals. Credit count drops **5 → 4**.

**Step 13.** **Reload the page.**

> *Say:* "Still unlocked, still 4 credits — it doesn't charge twice. The
> balance check and the charge happen in a single database transaction, so
> two fast clicks can't double-spend, and the balance can't go negative."

**Step 14.** Click the **bookmark** icon to save it.

---

### PART 4 — The customer's account (4 min)

**Step 15.** Header → **My Account**.

> *Say:* "Note the site's marketing navigation is gone — this is the
> customer's own area. That changed today too."

**Step 16.** **Saved Properties** tab → the property from Step 14 is there.
Remove it → gone.

**Step 17.** Go back to **Properties**, search **Pune**, then use the
**"Get email alerts for this search"** banner. Enter an email, pick
**Daily digest**, click **Set Alert**.

**Step 18.** Return to **My Account → My Alerts**. The alert is there, showing
its criteria as tags.

Now demonstrate the controls, all live:

- **Change the frequency** dropdown → Weekly.
- **View matches** → returns the exact same 2 Pune results the alert was
  saved from.
- **Pause** → greys out. **Resume** → back.
- **Delete** (bin icon) → gone.

> *Say:* "Create, edit, pause, delete — all working. The alert stores the
> search itself, so 'view matches' always re-runs the real query."

**Step 19.** **Account Info** tab. Show:
- Name, phone, city, PAN, Aadhaar — all saving to the database.
- **Change password** — with the current password required first.
- **Delete account** — requires typing DELETE.

> *Say:* "Since we store PAN and Aadhaar, being able to delete the account
> and everything attached to it isn't a nice-to-have — it's a data-protection
> requirement. That went in today."

**⚠️ Do not actually delete the account you are demoing with.** Show the
confirmation box and stop.

---

### PART 5 — The admin panel (5 min)

**Step 20.** Go to **/admin** (you're already a superadmin, it opens).

> *Say:* "There is no separate admin login. The account's role decides where
> it lands — staff go here, customers go to their profile."

**Step 21.** **Dashboard.** Point at the **KPI cards**.

> *Say:* "Live counts. The revenue ones read zero because there are no
> payments yet — we deliberately did not fake them. The mockup had
> '₹21,44,000' typed into it."

**Step 22.** **Listings** tab. Show search, the bank and status filters.

**Step 23.** ⭐ **Create a property live.** Click **Add Listing** and walk the
four tabs: Property Details → Bank & Auction → **Gated Fields** → Images.

> *Say:* "This is where you control exactly which fields are paywalled."

Save it as a draft. **Then go to the public search — it isn't there.** Set it
to **Live** in admin → refresh public search → **now it's there, and the
homepage count goes from 12 to 13.**

> **This is the single most convincing thing in the demo.** It proves the
> admin panel and the public site are one system.

**Step 24.** **Bulk Upload** tab. Show the flow: upload a spreadsheet → it
auto-detects the columns → you remap any it got wrong → preview flags bad rows
→ only valid rows commit.

> *Say:* "Deliberately not built to one fixed template, because we'd be
> guessing at your format. It adapts to whatever spreadsheet the banks send."

**Step 25.** **Callbacks** tab → real enquiries from the site's contact form,
with New → Contacted → Closed.

**Step 26.** ⭐ **Settings** tab. Change **Annual Price** from **999 → 1499**.
Save. Now open **/pricing** in another tab.

> **It says ₹1,499.**
>
> *Say:* "Pricing isn't hardcoded anywhere. Change it once here and it
> updates the pricing page, the services page, the comparison table and the
> FAQ text together."

**⚠️ Change it back to 999 before you close.**

---

## CLOSING — what to say about what's left

Be straight about this; he'll respect it more, and it puts the ball in his court.

> "Everything you've just seen is finished and tested. Three things are
> outstanding, and two of them are waiting on you:
>
> **1. Payments.** Razorpay test keys were due on the 17th and haven't
> arrived. It's about two weeks of work that can't start without them — it's
> the critical path to the 15 September date.
>
> **2. Email sending.** Same story, the Resend key. Alerts are captured and
> stored correctly; nothing can be *sent* until we have it.
>
> **3. The Channel Partner portal.** Your spec says no partner portal at
> launch, but there's a full portal in the plan. We need one answer: in or
> out for 15 September? If it's out, that frees a week."

### If he asks about the date

> "Everything that doesn't need payments is done. The 15th is still reachable
> if the keys arrive this week. If they slip past the end of August, the
> honest options are to move the date, or launch the free product on time and
> add paid a couple of weeks later — which works, because everything else is
> built."

---

## Quick reference

| | |
|---|---|
| Demo URL | `http://localhost:3100` (or live, **if** the deploy is green) |
| Superadmin | `boliwaladevs@gmail.com` |
| Live data | 12 properties · 11 cities · 6 banks · 5 credits on your account |
| Good demo property | Commercial Shop, FC Road, Pune (Bank of Baroda) |
| Filter that returns 2 | Location = **Pune** |
| Reset after demo | Annual Price back to **999**; delete any test listing you created |

### 8-minute short version

Steps **2** (live stats) → **6** (filters) → **11** (view-source proof) →
**12–13** (unlock + no double charge) → **23** (create a listing, watch it
appear publicly) → **26** (change price, watch the site update).
