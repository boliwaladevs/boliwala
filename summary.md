# Boliwala.com — Where The Project Stands

**Updated:** 16 August 2026 · **Target launch:** 15 September 2026

The website is built and working. Someone can visit it today, search for
auction properties, create an account, and unlock property details.

**What's left is mostly waiting on you** — a payment account, an email
account, some content, and a few decisions. Those are listed separately in
`blockers_client_facing.md`.

> ⚠️ **The Razorpay key was due yesterday (17 August is the deadline and it is
> now 16 August).** See the last section — this is the one item that moves the
> launch date, and it takes ten minutes.

---

## What the website does today

### For anyone visiting — no login needed

- Browse every live auction property, free
- Search and filter by city, price, bank, property type and possession status
- See full address, reserve price, EMD, auction date, and download the bank notice
- Request a callback about any property
- Read the pricing, services, about and FAQ pages
- Apply to become a channel partner

### For members — free account

- Sign up with email, or with Google in one click
- **5 free credits on signup**
- Spend a credit to unlock hidden details on a property:
  flat number & floor · inspection date & time · bank officer contact
- Once unlocked it stays unlocked — never charged twice for the same thing
- Save properties to a shortlist
- Save a search and be alerted when new matching properties appear
- Manage personal details, including optional PAN and Aadhaar

### For paying members

- Annual members see every hidden detail without spending credits
- **You set the prices yourself** in the admin panel and the website updates
  immediately — no developer needed

### For your team — the admin panel

- Dashboard with live business numbers
- Add, edit, publish and withdraw property listings
- Upload property photos
- **Bulk-import properties from an Excel sheet** — it matches your column
  names automatically and shows a preview before anything is saved
- Handle callback requests: see who asked, mark them contacted, then closed
- Change prices and credit costs yourself

---

## The important part: the paywall holds

Your business depends on people paying to see hidden property details. So the
question that matters most is whether those details can leak to someone who
hasn't paid.

We built an automated check that behaves like a non-paying visitor and
inspects everything the website sends them, hunting for details they haven't
paid for. **It finds nothing.** We run it after every change and it has passed
every time, including against the real, live version of the site.

We also test all four kinds of visitor — not logged in, logged in with
credits, logged in without credits, and annual member — to confirm each one
sees exactly what they should, and is charged exactly what they should be.

---

## Other things worth knowing

**The homepage is about 50× lighter than it was.** It used to load nearly
11 MB of images — slow and expensive on mobile data. It now loads about
0.2 MB and looks identical.

**Google can now find your properties.** Every property has its own proper
title, description and link preview, and the site tells search engines about
new listings automatically as you add them.

**The numbers on the site are now real.** The homepage used to claim
"12,400+ live auctions", "140+ cities" and "18+ banks". Those figures were
invented, and they contradicted each other in different places — the homepage
said 18 banks while the login page said 40. They now count what is actually in
the system and update by themselves as you add properties.

**A private page had been left open.** The channel partner dashboard was
reachable by anyone on the internet, showing made-up earnings figures. It now
requires a login.

**A paid detail was being given away free.** On one property, the plot number
people would pay a credit to unlock was already visible in the public address.
Fixed, and we now check all properties for this automatically.

---

## What's in the system right now

| | |
|---|---|
| Live properties loaded | 12 |
| Banks loaded | 6 |
| Cities covered | 11 |

These are sample properties loaded for testing. Once you send the real list,
the numbers shown on the website update on their own.

---

## What isn't built yet, and why

**Waiting on accounts only you can create**

- Taking payments (₹999 and ₹9,999) — needs a Razorpay account
- Sending emails: receipts, confirmations, property alerts — needs a Resend account

*Alerts are already being captured and stored correctly. We simply can't send
them until the email account exists.*

**Waiting on content from you**

- Privacy Policy and Terms pages
- Your real phone and WhatsApp number
- Your logo and link-preview image
- Property photographs

**Waiting on payments being built first**

- The Payments, Packages and Success Fee screens in the admin panel

**Agreed for later, not for launch**

- Full channel partner portal
- Marketing and email automation tools
- Mobile app

---

## The one thing that decides the launch date

Building payments takes about **two weeks**, and it cannot start until we have
a Razorpay test key from you. That key takes about **ten minutes** to create
and needs no paperwork or approval.

Counting back from 15 September, payments need to be built between 17 and
30 August. **That window opens tomorrow.** Every day the key is late pushes
the launch date by the same amount — nothing else can be done in that slot
while we wait.

Everything else on the list has room to slip. This one doesn't.
