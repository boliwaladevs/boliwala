# ROADMAP.md — Boliwala.com

**The single ordered source of truth for "what do we do next."**

**Created:** 2026-08-30 · **Supersedes** the dependency map in `SPRINT_CALENDAR.md` Part 2 (kept for task detail, but its week-by-week schedule is historical — see §0).

---

## How to use this file

1. Work items **top to bottom.** Do not start an item while an earlier one is unfinished, unless it is explicitly marked `parallel-ok`.
2. Each item has: **Goal · Blocked by · Done when · Notes/where.**
3. When an item is finished: tick it, add a one-line completion note with the date, and update `MEMORY.md` + `SPRINT_CALENDAR.md` + `project_calendar.html` in the same commit (the `CLAUDE.md` rule).
4. **Item 1 (Cloudflare migration) is handed off to a dedicated agent** with its own setup prompt. **Item 2 is the competitive-gap sprint plan** derived from `coparison.md` (the FindAuction teardown) — property-only, no payments. Everything from Item 3 down is the standing plan.
5. Full technical detail for the infra pieces lives in **`INFRA_R2_SCALING_ANALYSIS.md`**. Competitive rationale lives in **`coparison.md`** (gaps) and **`upper.md`** (where we already lead). Task-level detail for the older sprints lives in `SPRINT_CALENDAR.md` and `post_audit_plan.md`.

---

## 0. Status snapshot (2026-08-30)

- **Shipped:** Sprints 0–6, 15, 16. Auth (incl. Google OAuth — `MEMORY.md` §13), credits, real filterable search, 4-state gating, credit-unlock, shortlists, admin core (5 of 13 sections real), SEO foundation, image optimisation, account self-service. HEAD = `093b7ff`.
- **Decided 2026-08-30:**
  - Move the whole stack to **Cloudflare** (Workers via OpenNext + R2 + DNS) **+ Supabase** (Postgres, Auth, `pgvector`). Vercel Pro was never bought — no sunk cost.
  - Peak scale target: **50,000+ live listings** (competitor FindAuction indexes ~96k; ~17.8k live). Each listing has photos, PDF documents, and vector data.
  - **Property only.** Vehicles / plant & machinery are **explicitly descoped** (`coparison.md` P2.1 dropped).
  - **No payments yet.** Razorpay is deferred indefinitely; month-one monetisation is a manual "Contact Sales" flow. Razorpay sits at Item 12, unscheduled.
  - Navbar restyle + a "Login as Channel Partner" path (`INFRA_R2_SCALING_ANALYSIS.md` Appendix B).
- **Timeline:** the `SPRINT_CALENDAR.md` "15 September" date **is dead** — it predates the Cloudflare move, the 50k-scale target, and the missed credential deadlines. A new date must be agreed with the client (Decision **D0**). This roadmap is ordered by dependency, not date.

---

# THE ORDERED ROADMAP

## 1. Cloudflare migration  ⬅ **IN PROGRESS — 1a partially executed 2026-08-30, see `MEMORY.md` §27**

**Goal:** the app runs on Cloudflare Workers, DNS on Cloudflare, deploy via `wrangler`, all existing verification passes.

**Blocked by:** nothing to start the spike. Full cutover blocked by the domain existing (**D2**). **D1 is resolved** — account `boliwaladevs@gmail.com` / `dd735b278158c0a26949c1d5d6b6ebc3` is the production owner; Workers Paid upgrade deferred to the week of 2026-09-07 (free tier fits today at 2.74 MiB of the 3 MB cap).

**Done when:**

