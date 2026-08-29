# POST_AUDIT_PLAN.md — Boliwala.com

**Created:** 22 August 2026
**Source:** `codebase_audit.md` (22 Aug) + `MEMORY.md` §20/§21
**Scope:** the real, confirmed problems only. Deployment artifacts are excluded — see §0.
**Status of this document:** plan only. No code has been written against it.

> **Companion docs:** `SPRINT_CALENDAR.md` (the 15 Sep master plan — this document does **not** replace it, it inserts into it), `blockers.md` (credential/decision register), `testing_guide.md` (the regression bar).

---

## 0. What this plan does and does not cover

The audit found 15 reported issues. They fell into three groups, and **only two of those groups are work**:

| Group | Count | Disposition |
|---|---|---|
| 🟡 Built, but never deployed (production was 3 commits stale) | 3 | **Not in this plan.** Fixed by commit `375a160`. Re-test after deploy; expect them to pass. |
| 🔴 Real bugs in current code | 5 | **Sprint 15** |
| ⚪ Genuinely never built | 5 | **Sprint 16** |
| Scope / compliance decisions | 2 | **Sprint 17** — needs a client answer before any code |

**Re-test these three first and confirm they self-resolved before spending a minute on them:** create-alert from `/search`, superadmin landing on `/admin`, and the profile My Alerts tab. All three shipped in `e7cac13`/`ddbadb1` and were only ever failing because production was serving `0e6cfd5`.

---

## 1. ⚠️ Timeline reality check — read before scheduling anything

This plan inserts new work into a calendar that is **already behind**. Stating it plainly rather than burying it:

| Deadline | Owner | Status as of 22 Aug |
|---|---|---|
| **17 Aug** — Razorpay test keys | Client | 🔴 **MISSED by 5 days.** `RAZORPAY_KEY_ID`, `_KEY_SECRET`, `_WEBHOOK_SECRET` all still empty. |
| **17 Aug** — Resend API key | Client | 🔴 **MISSED by 5 days.** `RESEND_API_KEY`, `RESEND_FROM_EMAIL` still empty. |
| **24 Aug** — contact number + WhatsApp | Client | ⏳ 2 days out. `NEXT_PUBLIC_CONTACT_PHONE` and `NEXT_PUBLIC_WHATSAPP_NUMBER` both still empty. |
| **24 Aug** — Privacy Policy + Terms copy | Client | ⏳ 2 days out. Not received. Footer still has 4 dead `href="#"` links. |

`SPRINT_CALENDAR.md` Part 4 states the consequence itself: *"Launch slips day-for-day."* Week 2 (17–23 Aug) was allocated entirely to Sprint 3.5 (Razorpay) and Sprint 4.5 (Resend). **Neither could start. That week is gone.**

**The silver lining, and the reason to run this plan now:** Sprints 15 and 16 below are 100% executable with zero client input. They can absorb the dead week productively instead of it being lost outright. That is the single strongest argument for doing this work *now* rather than after payments.

**What this plan cannot do** is recover the payment critical path. Razorpay remains ~2 weeks of build that has not started. If keys do not arrive this week, the honest options stay the two already written into `blockers.md`: move the date, or launch the free tier with paid as a fast-follow.

---

## 2. The bifurcation principle

This project already bifurcates sprints and this plan keeps that convention (`MEMORY.md` §9, §11):

- **Sprint N** — executable today. Zero client input, zero external credentials, zero decisions pending. Can start the moment the sprint opens.
- **Sprint N.5** — blocked. Waiting on a credential, a dashboard login, a legal answer, or a client decision. Scoped now so it is ready to execute the hour the blocker clears.

> **On numbering:** sprint numbers in this project are allocation order, not execution order — Sprint 9 runs in Week 5 while Sprint 10 runs in Week 3. Sprints 15–17 below are **pre-launch** work despite following Sprint 14 (hypercare). See §8 for actual calendar placement.

---

## 3. Sprint 15 — Critical UX & Auth Repair

