# Boliwala — Codebase Audit

**Date:** 22 August 2026
**Local HEAD:** `ddbadb1` — "Add superadmin role and role-based landing after sign-in"
**Method:** direct source inspection + live introspection of the Supabase project (`rimyttphaidvlytefvil`). Every claim below was checked, not carried forward from `MEMORY.md`.

---

## 0. Read this first — one fact explains most of the bug list

**Production is running `0e6cfd5`, three commits behind `main`. Every build since then has failed.**

The Vercel log you sent is for `ddbadb1`, and it fails at prerender. The two commits before it (`e7cac13` Sprint 6, `7575bc4`) introduce the *same* code path, so they failed the same way. That means production does not contain:

| Commit | What production is missing |
|---|---|
| `e7cac13` | Sprint 6 — the entire saved-alerts feature, profile detail fields (city/PAN/Aadhaar), live statistics, `/partner/dashboard` auth guard |
| `7575bc4` | blocker doc updates |
| `ddbadb1` | `superadmin` role, the superadmin allowlist, role-based landing after sign-in |

So when you say *"Create alert doesn't work"* and *"boliwaladevs should be superadmin but role assigned is user"* — you are testing a build that predates both features. The database already has the right data (see §1); the deployed app does not have the code that uses it.

**Fix the build first. Roughly half the reported issues will disappear on their own.** The other half are real and listed in §3.

---

## 1. Question 1 — Is admin functionality really present?

### Answer: **"Yes, incomplete — but an admin user *is* assigned."**

**Role separation is real and enforced.** This is not a mockup guard.

- `Role` enum in the live DB: `user`, `admin`, `channel_partner`, `superadmin`.
- `lib/auth/admin.ts` → `requireAdmin()` reads the caller's **own session** (not the service-role client), looks up `profiles.role`, redirects guests to `/login` and non-admins to `/`. Verified as the real authorization boundary — every admin data call in `lib/data/admin.ts` runs the service-role client only *after* this check passes.
- There is **no self-service path to becoming admin.** Migration `0005` revoked the table-level `UPDATE` grant on `profiles` and re-granted only `fullName`/`phone`, so a signed-in user cannot `PATCH` their own `role`. Confirmed still in force.
- `superadmin` (migrations `0012`/`0013`) sits above `admin`. The allowlist is data, not code: `settings.superadmin_emails` = `["boliwaladevs@gmail.com"]`, applied by the `handle_new_user()` trigger at signup, case-insensitively.

### The admin user is already assigned

Live query against `public.profiles` — **3 accounts total.** Emails other than
the owner account are deliberately not reproduced here; this repo is public.

| Account | Role | Auth provider | Password set? |
|---|---|---|---|
| `boliwaladevs@gmail.com` (already public in migration `0013`) | **`superadmin`** | email | yes — used successfully today |
| two personal accounts | `user` | google | n/a — OAuth only |

**Your complaint that the role shows as `user` is a deployment artifact, not a data problem.** The DB says `superadmin`. The deployed build predates `landingPathForRole()`, so it sends every account to `/profile` regardless of role, and shows no admin entry point.

### Credentials

**I cannot give you the password.** Supabase stores it as a bcrypt hash — it is not retrievable by me, by the service-role key, or by anyone. What I can tell you:

- The account **is** `boliwaladevs@gmail.com`, it **is** `superadmin`, it **does** have a password set, and it signed in successfully at **08:09 UTC today** — so a working password exists and is in someone's hands.
- If it has been lost: use **Forgot password?** on `/login` (`resetPasswordForEmail` is wired and functional), or reset it from the Supabase dashboard → Authentication → Users.
- Once the build is fixed, signing in with that account lands directly on `/admin`.

### What "incomplete" means — 5 of 13 admin sections are real

| Section | Status |
|---|---|
| Dashboard KPIs | **Real** — 8 live queries (`lib/data/admin.ts`) |
| Listings Management | **Real** — full CRUD, 4 statuses, filters, soft-cancel |
| Add/Edit Listing | **Real** — 4 tabs incl. gated fields, image upload to Storage |
| Bulk Excel Upload | **Real** — column mapping, per-row validation, commit-valid-only |
| Callback Requests | **Real** — list, search, status workflow |
| Settings | **Real** — 4 pricing fields writing to `settings` |
| Packages, Payments, Success Fees | **Mock** — blocked on Razorpay |
| Users, Partners | **Mock** — static fabricated rows |
| Alerts, Alert Engine, Email Campaigns, WhatsApp, Segments, Engagement Analytics | **Mock** |

Also still mock inside the real Dashboard: the Recent Activity feed and the 8-month revenue chart (nothing writes to `admin_audit_log`).

---

## 2. Question 2 — Is channel partner functionality really present?

### Answer: **"No such functionality exists"** — with two qualifications.

There is a `channel_partner` value in the `Role` enum. **Zero lines of application code reference it.** A repo-wide grep for `channel_partner` returns exactly two hits, both against the *applications* table, neither against the role:

```
app/actions/partner.ts:22    .from("channel_partner_applications").insert(...)
lib/data/admin.ts:46         .from("channel_partner_applications").select(count)
```

What actually exists:

| Piece | Reality |
|---|---|
| Partner **role** | Enum value only. No guard, no check, no assignment, no UI. Nobody holds it. |
| Partner **enrolment form** (`/partner`) | **Real.** Writes to `channel_partner_applications`. **0 rows** — nobody has applied. |
| Partner **dashboard** (`/partner/dashboard`) | **583-line static mockup.** Zero data fetching. Fabricated earnings. |
| Partner **dashboard auth** | Guard is `if (!user) redirect("/login")` — **"is signed in", not "is a partner."** Any customer account can open the partner dashboard and see fake commission figures. |
| Admin **approval workflow** | Does not exist. The Partners tab in the admin panel is mock. |

**There is no partner user assigned and no credentials to give**, because there is no mechanism that would make an account a partner. Assigning `role = 'channel_partner'` to someone today would change nothing anywhere in the app.

⚠️ **Security note:** `/partner/dashboard` being reachable by any logged-in user is worth closing before launch, even though nothing real leaks — it displays invented earnings that a customer could reasonably mistake for a live product.

📌 This is still the open scope question from `MEMORY.md` §7: `boliwala_features.txt` §2.6 says *"no partner portal or directory at launch"*, yet the page exists. **This needs a client decision, not an engineering fix.**

---

## 3. Reported issues — triage

Legend: 🔴 real bug in current code · 🟡 works locally, missing from production · ⚪ never built

| # | Report | Verdict | Detail |
|---|---|---|---|
| 1 | **Login/Signup button missing from top nav** | 🔴 **Real** | `components/header.tsx` has no auth link at all — desktop or mobile. The only CTA is "Free Consultation" → `/contact`. There is no way to reach `/login` from the header on any page. |
| 2 | **Password not viewable/hideable** | 🔴 **Real** | `auth-view.tsx:229` and `reset-password-view.tsx:47` both hardcode `type="password"`. No toggle exists anywhere in the codebase. |
| 3 | **Login error text illegible (red on red)** | 🔴 **Real — confirmed root cause** | `app/globals.css:22-23` — in light mode `--destructive` and `--destructive-foreground` are set to the **identical** value `oklch(0.577 0.245 27.325)`. The toast uses `bg-destructive text-destructive-foreground`, so it renders red text on the same red. Dark mode is fine (`0.396` vs `0.637`). **One-line fix.** |
| 4 | **Create alert doesn't work** | 🟡 + ⚪ | The `/search` banner (`search-alert-banner.tsx` → `saveSearchAlert`) is fully built and correct — but shipped in `e7cac13`, which is **not deployed**. Separately, the "+ Create Alert" button on `/profile` is only `<Link href="/search">` — it navigates, it does not create. `alert_subscriptions` has **0 rows**, consistent with the feature never having been live. |
| 5 | **Edit / Delete alert doesn't work** | ⚪ **Never built** | The Alerts tab offers only **Pause / Resume** (`setAlertActive`). There is no edit path and no delete path — by design (`0010` deliberately narrows the client-writable surface to `isActive` alone). This is a genuine feature gap, not a regression. |
| 6 | **No dropdowns in "Browse More"** | 🔴 **Real** | Two compounding causes. (a) `app/search/page.tsx:24` — `hasSearched` is false when there are no query params, so `<PropertyResults>` (which *contains* the entire filter sidebar) is not rendered at all. "Browse More →" links to bare `/search`, so you land on an empty page. (b) Even when rendered, filters are server-rendered `<Link>` lists, not `<select>` dropdowns — only sort is a dropdown. |
| 7 | **boliwaladevs role is `user`, should be superadmin** | 🟡 **Data is correct** | DB says `superadmin`. Role-based landing shipped in `ddbadb1` — the failing build. See §1. |
| 8 | **No partner / superadmin creds to test with** | See §1, §2 | Superadmin account exists and is assigned; password is not retrievable, use reset. Partner role is not implemented at all. |
| 9 | **Password recovery tested?** | 🟡 **Built, not verified end-to-end** | `resetPasswordForEmail` + `/reset-password` + `supabase.auth.updateUser` are all wired. **But `RESEND_API_KEY` is empty** — delivery relies on Supabase's built-in SMTP, which is rate-limited and not production-grade. Untested against a real inbox. |
| 10 | **Can a user delete their account?** | ⚪ **No** | No delete-account code anywhere. Note `profiles → auth.users` cascades on delete, so the DB side is ready; the UI and server action are not built. Relevant to DPDP compliance given PAN/Aadhaar are now stored. |
| 11 | **Can a user change their own password?** | ⚪ **Not from the profile** | Only via the emailed reset link. No "change password" field in the Account Info tab. |
| 12 | **Can an authenticated user subscribe/unsubscribe to alerts?** | 🟡 Partial | Subscribe: yes (via `/search` banner, once deployed). Unsubscribe: only **pause**, and only for signed-in owners. **Guest unsubscribe is deliberately unsolved** — it needs a signed token in an email footer, which needs Resend. |
| 13 | **Google Auth wired?** | ✅ **Yes, fully** | `signInWithOAuth` + `/auth/callback` route + `exchangeCodeForSession` + role-based redirect. Two accounts have already signed in via Google successfully. |
| 14 | **Error codes must be visible** | 🔴 Same as #3 | Messages *are* passed through (`error.message` reaches the toast) — they are simply invisible. Fixing the token makes existing errors readable; no new error handling needed. |
| 15 | **Nav bar on the portal is the website nav bar** | 🔴 **Real** | `/profile` renders the marketing `<Header>`/`<Footer>`. There is no authenticated app shell. |