- **1a — Go/no-go spike (time-box: 1 day). ⏳ Steps 1–4 pass, step 5 blocked, verdict still open.** `@opennextjs/cloudflare` builds on Next 16.0.10; deploys to a `*.workers.dev` preview; `scripts/leak-test.mjs` + `scripts/access-matrix-test.mjs` + the route sweep pass against the preview; real Supabase email login + Google login work against the preview; Worker bundle < 10 MB compressed.
  - **Result so far (`MEMORY.md` §27):** adapter installs and builds clean on Next 16.0.10; **bundle 2.74 MiB gzip — the size gate passes**; the app needed no code changes. Local `wrangler dev` 500s on every route because of a **Windows-only** path-separator bug in the adapter (`MEMORY.md` §5 gotcha #10), so the build must run on Linux. **Nothing found so far argues against OpenNext — do not read the Windows failures as a no-go.**
  - **If the spike fails:** first run `npx vinext check` — Cloudflare now recommends **vinext** over OpenNext for Next.js (their docs, 25 Aug), and it is a non-destructive compatibility report. Only if that is also a dead end, buy Vercel Pro, ship there, keep every other item unchanged, revisit the host post-launch. R2 is host-agnostic. Skip 1b–1d.
- **1b —** Move `boliwala.com` DNS to the account above (**D2** — domain must exist first).
- **1c —** `wrangler.toml` ✅, secrets migrated (`SUPABASE_*`, `NEXT_PUBLIC_*`; `OPENAI_API_KEY` later), R2 binding, Workers Cron for the sitemap/revalidate jobs, and **Cloudflare Workers Builds connected to the GitHub repo** (chosen 2026-08-30 over a GitHub Actions `wrangler deploy` workflow: builds on Linux, per-PR previews, no long-lived API token in GitHub). **`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be set as *build* variables** — they are inlined at build time and a missing value silently falls back to `localhost`, shipping a green build with broken images (`MEMORY.md` §27.6).
- **1d —** Production served from Workers. Supabase URL Configuration + Google redirect URI updated to the real domain. `NEXT_PUBLIC_SITE_URL` set to the real domain (also clears the long-standing localhost-in-sitemap bug — absorbs old Sprint 15.5.1–15.5.3).

**Notes:** `sharp` does not run on Workers — renditions handled in the Node ingest job (Item 2 · S4) + Cloudflare Images for admin uploads. `INFRA_R2_SCALING_ANALYSIS.md` §6.

---

## 2. Competitive Gap Closure — FindAuction parity + out-build

**What this is:** the sprint plan that closes the gaps in `coparison.md` §6, **minus payments** (Item 12) and **minus vehicles/P&M** (descoped). `upper.md` records the areas we already lead — those are not repeated here.

**The one-line rationale (`coparison.md` §1):** *our single biggest competitive gap is not a feature — it is ~50,000 missing listings, plus the eight-year SEO index built on them.* S1–S5 exist to close that; they are launch-blocking. S6–S9 are parity polish, strongly recommended pre-launch, partially fast-followable. S10 is post-launch out-build.

**Blocked by:** Item 1 (runs on the migrated stack). **D3b** (inventory data source) is a hard commercial blocker for S4 and must be escalated to the client this week — nothing in S4–S6 has real data without it.

---

### S1 — R2 storage foundation + image cutover  *(launch-blocking)*

**Goal:** all listing images in R2, served via `cdn.boliwala.com`, $0 egress; Supabase Storage retired.

**Done when:**

- `boliwala-images` + `boliwala-docs` R2 buckets; `cdn.boliwala.com` custom domain + cache rules (`immutable`, long max-age on content-hashed keys); object versioning enabled.
- `lib/storage/r2.ts` (S3-compatible client / Workers R2 binding, server-only).
- Admin one-off upload writes originals to R2; renditions via **Cloudflare Images transformations** on the R2 original (no `sharp` in the app).
- Frontend reads R2 rendition URLs (`<img srcset>` or `next/image` custom loader — no optimizer call).
- The 12 existing images migrated; `listing_images` rows rewritten; migration `0008` bucket retired.
- Leak test still 12/12.

**Where:** `INFRA_R2_SCALING_ANALYSIS.md` §4. Closes `coparison.md` P1.8 (photos at scale) infra. Rendition sizes 320/800/1600 — confirm against real layouts (**D6**).

---

### S2 — PDF documents feature  *(launch-blocking)*

**Goal:** each listing carries public PDF documents (auction notice, sale notice), stored in R2, rendered on the listing page. **Closes `coparison.md` §4 "Auction notice PDF" gap** — FindAuction paywalls theirs; ours are free (consistent with the free-address posture in `upper.md` §1.1).

**Done when:**

- `listing_documents` table: `listingId`, `label`, `r2Key`, `sizeBytes`, `visibility` (default `'public'`), `uploadedAt`. Public `SELECT` policy scoped to `status = 'live'` (mirror `listing_images` / migration `0007`).
- Admin: upload/label/delete documents on the listing form.
- Listing page: a "Documents" section linking to R2 URLs.
- Leak test extended to guard non-public document keys (all public today → trivially passes).

**Where:** `INFRA_R2_SCALING_ANALYSIS.md` §5.

---

### S3 — Lender model: Bank / NBFC / ARC / HFC  *(launch-blocking — do before 50k rows land)*

**Goal:** stop modelling the world as "6 banks". Roughly half of real auction inventory is Edelweiss ARC, Phoenix ARC, HDB, Cholamandalam, AU SFB, Jana SFB, etc. (`coparison.md` P0.2 / §5.1.3).

**Done when:**

- Rename the `banks` concept to **`lenders`** (or add `lender_type` enum: `bank | nbfc | arc | hfc`), migration + data backfill for the existing 6.
- Every place that says "bank" in UI/filters/SEO copy generalises to "lender" (search sidebar counts, listing page, admin, JSON-LD `seller`).
- Admin can create lenders with a type.

**Notes:** Schema change — an order of magnitude cheaper now than after ingest. `parallel-ok` with S1/S2.

---

### S4 — Bulk ingest pipeline + daily refresh / expiry  *(launch-blocking)*

**Goal:** a resumable job that loads tens of thousands of listings with images, PDFs, and (optionally) vectors, plus a daily job that keeps inventory fresh.

**Blocked by:** S1 + S2 + S3. **D3b** (data source: IBAPI licence / direct bank-portal ingestion / purchased dataset) — **commercial decision, escalate now.**

**Done when:**

- `scripts/ingest/` — **plain Node** (has `sharp` for renditions), not a Worker. Cloudflare Container/Queue for scale.
- Extends the xlsx column-mapping flow: bulk image association, bulk PDF association, per-row validation, per-row failure reporting that doesn't abort the batch, idempotent by external ID, batched (~500), checkpointed in `bulk_upload_batches`.
- **Daily refresh + expiry job** (Workers Cron): re-pull the source, upsert changed listings, and mark past-`auctionDate` listings `expired` **rather than deleting** — expired rows become the Auction History corpus for S6.
- Verified against a few hundred real rows, then a full dry run into draft/staging.

**Where:** `INFRA_R2_SCALING_ANALYSIS.md` §9, `coparison.md` P0.1. Whether launch waits for the full 50k or a first tranche is **D4**.

---

### S5 — SEO landing-page matrix  *(launch-blocking — indexing compounds from day one)*

**Goal:** go from one indexable search surface to tens of thousands. This is FindAuction's real moat (`coparison.md` §5.3 / P0.3) and the only way to close an eight-year head start is to out-cover them.

**Done when:**

- Server-rendered routes: `/auctions/{city}` · `/auctions/{city}/{lender}` · `/lender/{lender}` · `/auctions/{city}/{propertyType}`.
- Title pattern: `{count} Bank Auction {Type} in {City} — Reserve from ₹{min} | Boliwala`. Listing titles carry reserve price + auction date.
- Breadcrumbs on every listing and matrix page.
- Auto-generated `sitemap.xml` per surface (extend `app/sitemap.ts`); JSON-LD (`ItemList` + `RealEstateListing`) on matrix and listing pages.
- **Do the opposite of their AI-crawler blocking (`coparison.md` P3):** open `robots.txt`, add `llms.txt`, keep structured data clean — be aggressively legible to answer engines.

**Notes:** needs S3 (lender URLs) and real inventory from S4 for the counts to mean anything, but the route scaffolding can be built in parallel against the 12 listings.

---

### S6 — Property identity + Auction History + price-drop / re-auction badges  *(pre-launch, high value)*

**Goal:** FindAuction's single strongest asset — the same flat linked to 17 prior auctions with a visible reserve-price trajectory (`coparison.md` P1.1 / P1.2 / §5.1.4).

**Blocked by:** S4 (needs the expired-listing corpus).

**Done when:**

- A **property identity key**: `lender + borrower + survey/flat no. + locality`, fuzzy-matched, stable across auction cycles.
- Re-ingested listings link back to the same `property` record.
- Listing page renders an **Auction History timeline**: date, reserve price, outcome, % change.
- Results cards show **price-drop badges** (`"12% drop from ₹8,50,000"`) and **re-auction badges** (`"Re-auction — same reserve"`) — derived from the history, highest-signal element on a card.
- Small human touch worth stealing (`coparison.md` §4): a "bank closed today, call after 10:00 AM next working day" note on the listing when the officer contact is unlocked.

---

### S7 — Search field expansion + popularity sort  *(pre-launch, parity)*

**Goal:** match their Advance Search (`coparison.md` P1.3 / P1.4 / §5.2).

**Done when:**

- New search/filter fields: **borrower name**, **auction date range** (from/to), **building / society / project name** (structured field — also improves buyer confidence and SEO), **bid increment**, **EMD submission deadline** (date + time).
- **Constructive Possession** added as a third possession type (currently only Physical/Symbolic).
- **Reserve price per Sq Ft** — computed and displayed on cards and the listing page.
- **Sort by Popularity** — expose the real server-side `viewCount` already tracked (their default ordering; cheap for us).
- Sort set to match theirs: Default · Popular · Newest · Price ↑ · Price ↓.

---

### S8 — Semantic / vector search  *(pre-launch if D5 resolved, else fast-follow)*

**Goal:** "3BHK near a school in south Pune under 40 lakh" — a query FindAuction's keyword+dropdown search cannot serve (`upper.md` §6).

**Blocked by:** S4 (embeddings generated/loaded at ingest). **D5** (who owns embeddings; if client, model + dimension).

**Done when:**

- `vector` extension; `listing_embeddings` table (`listingId`, `embedding vector(1536)`, `model`, `updatedAt`); HNSW index.
- Hybrid query: pgvector similarity + existing `status`/`city`/`price`/`lender` filters in one SQL statement.
- `/search` semantic sort or a "similar listings" module on the listing page.
- If we generate: `OPENAI_API_KEY`, re-embed-on-edit via a `needs_reembed` flag.

**Where:** `INFRA_R2_SCALING_ANALYSIS.md` §8. Do **not** add Pinecone/Qdrant.

---

### S9 — PWA + web push + redirect-preserving auth + AI legibility  *(pre-launch, conversion)*

**Goal:** the fast conversion/re-engagement wins (`coparison.md` P1.5 / P1.7).

**Done when:**

- **PWA:** manifest (already partial — `MEMORY.md` §15.5), service worker (cache-first static + cached city-data), install prompt.
- **Web push:** "new match in your city", "your saved auction is tomorrow". ~80% of a native app's value at ~5% of the cost.
- **Redirect-preserving auth:** `/login?next=<url>` from every gated CTA and the pricing page — we currently drop the user's context on the way to login (a silent conversion leak).
- Google Sign-in is **already shipped** (`MEMORY.md` §13) — verify it survived the migration, nothing to build (`coparison.md` P1.6 is stale).

---

### S10 — Out-build (post-launch)

Ordered by value; none launch-blocking. From `coparison.md` §6 P2 (minus P2.1 vehicles, descoped):

1. **Compare** 2–4 properties side by side — neither we nor they have it (P2.3).
2. **Map view + locality clustering** — neither has it (P2.2).
3. **Bid-budget calculator** — reserve + EMD + our 1% + stamp duty + registration → "what this actually costs you"; natural cross-sell into the ₹9,999 package (P2.4).
4. **Add auction date to calendar** (.ics / Google Calendar) — trivial, genuinely useful (P2.5).
5. **Mega-auction event pages** — when a bank runs a 1,000-property mega auction, a landing page live the same day; their highest-traffic content play (P2.6).
6. **Hindi**, then Marathi / Tamil / Telugu — the bank-auction buyer base is overwhelmingly not English-first (P2.7).

---

## 3. Supabase security housekeeping

**Goal:** close the two-week-old DB security debt. **Blocked by:** Supabase dashboard access. `parallel-ok` — any session with dashboard access; must be done before launch.

**Done when:**

- **3a —** DB password rotated (was pasted in a chat transcript). `DATABASE_URL`/`DIRECT_URL` updated, `@` percent-encoded.
- **3b —** Blanket table grants revoked. `anon`/`authenticated` hold blanket `DELETE`/`INSERT`/`TRUNCATE` on `profiles`; RLS covers the first two, **not TRUNCATE**. Revoke across all tables, re-run the access matrix.

**Where:** `post_audit_plan.md` §4 (15.5.4/15.5.5), `MEMORY.md` §19.7.

---

## 4. "Contact Sales" billing flow  (month-one monetisation, no Razorpay)

**Goal:** a prospect expresses intent → the team gets an email → the team bills manually (UPI/WhatsApp) and grants access.

**Blocked by:** an email-send path — Resend (**D7**) or a stopgap (form-to-inbox, or one SMTP call from a Worker). Stopgap acceptable for month one.

**Done when:**

- Pricing page CTA → **"Contact Sales"** form (name, phone, plan of interest, message).
- Submission writes a row (reuse `callback_requests` or a small `sales_enquiries` table) **and** emails the team.
- Admin: view enquiries + a **manual grant** button (credits / subscription row) with an `admin_audit_log` entry.
- Pricing/Services copy no longer implies instant self-serve purchase.

**Where:** `INFRA_R2_SCALING_ANALYSIS.md` Appendix A. Replaced by Item 12 later (manual grant kept as an override).

---

## 5. Navbar + Channel Partner auth updates

**Done when:**

- **5a —** `components/header.tsx`: **Log In** → orange bg / white text; **Sign Up** → white bg / black text. Desktop + mobile. Targets unchanged (`/login`, `/signup`).
- **5b —** `components/auth-view.tsx`: **"Login as Channel Partner"** button below the Google button → `/partner/login`. New route reusing `auth-view.tsx` via a `variant` prop (email+password + Google, identical look), differing only in post-login routing.
- **5c —** Hard-gate `/partner/dashboard` (guard is "is signed in" today → any customer sees fabricated commission figures). 1-hour credibility fix, do regardless of **D8**.

**Where:** `INFRA_R2_SCALING_ANALYSIS.md` Appendix B, `post_audit_plan.md` 17.A.1.

---

## 6. Legal, content & the support commitment

**Blocked by:** client copy + assets (**D9**), and the published support SLA (**D8b**).

**Done when:**

- `/privacy` + `/terms` pages; 4 dead `href="#"` footer links wired.
- Real contact number + WhatsApp deep link (`NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER`).
- Real headline statistics or signed-off placeholders (`hero.tsx`, `about-view.tsx`, `auth-view.tsx`; the Sprint 6 About copy still needs client review).
- Brand assets swapped (logo SVG, favicon, OG image — currently generated placeholders).
- Font resolution: buy Satoshi + genuinely self-host, or switch to Plus Jakarta Sans (Satoshi never loads today — `MEMORY.md` §16.4).
- **Support commitment on the pricing page in numbers** (`coparison.md` §7): channels (phone + WhatsApp + email), hours, first-response SLA, a named human. A vague "support included" bullet reads exactly like their "Email support" and wins nothing.

**Where:** `SPRINT_CALENDAR.md` Sprint 5.5.

---

## 7. Final QA & launch

**Blocked by:** Items 1, 2 (S1–S5, plus whatever tranche of S4 D4 requires), 3, 4, 5, 6.

**Done when:**

- Full `testing_guide.md` regression (phases 0–11).
- Leak test + access matrix against the **production Workers build**.
- Cross-browser QA (Chrome/Safari/Firefox/Edge × desktop/mobile).
- Lighthouse ≥ 90.
- Production cutover: domain live on Cloudflare, `NEXT_PUBLIC_SITE_URL`, OAuth redirects, sitemap all on the real domain.
- Client walkthrough + handover docs.

---

# ── LAUNCH ──

Everything below is **post-launch**, still ordered.

---

## 8. Admin completion — users & operations

**Goal:** the remaining admin sections show real data. **Note:** with payments deferred, the money screens (Payments, Subscriptions, Success-Fee) reflect only manual Contact-Sales grants until Item 12 — build the Users table, Activity Feed, Service Pipeline first.

**Where:** `SPRINT_CALENDAR.md` Sprint 7 + Sprint 8.1/8.2.

---

## 9. Profile & services completion

**Done when:** `SPRINT_CALENDAR.md` Sprint 8 — profile My Subscription / My Services / My Reports tabs, admin Report/Document upload.

---

## 10. Channel Partner portal  (only if **D8** = "ships")

**Done when:** `SPRINT_CALENDAR.md` Sprint 10 (8 tasks). **Correction:** the live enum value is `channel_partner`, not `partner` — Sprint 10.1 as written fails at the DB. Zero partner-role logic exists today; `requireAdmin()` is the pattern to copy but the guard, approval flow, and commission logic are net-new. This is a differentiator FindAuction has **no equivalent for** (`upper.md` §4).

---

## 11. CP creatives + WhatsApp tools  (only if Item 10 ships)

**Done when:** `SPRINT_CALENDAR.md` Sprint 11 — co-branded creatives, admin template management, partner gallery, WhatsApp click-to-chat + manual queue.

---

## 12. Razorpay integration  (when the client wants payments)

**Goal:** real self-serve payments replace the manual Contact Sales flow.

**Blocked by:** `RAZORPAY_KEY_ID` / `_KEY_SECRET` / `_WEBHOOK_SECRET` (**D10**), and a client decision that payments are now wanted.

**Done when:** `SPRINT_CALENDAR.md` Sprint 3.5 — SDK, ₹999 subscription checkout, ₹9,999 package checkout, webhook (signature verification + idempotency), entitlement → `subscriptions` / `service_packages`, failure/retry, subscriber auto-unlock verified end-to-end. Retire the manual grant path from Item 4 (keep as an admin override).

---

## 13. Marketing & engagement engine

**Blocked by:** Resend (Item 4's email path), ideally Item 12 for payment-triggered emails.

**Done when:** `SPRINT_CALENDAR.md` Sprint 9 — property-match alert engine on listing insert/update (`upper.md` §2: real-time, not the daily digest FindAuction ships), lifecycle email, credit/subscription nudges, cross-sell, admin alert/campaign/segment/analytics panels. Plus `post_audit_plan.md` 16.5.1 (guest unsubscribe via signed token) + 16.5.2 (deletion confirmation email).

---

## 14. Mobile — PWA / APK decision

**Blocked by:** **D11** — thin WebView/PWA wrapper (FindAuction's app is exactly this — a TWA), or a real Capacitor app (needs API route handlers alongside the server actions). `INFRA_R2_SCALING_ANALYSIS.md` Appendix C. Much of the PWA groundwork lands in Item 2 · S9.

**Done when:** `SPRINT_CALENDAR.md` Sprint 12.

---

## 15. PAN/Aadhaar compliance closure

**Blocked by:** an **owner must be named** (**D12**) — not an engineering decision.

**Done when:** application-level encryption at rest for PAN/Aadhaar, a written retention & deletion policy, an access audit trail. `post_audit_plan.md` 16.5.3, migration `0009` header.

---

## 16. Hypercare

**Done when:** `SPRINT_CALENDAR.md` Sprint 14 — production observation, instant bug-fix sprints.

---

# DECISIONS NEEDED (unblock the items above)

| #             | Decision                                                                                                                | Blocks                 | Owner                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------- |
| **D0**  | **New launch date.** 15 Sep is dead.                                                                              | Item 7, all scheduling | Client + team                    |
| ~~**D1**~~  | ~~Cloudflare account with billing — who owns it?~~ **RESOLVED 2026-08-30:** `boliwaladevs@gmail.com`, account `dd735b278158c0a26949c1d5d6b6ebc3`. Workers Paid upgrade deferred to w/c 2026-09-07. | ~~Item 1b onward~~     | ~~Team~~                         |
| **D2**  | Production domain`boliwala.com` — register, point DNS.                                                               | Items 1b, 2·S1, 7     | Client                           |
| **D3b** | **Inventory data source** — IBAPI licence / direct ingestion / purchased dataset. Longest lead time; commercial. | Item 2 · S4–S8       | **Client — escalate now** |
| **D3**  | How do the listing images/PDFs physically arrive? (ZIP per property / drive / URLs in sheet)                            | Item 2 · S4           | Client                           |
| **D4**  | Launch with the full 50k, or a first tranche?                                                                           | Item 2 · S4, Item 7   | Client + team                    |
| **D5**  | Embeddings — we generate, or client provides? If client: model + dimension.                                            | Item 2 · S8           | Client + team                    |
| **D6**  | Image rendition sizes (320/800/1600 proposed).                                                                          | Item 2 · S1           | Team                             |
| **D7**  | Resend API key, or accept an email stopgap for month one.                                                               | Items 4, 13            | Client                           |
| **D8**  | Does the Channel Partner portal ship at launch?                                                                         | Items 5c, 10, 11       | Client                           |
| **D8b** | Published support SLA — channels, hours, first-response time.                                                          | Item 6                 | Client                           |
| **D9**  | Privacy/Terms copy, contact number, WhatsApp, brand assets, headline stats.                                             | Item 6                 | Client                           |
| **D10** | Razorpay — when does the client want payments?                                                                         | Item 12                | Client                           |
| **D11** | Mobile: PWA wrapper or real Capacitor app?                                                                              | Item 14                | Client + team                    |
| **D12** | Who owns PAN/Aadhaar compliance?                                                                                        | Item 15                | Client                           |

---

# STANDING VERIFICATION BAR

Every code item closes against this (from `post_audit_plan.md` §10, adjusted for Workers):

1. `tsc --noEmit` clean. Never reinstate `ignoreBuildErrors`.
2. `pnpm build` clean **with `SUPABASE_SERVICE_ROLE_KEY` blanked** (`$env:SUPABASE_SERVICE_ROLE_KEY=""; pnpm run build`).
3. **Leak test** (`scripts/leak-test.mjs`) — blocking security gate.
4. **Access matrix** — 49 assertions, 7 viewer states.
5. Route sweep against the production build (Workers `wrangler dev` / deployed preview once on Cloudflare).
6. Test users/rows created during verification are deleted afterwards.
7. `MEMORY.md` + `SPRINT_CALENDAR.md` + `project_calendar.html` + this file updated in the same commit.