**Blocked by:** nothing. **Estimated:** 2 days. **Priority:** highest in this document.

Every item here is a confirmed defect in current `main`, found by direct file inspection. Three of the five make the product actively unusable for a first-time visitor.

| # | Task | File | Verify |
|---|---|---|---|
| 15.1 | **Fix the invisible-error bug.** `--destructive` and `--destructive-foreground` are set to the *identical* oklch value in light mode, so every destructive toast is red text on the same red. Give the foreground a light value (dark mode already does this correctly: `0.396` bg / `0.637` fg). | `app/globals.css:22-23` | Log in with a wrong password in **light** mode; the message is legible. Repeat in dark mode; unchanged. Check every `variant: "destructive"` call site still reads correctly. |
| 15.2 | **Add Login / Sign Up to the header.** There is currently *no* auth link anywhere in the header, desktop or mobile — a visitor cannot reach `/login` from any marketing page. Header has zero auth awareness today (0 references to session/supabase), so this needs a signed-in state too: Login/Sign Up when signed out, an account link when signed in. | `components/header.tsx` | Signed out: Login and Sign Up visible on desktop **and** in the mobile menu, both routing correctly. Signed in: replaced by an account entry. No layout shift on the transparent→solid scroll transition. |
| 15.3 | **Make bare `/search` useful.** `hasSearched` is false with no query params, so `<PropertyResults>` — which contains the *entire* filter sidebar — never renders. "Browse More →" on `/profile` links to bare `/search` and lands on an empty page. Render results and filters by default. | `app/search/page.tsx:24` | `/search` with no params shows all 12 live listings **and** the filter sidebar. Filter links still build correct URLs from the empty state. Confirm bank/city counts are still right. |
| 15.4 | **Password show/hide toggle.** `type="password"` is hardcoded with no toggle anywhere in the codebase. Both auth surfaces need it. | `components/auth-view.tsx:229`, `components/reset-password-view.tsx:47` | Toggle flips the input type, has an accessible label, and does not submit the form when clicked (`type="button"`). |
| 15.5 | **Remove the marketing navbar from the account area.** `/profile` renders the marketing `<Header>`/`<Footer>`, so a signed-in user's portal wears the public website's nav — "Free Consultation", the scroll-to-top logo, the whole marketing chrome — on top of the page's own tab sidebar. Replace it with a minimal account header. | `app/profile/page.tsx` | A signed-in user on `/profile` sees no marketing nav and no marketing footer. They can still reach the public site, see their credit balance, and sign out. Mobile: no double-nav, no dead scroll-to-top handler. |

> **15.5 is narrower than it looks, and the pattern already exists.** Verified by inspection: **`/profile` is the only authenticated page carrying the marketing header** — `/admin` already has its own dark 240px sidebar shell (`components/admin-view.tsx:169`) and imports neither `<Header>` nor `<Footer>`. So this is not a new design problem; it is `/profile` being the odd one out. Copy the shape `/admin` already uses.
>
> **Do not simply delete the two components.** `/profile` would lose its only route back to the public site and its only visible sign-out affordance outside the tab content. The replacement needs, at minimum: logo → `/`, credit balance, and sign out. Scope it as *replace*, not *remove*.
>
> **Sequencing:** do 15.2 first. It gives the header a signed-in state, which settles what the account header should contain and avoids building the two in conflicting directions.
>
> **Related, but deliberately not folded in here:** `/partner/dashboard` has *neither* the marketing header nor a shell of its own. It is a bare mockup and is handled by **17.A.1**, not by this task.

**Sprint 15 exit bar:** `tsc --noEmit` clean · `pnpm build` clean with the service-role key blanked (the §21.3 method — do not regress the fix) · leak test + access matrix pass · manual pass of the five rows above in **both** light and dark.

---

## 4. Sprint 15.5 — Environment & Deploy Hardening