---

## 4. The build failure — root cause and fix

```
Error occurred prerendering page "/about"
Error: supabaseKey is required.
```

**Chain:**

1. `app/about/page.tsx:9` sets `export const revalidate = 3600` → the page is **prerendered at build time**.
2. It calls `getSiteStats()` (`lib/data/stats.ts:31`).
3. `getSiteStats()` calls `createAdminClient()`, which reads `process.env.SUPABASE_SERVICE_ROLE_KEY`.
4. That variable is **not present in the Vercel build environment** → `supabaseKey` is `undefined` → the Supabase client constructor throws.

`/login` and `/signup` also prerender and also call `getSiteStats()`. `/about` just failed first and aborted the build.

### Recommended fix — drop the service-role client here

The comment at `lib/data/stats.ts:29` justifies the admin client on the grounds that a cookie-bound client would make marketing pages dynamic. That reasoning is sound, but the admin client is not needed to satisfy it. I verified the column grants directly:

```
anon          → id, status, city, reservePrice, estimatedMarketValue   (SELECT granted)
authenticated → id, status, city, reservePrice, estimatedMarketValue   (SELECT granted)
```

**Every column `getSiteStats()` touches is publicly readable.** Swapping `createAdminClient()` for a plain anon-key `createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)` — a non-cookie client, so still statically prerenderable — fixes the build using only `NEXT_PUBLIC_*` vars, which Vercel already has (the rest of the app works).

It is also strictly better security: aggregate public counts should not require a key that bypasses RLS.

### Alternative — set the env var

Adding `SUPABASE_SERVICE_ROLE_KEY` to the Vercel project also unblocks the build. **It is needed there regardless** — `lib/supabase/admin.ts` is used at *runtime* by listing redaction, view tracking, the unlock flow, admin data, and the alert duplicate check. If it is genuinely absent from Vercel, those paths are broken in production too and this build failure is the least of it.

**→ Do both: add the env var (runtime correctness) *and* switch `stats.ts` to the anon client (so a marketing page never depends on a bypass key at build time).**

---

## 5. Other findings worth acting on

| | Finding |
|---|---|
| 🔴 | `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`. If this value is also set in Vercel, every canonical URL, sitemap entry, OG tag and OAuth redirect in production points at localhost. **Verify the Vercel value.** |
| 🔴 | `/partner/dashboard` reachable by any signed-in user (§2). |
| 🟡 | `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_CONTACT_PHONE` are both empty → the contact block renders with no phone number. |
| 🟡 | `RAZORPAY_*` and `RESEND_*` all still empty. No payment code exists in the repo at all — this remains the critical path for 15 Sep. |
| 🟡 | Live data is thin: **12 listings, 6 banks, 3 users, and 0 rows** in shortlists, alerts, callbacks, partner applications, payments and subscriptions. Nothing will demo convincingly without seeding. |
| 🟡 | PAN/Aadhaar are now stored (`0009`) with format CHECKs and per-column grants, but **no application-level encryption, no retention policy, no access audit trail** — and no account-deletion path (#10). Under DPDP that combination is a liability. |
| ⚪ | Satoshi font still never loads — the three `.woff2` files are 609-byte CSS snippets, not fonts. The app silently falls back to `system-ui`. |

---

## 6. Suggested order of work

1. **Fix the build** (§4) — nothing else can be validated until production matches `main`.
2. **Verify `NEXT_PUBLIC_SITE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.**
3. **Redeploy, then re-test issues 4, 7, 12** — expect them to resolve without code changes.
4. **One-line fix: `--destructive-foreground`** (§3 #3) — unblocks every error message in the app.
5. **Add Login/Signup to the header** (§3 #1) — currently no route into auth from any marketing page.
6. **Render the filter sidebar on bare `/search`** (§3 #6) — "Browse More" landing on an empty page is the worst first impression in the product.
7. **Password show/hide toggle** (§3 #2).
8. **Decide on the partner portal** (§2) — scope call, blocks any further partner work.
9. Then: alert edit/delete, change password, delete account.

---

*Audit performed by direct file reads and live database introspection. No code was modified and no database rows were created, altered or deleted.*
