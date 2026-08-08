# Boliwala.com — Testing Guide

**Covers:** everything built and verified through Sprint 5 (2026-08-09).
**Companion docs:** `blockers.md` (what is not built and why),
`MEMORY.md` (per-sprint build records), `project_calendar.html` (schedule).

Work through this **in order**. Phases 0–2 are prerequisites; a failure
there invalidates everything after it. Phases 3–10 are feature areas and
can be split across testers once Phase 2 passes.

> **Read this before you start.** Large parts of the admin panel are still
> the original static mockup with fabricated data (`Priya Mehta`,
> `₹21,44,000`, `1,842 users`). Those are **not** bugs. §11 lists exactly
> what is mock so you do not raise tickets against unbuilt features.

---

## Phase 0 — Environment setup

| # | Step | Expected |
|---|---|---|
| 0.1 | `git clone https://github.com/boliwaladevs/boliwala && cd boliwala` | Clean checkout on `main` |
| 0.2 | Place the real `.env.local` at the **repo root** | See 0.3 for required keys |
| 0.3 | Confirm keys are populated | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` |
| 0.4 | `pnpm install` | Completes without `ERR_PNPM_ENOSPC` |
| 0.5 | `pnpm dev` | `✓ Ready`, and the banner reads `- Environments: .env.local` |

**Gotchas that have actually cost time on this project:**

- The app is at the **repo root**. There is no `project/` subdirectory,
  despite what older notes in `MEMORY.md §2` say. Never `pnpm -C project`.
- The env file must be named `.env.local`. A file named `env` or
  `env (1).download` is **not** matched by `.gitignore`'s `.env*` pattern
  and will be committed to a public repo if you `git add -A`.
- On Windows, stale `next dev` processes survive `kill` from Git Bash.
  Use PowerShell:
  `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'next|pnpm.*dev' } | Stop-Process -Force`
- If port 3000 is taken, use `pnpm dev --port 3100` and substitute that
  port everywhere below.

---

## Phase 1 — Build integrity

Run these before touching the UI. All three must pass.

| # | Command | Expected |
|---|---|---|
| 1.1 | `npx tsc --noEmit` | **Zero errors.** Typechecking was enabled in Sprint 5; any error is a real regression |
| 1.2 | `pnpm build` | Prints `Running TypeScript ...` (not `Skipping validation of types`) and compiles **24 routes** |
| 1.3 | `pnpm lint` | No new errors |

> If `pnpm build` says `Skipping validation of types`, someone has
> re-added `typescript: { ignoreBuildErrors: true }` to `next.config.mjs`.
> Fail the build and revert it.

---

## Phase 2 — Security gate (blocking)

**This is the highest-priority test in the suite.** The entire revenue
model depends on gated field values never reaching an unauthorised
browser. Two automated scripts cover it. Run both with the dev server up.

### 2.1 Guest-source leak test

```bash
node scripts/leak-test.mjs http://localhost:3000
```

**Expected:** `RESULT: PASS — no gated data in guest HTML`, one PASS line
per live listing, and `Non-empty value checks` greater than zero.

The script reads the real gated values with the service-role key, fetches
each listing page with no cookies, and asserts that neither the gated
column keys nor their actual values appear anywhere in the payload.

- A `Not leaks, but worth fixing in the data` section is **informational**.
  It currently reports one row: `flatNumber` on the Jaipur agricultural
  listing duplicates the public `addressLine`. Not a security failure —
  a data-quality issue (see `blockers.md`).
- If it reports `VACUOUS`, the page rendered without its public fields —
  the test proved nothing. Investigate before trusting a PASS.

### 2.2 Four-state access matrix

```bash
node --experimental-strip-types --import ./scripts/ts-resolve-hook.mjs scripts/access-matrix-test.mjs
```

**Expected:** `RESULT: PASS — gating matrix correct`, 49 assertions across
7 viewer states. Pricing is read live from the `settings` table, so this
also proves the admin's pricing controls feed the access layer.

### 2.3 Manual view-source spot check

1. Open any listing in a **private/incognito** window.
2. View source (`Ctrl+U`), search for `authorisedOfficerPhone`,
   `inspectionDatetime`, `flatNumber`.
3. **Expected:** the field-group label ("Flat number & floor") appears;
   the *values* do not. `"value":null` should be visible next to each
   gated group.

**Any real failure here is a launch blocker. Stop and escalate.**

---

## Phase 3 — Public pages (guest, not signed in)

| # | Route | Check |
|---|---|---|
| 3.1 | `/` | Hero renders; parallax moves on scroll; 4 stat tiles; city grid; alerts form; footer |
| 3.2 | `/search` | With no filters shows the empty/prompt state (**by design**, not a bug) |
| 3.3 | `/search?location=Pune` | Returns **2** listings |
| 3.4 | `/search?propertyType=industrial` | Returns **2** |
| 3.5 | `/search?propertyType=residential` | Returns **6** |
| 3.6 | `/search?possession=physical` | Returns **8** |
| 3.7 | `/search?possession=symbolic` | Returns **4** (8 + 4 = all 12 live listings) |
| 3.8 | `/search` price + bank + sort | Filters compose; result count and bank sidebar counts both update; sort reorders |
| 3.9 | `/search` pagination | Page links change results and are shareable URLs (state lives in the query string) |
| 3.10 | `/pricing` | Prices match the `settings` table — **never** hardcoded |
| 3.11 | `/services` | Same prices as `/pricing`, plus per-field-group unlock costs |
| 3.12 | `/about`, `/faq` | Render (note: About still shows unverified headline stats — see `blockers.md`) |
| 3.13 | `/partner` | Enrolment form renders |
| 3.14 | `/contact` | Form renders |
| 3.15 | `/listing` | **307 redirect** to `/search` (legacy route) |
| 3.16 | `/listing/does-not-exist` | **404** |

**Responsive:** repeat 3.1, 3.2, and one listing page at **375px, 768px,
1280px**. Check the mobile menu opens, no horizontal scroll, and the hero
text stays readable over the image.

---

## Phase 4 — Listing page and the four access states

The core of the product. Test each state in order; each builds on the last.

### 4.1 State 1 — Guest

1. Incognito → open any listing.
2. **Expected:** address, reserve price, EMD, auction date, bank notice all
   visible. Three gated blocks show a paywall teaser with
   **"Sign up to view"**. Callback CTA and WhatsApp link present, no login
   required.

### 4.2 State 2 — Member with credits

1. Sign up with a fresh email → verify → land signed in.
2. Check `/profile`: **credit balance = 5**.
3. Open a listing. **Expected:** gated blocks now read **"Unlock for 1
   credit"**.
4. Unlock one group. **Expected:** value appears, balance drops to **4**.
5. **Reload the page.** Value still visible, balance still **4** — no
   second charge.
6. Navigate away and back. Still unlocked, still 4.

### 4.3 State 3 — Member with no credits

1. Spend down to 0, or set `creditsBalance = 0` via SQL (service-role).
2. Open a listing with an un-unlocked group.
3. **Expected:** CTA changes to **"Upgrade"** / out-of-credits messaging.
4. **Previously unlocked groups on other listings stay visible.**
5. Confirm the balance cannot go negative.

### 4.4 State 4 — Subscriber

1. Insert an active row in `subscriptions` for the test user (service-role).
2. Open any listing. **Expected:** all three groups visible immediately,
   **zero credits charged**, no unlock step.
3. Remove the row afterwards.

### 4.5 Idempotency and abuse

| # | Test | Expected |
|---|---|---|
| 4.5.1 | Double-click Unlock rapidly | Charged **once** (unique constraint + RPC handles the race) |
| 4.5.2 | `PATCH /rest/v1/profiles` with `creditsBalance: 999999` using the anon key | **403** |
| 4.5.3 | Same with `role: 'admin'` | **403** |
| 4.5.4 | Legitimate save of Full Name / Phone from `/profile` | **200** |

### 4.6 View counter

1. Load a listing 3 times quickly. **Expected:** count increments **once**
   (30-minute dedupe window).
2. Backdate the `listing_views` row past 30 minutes, reload. **Expected:**
   increments again.

---

## Phase 5 — Authentication

| # | Test | Expected |
|---|---|---|
| 5.1 | Sign up (email/password) | `profiles` row created, **exactly one** `credit_transactions` row (`signup_grant`, +5) |
| 5.2 | Log out / log back in | Session restores; **no** second credit grant |
| 5.3 | Wrong password | Clear error toast, no session |
| 5.4 | Forgot password with no email entered | Prompted to enter one first |
| 5.5 | Forgot password → email → `/reset-password` | New password works, old one does not |
| 5.6 | **Google sign-in** (Sprint 2.5) | Redirects to Google, returns via `/auth/callback`, lands on `/profile` |
| 5.7 | Google first login | One `profiles` row, `creditsBalance = 5`, name from Google |
| 5.8 | Google **repeat** login | **No** second credit grant (trigger fires only on INSERT) |
| 5.9 | `/profile` while signed out | **307** to `/login` |

> Test-user hygiene: delete throwaway accounts via the Admin API when
> done. **Exception:** `ops@nesora.co.in` ("Hriday Kampani") is a real
> account — do not delete it.

---

## Phase 6 — Shortlists, alerts, callbacks

| # | Test | Expected |
|---|---|---|
| 6.1 | Save a listing from a search card | Persists across reload |
| 6.2 | Save from the listing page | Same |
| 6.3 | `/profile` → Saved Properties | Shows saved listings with real data |
| 6.4 | Remove from profile | Gone from DB and UI |
| 6.5 | Homepage alerts form as a **guest** | Row in `alert_subscriptions` |
| 6.6 | Same while signed in | Row carries `userId` |
| 6.7 | `/contact` direct submit | `callback_requests` row, `source: 'contact'` |
| 6.8 | Listing → "Request a Callback" → submit | Row with correct `listingId` and `source: 'listing'` |
| 6.9 | Header "Free Consultation" | Goes to `/contact` (not `/login`) |
| 6.10 | `/partner` enrolment submit | Row in `channel_partner_applications`; "Localities to Cover" is folded into `experience` |

> The **"Get email alerts for this search"** banner on `/search` is
> non-functional by design — not yet wired. Do not raise a ticket.

---

## Phase 7 — Admin panel (built sections only)

Promote a test user first — there is **no** self-service path:
`UPDATE profiles SET role='admin' WHERE email='...'` via service-role.

### 7.1 Access control

| # | Test | Expected |
|---|---|---|
| 7.1.1 | `/admin` as guest | **307** to `/login` |
| 7.1.2 | `/admin` as signed-in non-admin | **307** to `/` |
| 7.1.3 | `/admin` as admin | Dashboard loads |

### 7.2 Dashboard

- All 8 KPI cards show **real** queries. Revenue and success-fee cards
  correctly show **₹0 / empty** — that is accurate, not broken, because
  payments do not exist yet.
- Alert banners for unread callbacks and pending partner applications
  reflect real counts.
- **Recent Activity feed and the 8-month revenue chart are still mock.**

### 7.3 Listings management

| # | Test | Expected |
|---|---|---|
| 7.3.1 | Table lists all 4 statuses (draft/live/closed/cancelled) | Not just `live` |
| 7.3.2 | Search by title / city / slug | Debounced, correct results |
| 7.3.3 | Filter by bank and status | Compose correctly |
| 7.3.4 | Create a listing | Saves as **draft**, panel switches to edit mode |
| 7.3.5 | All 4 form tabs | Property Details, Bank & Auction, Gated Fields, Images all populated |
| 7.3.6 | Edit and save | Persists |
| 7.3.7 | Cancel (✕) | Sets `status='cancelled'` — **soft delete**, row still exists |
| 7.3.8 | Publish a draft → check `/search` | Appears publicly |

### 7.4 Image upload

1. Upload a JPEG/PNG/WebP under 5 MB → Storage object + `listing_images`
   row created.
2. Copy the public URL, open it with **no auth headers** → **200**.
3. Delete → both the Storage object and the DB row are removed.
4. Try a >5 MB file or a PDF → rejected.

### 7.5 Bulk Excel upload

1. Upload `.xlsx` / `.xls` / `.csv` with arbitrary headers.
2. Auto-mapping should match loosely — a column named **"Bank"** must map
   to the field labelled **"Bank (name)"** (this was a real bug, fixed).
3. Remap a column manually.
4. Preview shows per-row validation; deliberately include one row with an
   unresolvable bank name.
5. Commit. **Expected:** only the valid rows are created, as **drafts**.

### 7.6 Callback requests

| # | Test | Expected |
|---|---|---|
| 7.6.1 | List shows submissions from Phase 6 | Real data, joined to listing title |
| 7.6.2 | Search by name / phone / email | Works |
| 7.6.3 | Status filter | Works |
| 7.6.4 | Transition New → Contacted → Closed | Persists; `assignedTo` set to the acting admin |

> Statuses are **new / contacted / closed** only. The mockup's "In
> Progress" and "Converted" do not exist in the real enum.

### 7.7 Settings — the propagation test

**This is the requirement-#2 test. Do it carefully.**

1. Change **Annual Price** from 999 to e.g. 1499 in `/admin` → Settings.
2. Verify in the DB.
3. **Without restarting**, check `/pricing` and `/services` — both must
   show 1499 immediately (`revalidatePath`).
4. Change a per-group credit cost and re-run the Phase 2.2 matrix script —
   it reads live settings and must reflect the new cost.
5. **Revert everything to the original values** and confirm the revert
   propagates too.

---

## Phase 8 — SEO, metadata, performance (Sprint 5)

| # | Test | Expected |
|---|---|---|
| 8.1 | `/robots.txt` | 200; disallows `/admin`, `/profile`, `/partner/dashboard`, `/auth/`, `/reset-password`; lists the sitemap |
| 8.2 | `/sitemap.xml` | 200; **20 entries** (8 static + 12 live listings) |
| 8.3 | Publish a new listing → reload sitemap | Appears within the 1-hour revalidate window |
| 8.4 | Two different listing pages | **Different** `<title>`, description, and canonical |
| 8.5 | Listing `<title>` length | Roughly 50–60 chars; city not duplicated |
| 8.6 | Any `<meta>` tag | Contains **no** gated field value |
| 8.7 | `/login`, `/signup`, `/profile`, `/admin` | `<meta name="robots" content="noindex, nofollow">` |
| 8.8 | `/search?location=Pune&sort=price_asc` | Canonical points at the **bare** `/search` |
| 8.9 | JSON-LD on homepage | Two blocks: `Organization` and `WebSite`, both parse |
| 8.10 | JSON-LD on a listing | One `RealEstateListing` with `PostalAddress` + `Offer`; parses |
| 8.11 | `/icon`, `/apple-icon`, `/opengraph-image`, `/manifest.webmanifest` | All **200** with correct content types |
| 8.12 | Favicon in the browser tab | Amber gavel mark visible |

### 8.13 Image optimisation

- View source on `/`: hero images must go through `/_next/image?...`, not
  a raw `/images/*.png`.
- With an `Accept: image/avif` header, `/_next/image` must return
  **`image/avif`**.
- Homepage image payload at a 1920px viewport should be roughly **~210 KB
  total** (was 10.65 MB before Sprint 5). A large regression means someone
  re-added `images: { unoptimized: true }`.
- The hero foreground must keep its **transparency** — if the building
  silhouette has a solid rectangular background, alpha was lost.

### 8.14 Lighthouse

Run against a **production** build (`pnpm build && pnpm start`), not dev.
Record Performance / Accessibility / Best Practices / SEO. Investigate
anything below **90**.

---

## Phase 9 — Production build parity

Dev and production behave differently. Re-run the critical path against a
real build.

```bash
pnpm build && pnpm start --port 3200
```

| # | Test | Expected |
|---|---|---|
| 9.1 | `node scripts/leak-test.mjs http://localhost:3200` | PASS |
| 9.2 | Route sweep of all 23 routes | Same status codes as dev |
| 9.3 | One full unlock flow | Works identically |

---

## Phase 10 — Cross-browser and device

Minimum matrix. Run Phase 3.1, 4.1, 4.2 and 7.3 on each.

| Browser | Desktop | Mobile |
|---|---|---|
| Chrome | ✅ required | ✅ Android required |
| Safari | ✅ macOS required | ✅ iOS required |
| Firefox | ✅ required | — |
| Edge | ✅ required | — |

Pay attention to: the parallax hero on iOS Safari, `position: sticky`
behaviour, the mobile nav, and AVIF support (Safari < 16 falls back to
WebP — confirm the fallback actually renders).

---

## Phase 11 — What is NOT built (do not raise tickets)

### Admin tabs still showing static mock data

Packages · Payments · Success Fees · Users · Partners · Alerts · Alert
Engine · Email Campaigns · WhatsApp Tools · Segments · Engagement
Analytics · Recent Activity feed · revenue chart

### Features not implemented

| Area | Status |
|---|---|
| Razorpay payments (₹999 / ₹9,999) | **Not built** — Sprint 3.5 |
| Transactional email (Resend) | **Not built** — Sprint 4.5 |
| Alert engine (sending alerts) | Phase 2 — capture only today |
| Channel partner portal | Enrolment form only; `/partner/dashboard` is a mockup **and is publicly reachable** |
| Privacy Policy / Terms pages | Footer links are `href="#"` |
| Service worker / offline PWA | Deferred |
| `/search` email-alerts banner | Not wired |

### Known data and content issues

- Headline stats (`12,400+`, `₹2,100Cr`, `840+`, `18+` vs `40+` banks) are
  **unverified** and awaiting client sign-off.
- Footer phone is a US placeholder; WhatsApp number is unset.
- Only **6 banks** are seeded.
- Jaipur agricultural listing: gated `flatNumber` duplicates the public
  address.
- `components/projects.tsx` is dead code (nothing imports it).

Full detail and ownership: **`blockers.md`**.

---

## Reporting a defect

Include: phase and step number · environment (dev/prod build, port) ·
browser and viewport · account state (guest / credits / subscriber /
admin) · expected vs actual · whether Phase 2 still passes.

**Escalate immediately, do not batch:** any Phase 2 failure, any gated
value visible to an unauthorised viewer, any credit charged twice, any
`403` that should have been `200` on a legitimate profile save.
