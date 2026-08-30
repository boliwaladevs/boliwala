<style>
/* "Big font" reading mode — honoured by VS Code preview / browsers, ignored by GitHub. */
.markdown-body, body { font-size: 21px !important; line-height: 1.75 !important; max-width: 60rem; margin: 0 auto; }
h1 { font-size: 3.2em !important; margin-top: 0.4em; }
h2 { font-size: 2.3em !important; border-bottom: 3px solid currentColor; padding-bottom: .2em; margin-top: 1.6em; }
h3 { font-size: 1.65em !important; margin-top: 1.2em; }
h4 { font-size: 1.3em !important; }
table { font-size: 0.95em; }
code { font-size: 0.95em; }
blockquote { font-size: 1.1em; border-left: 5px solid #f97316; padding-left: 1em; }
</style>

# Infrastructure & Scaling Analysis

### Full Cloudflare + Supabase Postgres — the target architecture

**Date:** 2026-08-30  ·  **Status:** direction decided (2026-08-30), pending a go/no-go spike  ·  **Trigger:** peak target raised to **70,000 properties**, each with vector data, images, and PDF documents.

---

## 1. TL;DR — the decision

> **Move the whole stack to Cloudflare (Workers for the app via OpenNext, R2 for all blobs, Cloudflare DNS/CDN) + Supabase for Postgres, Auth and `pgvector`. Vercel Pro is not purchased, so there is no sunk cost — do the migration now, before more code piles up, gated by a one-day compatibility spike.**

| Question | Answer |
|---|---|
| Add Cloudflare R2? | **Yes.** Single biggest cost + scaling lever at 70k properties. $0 egress. |
| Move hosting to Cloudflare too? | **Yes — decided 2026-08-30.** Workers via `@opennextjs/cloudflare`. One vendor for app + storage + DNS, ~$5/mo vs Vercel Pro ~$20/mo, and Vercel Pro was never bought so nothing is lost. **Conditional on the §6 spike passing.** |
| Whole "R2 + Supabase" setup? | **Yes:** R2 = files, Supabase = database + auth + vector search, Cloudflare Workers = the app. You are **not** replacing Supabase — only retiring Supabase **Storage**. |
| Where do vectors live? | **Supabase Postgres via `pgvector`.** Tiny (~0.5 GB); must sit next to the relational data so one SQL query does "similar to X **and** in Pune **and** under ₹50L". |
| Does this support the `.apk` later? | **Neutral — neither helps nor blocks it.** APK feasibility depends on the *frontend* architecture, not the host. See Appendix C. |

---

## 2. The scale problem, in numbers

Today: **12 listings**, one 5 MB image bucket in Supabase Storage. That does not survive contact with 70,000.

### Rough volume at peak (70,000 properties)

| Asset | Assumption | Volume |
|---|---|---|
| Listing photos | ~8 per property, ~1.5 MB raw | **~840 GB raw** / ~280 GB if optimised on upload |
| PDF documents | ~3–4 per property, ~2 MB | **~500 GB** |
| Vector embeddings | 1536-dim, 1 per property | **~0.5 GB** (a rounding error) |
| Postgres rows (listings + images + views + unlocks…) | 70k listings, millions of view/unlock rows over time | **1–4 GB and growing** |
| **Total object storage** | | **~1–1.5 TB, heading to 2 TB+** |

### Why this breaks the current setup

- **Supabase Storage egress is $0.09/GB.** A property site is image-heavy browsing. Serve **2 TB/month** of images to visitors → **~$180/month**, and it scales with traffic in a way you can't predict or cap.
- **Serverless image optimization bills per *source image*.** 560,000 source images is far past any platform's included quota — on Vercel this is the classic bill-shock line item ($100s/mo or a hard wall). The fix is to **not do runtime optimization at all** (§4.2).
- **Supabase's included 100 GB storage** is blown 10–15× over.
- The 5 MB image-only bucket **cannot hold PDFs** at all (wrong MIME allowlist, wrong size limit).

**The fix is architectural, not a config tweak.**

---

## 3. Target architecture

```
                          ┌───────────────────────────────────┐
   Browser / APK  ───────▶│  Cloudflare Workers               │
                          │  Next.js 16 via @opennextjs/cf     │
                          └──────────────┬────────────────────┘
                                         │
          ┌──────────────────────────────┼───────────────────────────┐
          ▼                              ▼                           ▼
 ┌────────────────────┐        ┌──────────────────┐        ┌────────────────────┐
 │ Supabase Postgres  │        │  Supabase Auth   │        │  Cloudflare R2     │
 │ • listings, users  │        │  • email/pass    │        │  • listing photos  │
 │ • pgvector (HNSW)  │        │  • Google OAuth  │        │  • PDF documents   │
 │ • RLS / gating     │        │  • partner auth  │        │  (public buckets)  │
 └────────────────────┘        └──────────────────┘        └─────────┬──────────┘
                                                                     │
   ┌─────────────────────────────────────────────────────┐  ┌────────▼─────────┐
   │ Cloudflare, same account:                           │  │ Cloudflare CDN   │
   │ • DNS for boliwala.com   • Workers Cron (jobs)       │  │ edge-cached      │
   │ • Queues (bulk ingest)   • Images (admin resize)     │  │ $0 egress        │
   └─────────────────────────────────────────────────────┘  └──────────────────┘
```

**What changes:** app host Vercel → Cloudflare Workers; blobs Supabase Storage → R2; DNS → Cloudflare; runtime image optimization → **removed** (pre-generated renditions, §4.2).

**What does NOT change:** the framework (Next.js 16, App Router, server actions), the database, the auth, and — critically — **the security model**. Gated *columns* stay gated by RLS exactly as today. PDFs are freely public, so they need no gating (§5).

**One vendor bill** for app + storage + DNS + CDN + job runners (Cloudflare), plus Supabase for the database and auth. Down from three surfaces to two.

---

## 4. Cloudflare R2 — the plan

### 4.1 Buckets

| Bucket | Contents | Access |
|---|---|---|
| `boliwala-images` | listing photos + generated renditions | **public** (photos aren't gated) |
| `boliwala-docs` | auction notices, legal/title PDFs | **public** (confirmed: freely viewable) |

Both fronted by a Cloudflare **custom domain** (e.g. `cdn.boliwala.com`) with the CDN cache on. Egress to visitors is **$0** regardless of traffic.

### 4.2 No runtime image optimization — pre-render renditions instead

**Important constraint:** `sharp` is a native binary and **does not run on Cloudflare Workers**. So image resizing cannot happen in a request handler on this stack. That's fine — we don't want runtime resizing anyway. Split by path:

**Bulk ingest (the 70k)** — the ingest job runs as a **plain Node process** (a `scripts/` job or a small container / Cloudflare Container), *not* in a Worker, so `sharp` is available. For each source image it writes **3 WebP renditions** to R2 — `thumb` (320w), `card` (800w), `full` (1600w) — plus the original. `listing_images` stores the keys. Content-hashed filenames → cache-forever.

**Admin one-off uploads (post-launch, low volume)** — a few images at a time. Two clean options, no `sharp`:
- **Cloudflare Images transformations** on the R2 original: request `…/cdn-cgi/image/width=800,format=auto/<key>`. Transformed once, edge-cached after. ~$0.50 per 1,000 unique transforms — negligible at this volume.
- or a **Supabase Edge Function** with a WASM resizer (`@jsquash`) if you'd rather keep it off Cloudflare Images.

**Frontend:** plain `<img srcset>` pointing at the three rendition URLs, or `next/image` with a **custom loader** that just returns the right R2 URL (no optimizer call). Either way, zero optimization compute in production.

### 4.3 Code touch-points

- `lib/storage/r2.ts` — new. S3-compatible client (`@aws-sdk/client-s3`, works in Workers) pointed at the R2 endpoint. Server-only. Also usable as a **Workers R2 binding** once on Cloudflare (no keys needed for same-account access).
- `scripts/ingest/` — the bulk pipeline; owns `sharp` + rendition generation + R2 writes.
- `app/actions/admin-listings.ts` — one-off upload path writes original to R2; renditions via Cloudflare Images URL (no local resize).
- `components/listing-view.tsx` / search cards — read R2 rendition URLs.
- `next.config.mjs` — custom image loader (or `images.remotePatterns` for the `cdn.boliwala.com` host).
- **Migration script** — copy the 12 existing Supabase Storage objects to R2, rewrite `listing_images` rows. Trivial.
- Retire migration `0008`'s bucket once cut over.

### 4.4 Operational checklist

- [ ] R2 CORS policy on `boliwala-images` (allow `GET` from the site origin).
- [ ] Cloudflare cache rules: long `Cache-Control` (`public, max-age=31536000, immutable`) on renditions — filenames are content-hashed so this is safe.
- [ ] **Object versioning / lifecycle rule** on R2 (it is not on by default) — protects against a bad bulk overwrite.
- [ ] R2 API token scoped to the two buckets only (for the Node ingest job); the Worker app uses an **R2 binding** and needs no keys. Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE_URL`.
- [ ] Cloudflare free tier covers 10 GB + 1M writes + 10M reads/month; past that, still cents. No egress line, ever.

---

## 5. PDFs — freely public (your answer)

Because the documents are **not paywalled**, this is the simple case:

- Store PDFs in the **public** `boliwala-docs` bucket.
- Serve straight from `cdn.boliwala.com`, Cloudflare-cached.
- **No signed URLs, no entitlement check, no private bucket.**
- `listing_documents` table (new, small): `listingId`, `label` ("Auction Notice", "Sale Notice"), `r2Key`, `sizeBytes`, `uploadedAt`. Public `SELECT` policy scoped to `status = 'live'` listings — same visibility boundary as `listing_images` (migration `0007`).

> If any document type later becomes gated (full title deed behind a credit spend), that single type moves to a **private** bucket with short-TTL signed URLs minted server-side after checking `unlocks` — the same pattern as `unlock_field_group`. Not needed now; noted so the table design leaves room (`visibility` column defaulting to `'public'`).

---

## 6. Hosting on Cloudflare Workers — the plan

**Decision (2026-08-30):** the app moves to Cloudflare Workers via `@opennextjs/cloudflare`. Rationale: Vercel Pro (required for commercial use, ~$20/mo) was never purchased, so there is no migration to "undo" — and doing it now, while the codebase is small, is far cheaper than after another dozen sprints. One vendor for app + R2 + DNS + CDN + job runners.

### 6.1 What runs the app

- **Cloudflare Workers** with `nodejs_compat` (the Node.js runtime, not the old Edge-only model).
- **`@opennextjs/cloudflare`** adapter — builds the Next output into a Worker. Supports SSR, **server actions**, App Router, middleware, ISR, `next/image` (via a loader).
- **Not** classic Cloudflare Pages / `next-on-pages` — that path is effectively deprecated and forced Edge runtime everywhere.

### 6.2 The go/no-go spike — do this FIRST, time-box to 1 day

Nothing else in this plan should start until this passes:

1. `npx @opennextjs/cloudflare` on a branch; get `pnpm build` → Worker bundle to succeed **on Next 16.0.10**. ← the real risk; the adapter may lag the latest Next.
2. `wrangler dev` / deploy to a `*.workers.dev` preview.
3. Run the existing verification against the preview:
   - `scripts/leak-test.mjs <preview-url>` — the gating boundary still holds.
   - `scripts/access-matrix-test.mjs` — 49 assertions.
   - Route sweep — all 20+ routes return expected status.
   - A real Supabase email + Google sign-in against the preview (cookie SSR auth through the adapter is the second-most-likely thing to break).
4. Check the Worker bundle is under the **10 MB compressed** limit (this app has a lot of Radix + recharts + xlsx; probably fine, verify).

**If all green in ~a day → commit to Cloudflare.** If the adapter fights Next 16 → fall back: buy Vercel Pro, ship there, keep R2 + everything else in this doc unchanged, revisit the host post-launch. R2 is host-agnostic, so nothing else is wasted.

### 6.3 Known adjustments for Workers

| Area | Adjustment |
|---|---|
| `sharp` image resizing | Not available on Workers. Renditions move to the Node ingest job + Cloudflare Images for admin uploads (§4.2). |
| Heavy CPU (xlsx parse of a big sheet, bulk commit) | Workers has CPU-time limits. Bulk ingest already belongs in a **separate job** (Node script / Cloudflare Container / Queue consumer), not a request — §9. |
| `next/og` (`app/icon.tsx`, `opengraph-image.tsx`) | Works on Workers (Satori/WASM). Verify in the spike. |
| Cron work (sitemap refresh, re-embed sweep) | **Workers Cron Triggers** instead of Vercel Cron. |
| Env / secrets | `wrangler secret` + `wrangler.toml` bindings instead of Vercel env UI. R2 + (optionally) Hyperdrive bindings declared here. |
| Supabase Postgres connection | Supabase JS/PostgREST over HTTPS works as-is. If any direct `pg` connection is ever needed at runtime, use **Cloudflare Hyperdrive** or Supabase's pooler — but today the app only uses PostgREST, so no change. |
| Deploy pipeline | GitHub → `wrangler deploy` (GitHub Action or Workers Builds) instead of the Vercel Git integration. |

### 6.4 DNS

Move `boliwala.com` to Cloudflare DNS (free). Needed anyway for the R2 custom domain (`cdn.boliwala.com`) and Workers custom routes. Still blocked on the domain existing at all (`blockers.md` B3).

---

## 7. "A whole R2 setup with Supabase" — what that should mean

There's a common misread here worth stating plainly:

- ❌ **Not:** "replace Supabase with R2." R2 is object storage only — no database, no auth, no queries, no vector search.
- ✅ **Yes:** the two-system split below. This is the standard, boring, correct architecture for this kind of app.

| Concern | System | Why |
|---|---|---|
| Relational data, RLS, gating logic | **Supabase Postgres** | already built, already secured, already verified |
| Auth (email/pass, Google, channel partner) | **Supabase Auth** | already built |
| Vector / semantic search | **Supabase Postgres + `pgvector`** | must be co-located with listings for filtered similarity search |
| Images, PDFs, any blob | **Cloudflare R2** | $0 egress, cheap storage, global cache |
| The app runtime | **Cloudflare Workers** (OpenNext) | one vendor with R2/DNS, ~$5/mo, no Vercel Pro to buy |
| Background jobs / cron | **Cloudflare Queues + Cron** | co-located with the app and R2 |

**Supabase Storage is the only Supabase feature being dropped.** Everything Supabase does *well* — Postgres, RLS, Auth, `pgvector` — stays.

---

## 8. Vector data — the plan (both branches)

You said the embedding source isn't decided. Here's the plan either way; the storage/query side is identical.

### 8.1 Storage & indexing (same regardless of source)

- Enable the `vector` extension in Supabase (available on all plans).
- New table `listing_embeddings`: `listingId`, `embedding vector(1536)`, `model`, `updatedAt`. (Separate table, not a column on `listings`, so re-embedding doesn't rewrite the main row and you can hold multiple vectors per listing later.)
- **HNSW index**: `create index on listing_embeddings using hnsw (embedding vector_cosine_ops)`.
- **Hybrid query** — the whole reason vectors stay in Supabase:
  ```sql
  select l.* from listings l
  join listing_embeddings e on e.listing_id = l.id
  where l.status = 'live' and l.city = 'Pune' and l.reserve_price < 5000000
  order by e.embedding <=> $query_vector
  limit 20;
  ```
  One query, filters + similarity together. Splitting vectors into a separate vector DB (Pinecone/Qdrant) would force a two-phase fetch-then-filter and a second bill. **Don't.** At 70k rows pgvector is trivially fast.

### 8.2 Size note

1536-dim float32 ≈ 6 KB/vector → **~0.5 GB** for 70k, plus ~1–2 GB for the HNSW index. Fits Supabase Pro's 8 GB DB, but it's a real fraction — see §10. Option to halve it: `halfvec` (2-byte) or a 768-dim model.

### 8.3 Branch A — **we generate the embeddings**

- Add an embedding step to the bulk-ingest pipeline (§9).
- Model: **OpenAI `text-embedding-3-small`** (1536-dim, $0.02 / 1M tokens). Embedding all 70k listings ≈ **under $1**. Ongoing: pennies per new listing.
- Needs one new secret (`OPENAI_API_KEY`) and a batch job — the same `scripts/ingest/` Node job that handles images, or a Cloudflare Queue consumer, with concurrency control + retry.
- Re-embed on material edits (title/description/locality change) via a `needs_reembed` flag.

### 8.4 Branch B — **client provides the vectors**

- Ingest reads the vector column straight from the source file into `listing_embeddings`.
- **Must confirm with the client:** exact dimension, and which model produced them (query vectors at search time must come from the *same* model, or results are noise). If the client can't tell you the model, treat it as Branch A instead.

### 8.5 Decision needed

**Who owns embeddings, and if it's the client — what model + dimension?** This blocks the search feature but not the R2 work.

---

## 9. Ingesting 70,000 properties

The existing `xlsx` bulk-upload (column-mapping → preview → commit as drafts) is the right foundation but needs three additions:

1. **Bulk image association** — each row references a folder / ZIP / list of image URLs; the pipeline pulls each image, generates renditions (§4.2), pushes to R2, writes `listing_images` rows.
2. **Bulk PDF association** — same, into `boliwala-docs` + `listing_documents`.
3. **Embedding generation** (Branch A) or **vector column read** (Branch B) → `listing_embeddings`.

Run it as a **resumable background job**, not a request:
- Process in batches (e.g. 500 listings), checkpoint progress in `bulk_upload_batches`.
- Idempotent by external ID so a re-run doesn't duplicate.
- Report per-row failures (bad image URL, unresolvable bank) without aborting the batch — the pipeline already does this for row validation.

**This is its own sprint.** Estimate: pipeline extension + a test run against a few hundred real rows + a full 70k dry run.

---

## 10. Supabase plan sizing

| Item | Assessment |
|---|---|
| Plan | **Pro ($25/mo) minimum.** Free tier is out (row count, pgvector index, no daily backups). |
| DB size (8 GB on Pro) | 70k listings (~200 MB) + images/docs metadata + vectors (~0.5 GB) + HNSW index (~1–2 GB) + `listing_views` growing over time. **Comfortable at launch, watch it.** Add a compute add-on if the HNSW index needs to stay hot in RAM. |
| Egress (250 GB on Pro) | With images/PDFs on R2, Supabase egress is just JSON/API — **stays well within 250 GB.** This is the big relief. |
| Storage (100 GB on Pro) | **Not used** once cut over to R2. |
| Compute | Start on the included instance; upgrade to Small/Medium (~$10–50/mo) only if vector-query latency or memory pressure shows up under load. |

**Effective Supabase bill at 70k: ~$25–75/mo**, versus ~$25 **+ $180+ egress + storage overage** if blobs stayed on Supabase.

---

## 11. Cost comparison (directional, moderate launch traffic ≈ 2 TB/mo image delivery)

| Line item | Vercel Pro + Supabase Storage | **Cloudflare Workers + R2** |
|---|---|---|
| App hosting | Vercel Pro ~$20/mo (+ function usage) | Workers ~$5/mo (+ cheap requests) |
| Blob storage (~1.5 TB) | Supabase ~$32/mo | R2 **~$23/mo** |
| Delivery / egress (~2 TB) | ~$180/mo (Supabase $0.09/GB) | **$0** |
| Image optimization (560k source images) | $100s/mo or quota wall | **$0** (renditions pre-generated) |
| Supabase (Postgres + Auth + pgvector) | ~$25–75/mo | ~$25–75/mo (same) |
| Scales with traffic spikes? | **Yes — unpredictably** | **No — flat** |
| Billing surfaces | 3 (Vercel + Supabase + CF) | 2 (Cloudflare + Supabase) |
| **Ballpark total** | **$280–700+/mo, spiky** | **~$55–105/mo, flat** |

> Figures are illustrative — confirm against current pricing pages. The **shape (flat vs. spiky)** and the **~5× difference at scale** are the real point. Most of the Cloudflare-side total is Supabase, which is unavoidable and shared by both columns.

---

## 12. Rollout — suggested phasing

| Phase | Work | Blocks launch? |
|---|---|---|
| **P0** | **OpenNext + Next 16 go/no-go spike** (§6.2). 1 day, time-boxed. Everything below assumes it passes. | Yes — gates the rest |
| **P1** | Cloudflare account + move `boliwala.com` DNS. Deploy the app to Workers. `wrangler.toml`, secrets, deploy pipeline, R2 binding. Re-run leak-test / access-matrix / route sweep against the Workers deploy. | Yes — foundation |
| **P2** | Create R2 buckets + `cdn.boliwala.com` + cache rules. `lib/storage/r2.ts`. One-off admin upload → R2. Migrate the 12 existing images. Custom image loader in `next.config`. | Yes — foundation |
| **P3** | `listing_documents` table + admin PDF upload + public rendering on listing page. | Yes — stated feature |
| **P4** | `scripts/ingest/` pipeline (images + renditions via `sharp` + PDFs + optional embeddings), resumable, idempotent, 70k dry run. | Yes — can't hand-enter 70k |
| **P5** | `pgvector` extension + `listing_embeddings` + HNSW index + hybrid search query + `/search` semantic sort/toggle. | **No** — fast-follow if embedding ownership is unresolved |

> If P0 fails: buy Vercel Pro, drop P0/P1, keep P2–P5 unchanged. Nothing in P2–P5 depends on the host.

---

## 13. Open decisions

1. **Run the P0 spike** — does `@opennextjs/cloudflare` build and pass verification on Next 16.0.10? This gates the hosting move. (§6.2)
2. **Cloudflare account** — who owns it? Needs a card on file (R2 + Workers paid plan). Same account will hold DNS, R2, Workers, Queues, Images.
3. **Domain** — `boliwala.com` still does not exist (`blockers.md` B3). Blocks DNS move, `cdn.boliwala.com`, Workers custom routes, and the SEO cutover already flagged in `MEMORY.md`.
4. **Embeddings: who generates them?** If the client — what model and dimension? (§8.5)
5. **How do the 70k images/PDFs actually arrive?** ZIP per property? Shared drive? URLs in the sheet? Shapes the P4 pipeline.
6. **Rendition sizes** — 320/800/1600 proposed; confirm against the real listing-card and gallery layouts.
7. **`.apk` intent** — thin WebView wrapper, or a real Capacitor app? Decide before it changes frontend choices. (Appendix C)

---
---

# Appendix A — Razorpay is NOT a launch blocker

**Decision (2026-08-30):** payments are **post-launch**. Do not hold the launch for Razorpay.

### Launch-month billing (manual)

- The **Pricing page** keeps its plan cards but the CTA becomes **"Contact Sales"**.
- "Contact Sales" → sends the team an email (name, phone, plan of interest, message).
- Team bills the customer manually over **WhatsApp / UPI** and credits their account by hand (admin already supports `UPDATE profiles` for credits / a manual subscription row).
- This is the **first month only** while Razorpay is built.

### What this means for the plan

- The whole **Sprint 3.5 / B1 / B2 Razorpay critical path in `blockers.md` and `MEMORY.md` §9.3 is removed from the launch gate.** Razorpay becomes a normal post-launch sprint, unblocked whenever test credentials arrive.
- `MEMORY.md`'s repeated "15 Sep is only achievable if Razorpay test keys land by 17 Aug" caveat **no longer applies** — that was the single biggest schedule risk and this retires it.
- Still needed for launch: a working **"Contact Sales" form → email** path. That depends on transactional email (Resend, `blockers.md` B?) **or** a simpler mailto / form-to-inbox stopgap (Formspree-style, or a Supabase Edge Function + a single SMTP call). A stopgap is fine for month one.

### Build later (own sprint, no date pressure)

Razorpay order → checkout → webhook verification → entitlement; admin Payments / Packages / Success-Fee screens that currently show mock data.

---
---

# Appendix B — Navbar & Channel Partner auth changes

Captured from the 2026-08-30 brainstorm. These are **updations to existing components**, not new systems.

### B.1 Navbar buttons (`components/header.tsx`)

The Login / Sign Up buttons **stay pointed at `/login` and `/signup`** (no change to targets — the earlier idea of routing them to the partner page is dropped). **Only the styling changes:**

| Button | Current | New |
|---|---|---|
| **Log In** | plain text link | **orange background, white text** |
| **Sign Up** | orange background, white text | **white background, black text** |

Apply in **both** the desktop cluster (`header.tsx` ~line 117–133) and the mobile menu (~line 204–219). Signed-in state ("My Account") is unchanged.

### B.2 "Login as Channel Partner" on the auth page

On the normal auth view (`components/auth-view.tsx`), **add a button directly below the Google button**:

- Label: **"Login as Channel Partner"**
- Action: navigates to a **channel partner login page** (e.g. `/partner/login`).

### B.3 The channel partner login page

- **Visually identical** to the normal auth page (reuse `auth-view.tsx` with a `variant` / `role` prop rather than duplicating the component).
- Same options: **email + password**, **and Google Auth**.
- Difference is **intent + post-login routing**, not layout — a partner signing in here should land on the partner area, not `/profile`.

### B.4 Open questions for this piece

1. Is there an actual **`channel_partner` role** behind this, or is it just a different landing page for the same account type? (`MEMORY.md` §20: the `channel_partner` enum value exists but **zero code references it**, and `/partner/dashboard` has no real guard — it's a 583-line mockup.) Wiring a real partner role is a bigger job than a login page.
2. Does "Login as Channel Partner" also need a **"Sign Up as Channel Partner"** path, or do partners only get accounts after their `/partner` application is approved?
3. Should the existing `/partner` (enrolment form) and a new `/partner/login` be linked to each other?

> Recommend: for launch, make `/partner/login` a thin variant that just changes post-login routing, and defer the real `channel_partner` role/guard/dashboard to the post-launch "partner scope" sprint (`post_audit_plan.md` §17) unless the client says partners are core to launch.

---
---

# Appendix C — Does this architecture support the `.apk` later?

**Short answer: the hosting choice is neutral. Cloudflare vs Vercel makes no difference to whether an Android APK is feasible.** What matters is the *frontend* architecture, and that decision is independent of where the app is hosted.

### The URD wants a Capacitor APK (`SCOPE_AUDIT.md`)

Capacitor wraps web code in a native shell. There are two ways to build it, and they have very different cost:

| Approach | What it is | Cost | Works with this stack? |
|---|---|---|---|
| **Thin wrapper** (Capacitor pointing at the live URL, or a Trusted Web Activity / PWA install) | The APK is essentially a branded browser window onto `boliwala.com` | ~days | **Yes, trivially.** Any host. The app is already getting a PWA manifest (`MEMORY.md` §15.5). Risk: Play Store sometimes rejects pure wrappers with no native value-add. |
| **Real Capacitor app** (assets bundled in the APK, talking to an API) | The mobile frontend becomes a client-side SPA; it calls API endpoints for data; auth via the Supabase JS client | 1–2 sprints of frontend work | **Yes, but needs work** — the current app is SSR-heavy Next with server actions and cookie auth, none of which bundles into a static APK. You'd expose the data layer as API route handlers and build a client shell. |

### Where each hosting option sits

- **Cloudflare Workers** — fine for both. Server actions and route handlers run the same. If you go "real Capacitor app", Workers is a clean global API layer and R2 gives fast image loads on mobile networks.
- **Vercel** — equally fine for both. No advantage lost by choosing Cloudflare.

### The parts that actually matter for the APK (host-agnostic)

1. **Supabase Auth in Capacitor** — supported, documented. OAuth (Google) needs deep-link handling (`app://` redirect back into the app) and a native Google sign-in plugin for a good UX. Email/password is straightforward.
2. **Keep the data layer callable without a browser session** — i.e. real API route handlers (bearer-token auth via the Supabase JS client), not only server actions bound to cookies. Worth keeping in mind as new features are built so the APK isn't a rewrite later.
3. **R2 public URLs** work identically from a native WebView / fetch — no CORS surprises for public buckets.

### Recommendation

Don't let the APK influence the hosting decision — it doesn't need to. **Do** decide *which kind* of APK you want before building much more frontend:
- If it's a **thin wrapper**: nothing to do now; it's a post-launch packaging task.
- If it's a **real Capacitor app**: start adding API route handlers alongside server actions as you build, so the mobile client has a data layer to call. This is the only choice that has a cost if deferred — and it's a frontend cost, paid regardless of Cloudflare or Vercel.