**Blocked by:** Vercel dashboard access + Supabase dashboard access. **Estimated:** ~1 hour of clicking, once someone with access is at a keyboard.

Not code. All of it is configuration the repo cannot reach, and two items are carried-over security debt that has now been open for two weeks.

| # | Task | Why it matters | Verify |
|---|---|---|---|
| 15.5.1 | **Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.** | `375a160` unblocked the *build*, but `lib/supabase/admin.ts` is used at **runtime** by listing redaction, view tracking, the unlock RPC path, all admin data, and the alert duplicate check. If the variable is absent from the environment generally, those are broken in production right now. | Open a live listing as a guest in production — gated fields render as locked, not as a 500. Unlock as a member with credits. Load `/admin`. |
| 15.5.2 | **Fix `NEXT_PUBLIC_SITE_URL` in Vercel.** | Locally it is `http://localhost:3000`. If Vercel carries the same value, every canonical, sitemap entry, OG tag and OAuth redirect points at localhost — which would also break Google sign-in in production. | `curl` the production `/sitemap.xml` and `/robots.txt`; every URL is the real domain. Google sign-in completes. |
| 15.5.3 | **Verify Supabase URL Configuration + Google redirect URI.** | Flagged unverified since Sprint 2.5 (`MEMORY.md` §4) and never independently checked. Named there as the most likely failure point at real login time. | Google sign-in works from the production domain, not just localhost. |
| 15.5.4 | **Rotate the database password.** Carried over from **Sprint 6.7**, still open. | The password was pasted into a chat transcript during the original build. | New password works; `DATABASE_URL`/`DIRECT_URL` updated with `@` percent-encoded (gotcha §5.2). |
| 15.5.5 | **Revoke blanket table grants.** From `MEMORY.md` §19.7. | `anon` and `authenticated` hold blanket `DELETE`/`INSERT`/**`TRUNCATE`** on `profiles`. RLS denies the first two — but **TRUNCATE is not subject to RLS at all**. Defence-in-depth, not a known open hole, but it deserves its own careful pass. | `get_advisors` clean except the known-intentional notices. Full access matrix re-run after, since grants are exactly what it tests. |

> **15.5.4 and 15.5.5 belong in the same session** — both are database-side security housekeeping needing the same access. §19.7 already recommended pairing them.

---

## 5. Sprint 16 — Account Self-Service

**Blocked by:** nothing. **Estimated:** 3 days.

These are not regressions. They were never built. Every one is something a user of a paid financial-services product reasonably expects to find, and their absence is the bulk of the "normal user me hi bohot issues hai" report.

| # | Task | Current state | Verify |
|---|---|---|---|
| 16.1 | **Change password from the profile.** | Only reachable via the emailed reset link. No field in the Account Info tab. | Change password while signed in (requires re-entering the current one), sign out, sign in with the new password. Old password rejected. |
| 16.2 | **Edit an alert.** | Does not exist. Only Pause/Resume. | Edit an alert's filters and frequency; the change persists and `searchHrefFromAlertFilters` still rebuilds a working search URL. |
| 16.3 | **Delete an alert.** | Does not exist. `0010` deliberately narrowed the client-writable surface to `isActive` alone, so this **needs a migration or a server action** — it is not a UI-only change. | Delete removes the row. A signed-in user cannot delete another user's alert (verify against RLS, not just the UI filter). |
| 16.4 | **Make "+ Create Alert" actually create.** | `components/profile-view.tsx:327` is a bare `<Link href="/search">`. It navigates; it does not create. | Either it opens a real create flow, or it is relabelled to match what it does. Do not ship a button whose label lies. |
| 16.5 | **Delete account.** | No code anywhere. `profiles → auth.users` already cascades (`0003`), so the DB side is ready; UI and server action are not. | Deletion removes the auth user, cascades profile + ledger + shortlists + unlocks, and signs the session out. Requires explicit confirmation. |

> **16.3 has a schema consequence — decide it before building.** `0010` restricted client writes to `isActive` on purpose. Options: (a) a service-role server action that deletes after verifying ownership (matches the `unlock_field_group` precedent, no migration needed), or (b) a new DELETE policy scoped to `userId = auth.uid()`. **(a) is the smaller change and keeps the client-writable surface as narrow as `0010` intended.**

> **16.5 carries real weight, not just UX.** PAN and Aadhaar are now stored (`0009`). A product holding regulated identity data with **no deletion path at all** is the weakest point in the current compliance posture. This is the highest-value item in Sprint 16 even though it looks like the most optional.

**Sprint 16 exit bar:** `tsc --noEmit` · `pnpm build` · access matrix pass · alert RLS re-verified (the `0010`/`0011` checks in §19.6 still hold) · a full account lifecycle run end-to-end on a throwaway user, **then cleaned up** per the standing test-hygiene rule (§5.7).

---

## 6. Sprint 16.5 — Email-Dependent & Compliance

**Blocked by:** `RESEND_API_KEY` (§1) and a client/legal answer. **Estimated:** 2 days after unblocking.

| # | Task | Blocked on |
|---|---|---|
| 16.5.1 | **Guest unsubscribe**, via a signed token in the email footer. Deliberately unsolved in Sprint 6 — there is no way to prove a guest owns an email address until there is an email flow to confirm it (§19.2). | Resend |
| 16.5.2 | **Account-deletion confirmation email** — pairs with 16.5. | Resend |
| 16.5.3 | **PAN/Aadhaar compliance closure**: application-level encryption at rest, a written retention & deletion policy, and an access audit trail. Named as outstanding in `0009`'s own header and in §19.1. | Client / whoever owns compliance |

> **16.5.3 is not an engineering decision.** Supabase encrypts the volume, which is *not* the same as protecting the value from anyone holding a valid session or the service key. This needs an owner named, not a ticket.

---

## 7. Sprint 17 — Channel Partner: resolve the scope contradiction

**Blocked by:** a client decision. **No code should be written until it is answered.**

The audit found a direct contradiction that has been open since `MEMORY.md` §7 and has never been resolved:

- `boliwala_features.txt` §2.6: *"no partner portal or directory at launch."*
- `SPRINT_CALENDAR.md` Sprint 10: **eight tasks** building a full partner portal, scheduled for Week 3.
- The live code: a `channel_partner` enum value that **zero lines reference**, a 583-line static mockup at `/partner/dashboard`, and a real enrolment form with **0 applications**.

**The question for the client is one sentence: does the Channel Partner portal ship on 15 September, yes or no?**

### Branch A — "No, not at launch" (recommended)

| # | Task | Estimated |
|---|---|---|
| 17.A.1 | Remove or hard-gate `/partner/dashboard`. Today its guard is `if (!user)` — "is signed in", not "is a partner" — so **any customer account can open it and see fabricated commission figures.** | 1 hour |
| 17.A.2 | Keep the enrolment form live (it works and captures real applications), add a "we'll be in touch" state. | 1 hour |
| 17.A.3 | Move Sprint 10's eight tasks to a named post-launch phase. | — |

**This frees an entire Week-3 sprint slot** — which, given §1, is the most valuable thing in this document after Sprint 15.

### Branch B — "Yes, it ships"

Sprint 10 stands as written in `SPRINT_CALENDAR.md`, with two corrections the audit surfaced:

- **10.1 has the wrong enum value.** It says `profiles.role = 'partner'`. The live enum is **`channel_partner`**. Building against `'partner'` fails at the database.
- **10.1 is larger than one line implies.** There is no partner role logic of any kind today — no guard, no assignment path, no admin approval workflow. `requireAdmin()` is the pattern to copy, but a partner equivalent, an approval flow, and commission logic are all net-new.

> ⚠️ **Whichever branch is chosen, 17.A.1 should be done this week regardless.** A signed-in customer being able to view invented partner earnings is a credibility problem that costs an hour to remove and does not depend on the scope answer.

---

## 8. Where these sprints sit in the calendar

Sprint 15 and 16 need no client input, so they slot straight into the time that Razorpay's absence has vacated.

```
WEEK 2 REMAINDER (22–23 Aug)  Sprint 15      ← start immediately, 2 days
                              Sprint 15.5    ← parallel, needs dashboard access
                              Sprint 17.A.1  ← 1 hour, do regardless of branch

WEEK 3 (24–30 Aug)            Sprint 16      ← 3 days
                              Sprint 17      ← client answers; Branch A frees Sprint 10
                              Sprint 3.5     ← IF AND ONLY IF Razorpay keys arrive
                              Sprint 5.5     ← IF legal copy arrives 24 Aug

WEEK 4+                       Sprint 16.5    ← whenever Resend unblocks
                              Existing calendar resumes
```

**Sprints 15 and 16 do not compete with anything.** Everything scheduled for Weeks 2–3 in the master calendar is blocked on credentials that have not arrived. There is no trade-off being made here — this is otherwise-idle time.

---

## 9. Decisions needed from the client

Ordered by how much downstream work each one gates.

| # | Decision | Gates | Needed by |
|---|---|---|---|
| D1 | **Razorpay test keys — are they coming?** | Sprints 3.5, 7, 8, 9, 11 and the launch date itself | 🔴 **Overdue since 17 Aug** |
| D2 | **Does the Channel Partner portal ship on 15 Sep?** | Sprint 10 (8 tasks, a full Week-3 slot) | 24 Aug |
| D3 | **Resend key** | Sprints 4.5, 9, 16.5 | 🔴 **Overdue since 17 Aug** |
| D4 | **Who owns PAN/Aadhaar compliance?** (encryption, retention, audit trail) | 16.5.3 — and the legal exposure of already holding the data | 24 Aug |
| D5 | **Privacy / Terms copy, contact number, WhatsApp** | Sprint 5.5, 4 dead footer links | 24 Aug |

---

## 10. Standing verification bar

Every sprint above closes against the same gate. Nothing here is new — it is the bar Sprints 2.1 through 6 already held themselves to, restated so this plan is self-contained:

1. `tsc --noEmit` clean. **Do not reinstate `ignoreBuildErrors`** (§15.6).
2. `pnpm build` clean **with `SUPABASE_SERVICE_ROLE_KEY` blanked** — now a permanent part of the bar, so the §21 regression cannot recur:
   ```
   $env:SUPABASE_SERVICE_ROLE_KEY = ""; pnpm run build
   ```
3. **Leak test** (`scripts/leak-test.mjs`) — 12/12 listings, zero gated column keys or values in guest HTML. This is a blocking security gate: nothing after it is trustworthy if it fails.
4. **Access matrix** — 49 assertions across 7 viewer states.
5. Route sweep, 24 routes, against the **production** build, not just `next dev`.
6. Test users and rows created during verification are **deleted afterwards**.
7. `MEMORY.md`, `SPRINT_CALENDAR.md` and `project_calendar.html` updated in the same commit (the mandatory rule in `CLAUDE.md`).

---

## 11. Summary

| Sprint | Blocked? | Effort | Value |
|---|---|---|---|
| **15** — Critical UX & Auth Repair | No | 2 days | Fixes invisible errors, an unreachable login, and an empty search page |
| **15.5** — Environment & Deploy Hardening | Dashboard access | ~1 hour | Confirms production actually works; closes 2-week-old security debt |
| **16** — Account Self-Service | No | 3 days | Change password, delete account, real alert management |
| **16.5** — Email & Compliance | Resend + client | 2 days | Guest unsubscribe; closes the PAN/Aadhaar gap |
| **17** — Partner scope resolution | Client decision | 1 hour (A) / Sprint 10 (B) | Resolves a launch-scope contradiction; Branch A frees a full sprint |

**Start Sprint 15 immediately.** It is unblocked, it is two days, and it fixes the three things that make the product look broken to anyone who opens it.
