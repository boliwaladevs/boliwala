# Master prompt — Boliwala visual refresh

Paste everything below into Claude Code, from the repository root of the Boliwala Next.js app,
with this folder available (unzipped) alongside it.

---

You are implementing an approved visual refresh of the Boliwala user-facing UI.

## Ground truth

Read these before writing any code:

- `design_handoff_visual_refresh/README.md` — the full specification: tokens, type scale, per-screen layout, component specs, behaviour.
- `design_handoff_visual_refresh/Option 2 - Marketplace.dc.html` — the approved design prototype. Open it in a browser. It has a top bar with **Home / Search / Listing / Dashboard** plus **Mobile** and **Dark** toggles. This is the visual target for all four screens, in both themes, at both widths.
- `design_handoff_visual_refresh/Boliwala Current.dc.html` — a faithful recreation of the CURRENT UI, for before/after comparison.
- `design_handoff_visual_refresh/boliwala-tokens.css` and `boliwala-tokens.json` — the token values, authoritative.
- `CLAUDE.md` in the repo root — follow its update rule: **`MEMORY.md` is the only file that gets updated** with a log of your changes.

The HTML files are **design references, not production code**. Do not copy their markup or inline styles. Recreate the designs in this repo's existing environment — Next.js App Router, React, Tailwind CSS v4, the `components/ui` primitives — using its established patterns.

This is a **high-fidelity** handoff. Match the colours, type, spacing, radii and shadows exactly as specified.

## Hard constraints

1. **Visual layer only.** Do not change information architecture, routes, filters, form fields, validation, server actions, data fetching, or copy. Every field, filter option, label and string that exists today must still exist, with the same text. If a redesign seems to call for different copy, leave the copy and flag it in your summary instead.
2. **Do not touch the admin/internal side.** `app/admin/**`, `components/admin/**`, `components/admin-view.tsx` and `components/partner-dashboard-view.tsx` are out of scope. Leave them working and visually as-is.
3. **Keep the brand.** The Boliwala name, the gavel-in-gradient-tile logo mark, and the tagline "We Know Auctions!" stay. `components/logo.tsx` keeps its gradient tile (#FFC981 → #D97706) and `#3E2400` gavel; only the wordmark typeface and tagline colour change per spec.
4. **Scope of screens in this pass** — these four only:
   - Homepage — `app/page.tsx` and its sections
   - Browse / search — `app/search/page.tsx` (note `app/listing/page.tsx` redirects here, so this is also "Properties")
   - Property detail — `app/listing/[slug]/page.tsx`
   - User dashboard — `app/profile/` via `components/profile-view.tsx`
   Signup/login, services, partner, about, contact, FAQ, pricing and legal pages are **not** in this pass. They will inherit the new tokens from `globals.css` automatically; make sure they still render without breaking, but do not redesign them.
5. **Responsive, mobile-first.** Most traffic is phones. Every screen must reflow to one column with no horizontal scroll at 360px. No fixed widths; use `max-width`, wrapping flex/grid tracks, and `minmax(0, 1fr)`. No tap target under 44px.
6. **Both themes.** Light and dark are both designed. A `.dark` variant already exists in `app/globals.css` and `components/theme-provider.tsx` is present — wire up or keep whatever toggle exists, but every new surface must be correct in both.
7. **Accessibility.** Body text holds 4.5:1 against its background in both themes; headline-scale type holds 3:1. Two specific traps, already solved in the spec — honour them:
   - Text on a brand fill must use `--onBrand`, never a hardcoded `#fff`. The dark theme's brand is a light salmon (#E08B6D) and cannot carry white type.
   - Destructive text and borders must use `--danger`/`--dangerLine`, never a hardcoded red, for the same reason.

## Order of work

Do this in stages and stop for review after each one.

**Stage 1 — Foundations.**
- Replace the colour layer in `app/globals.css` with the tokens from `boliwala-tokens.css`, mapped onto the Tailwind v4 theme variables already in that file. Keep the existing variable NAMES that components consume (`--background`, `--foreground`, `--card`, `--primary`, `--border`, `--muted`, etc.) and change their VALUES, so you are not rewriting every className in the repo. Add the new semantic tokens (`--brand`, `--brand-soft`, `--on-brand`, `--gold`, `--gold-soft`, `--pos`, `--pos-soft`, `--slot`, `--danger`, `--danger-line`) alongside them, with `.dark` overrides.
- Swap the fonts in `app/layout.tsx`: **Figtree** for UI/body, **Source Serif 4** for display. Both from `next/font/google`. Replace `Plus_Jakarta_Sans`; keep `Geist_Mono` only if something still uses it, otherwise remove it.
- Update `components/logo.tsx` to the spec.
- Report back with a screenshot of any one page before continuing.

**Stage 2 — Shell.** `components/header.tsx` and `components/footer.tsx`. The header becomes a solid `--paper` bar with a bottom hairline, 72px min-height, pill Log In / Sign Up, and a hamburger under the desktop breakpoint. It must no longer overlay the hero (the current build uses a transparent header over a 200vh parallax hero and `pt-24 md:pt-28` compensation on pages — remove that compensation when the header stops overlaying).

**Stage 3 — Homepage.** `hero.tsx`, `search-section.tsx`, `trust-banner.tsx`, `philosophy.tsx`, `alerts-section.tsx`, `call-to-action.tsx`, `auctions-by-city.tsx`. The parallax hero is replaced by a rounded full-bleed hero with a labelled photo slot and an overlapping search card. See README § Homepage.

**Stage 4 — Browse / search.** `search-section.tsx` (the filter panel at the top of `/search`), `property-results.tsx` (sidebar filters, result count, sort, pagination) and `property-grid.tsx` (the card). The card is the most important component in the product — get it exactly right. See README § Browse and § Listing card.

**Stage 5 — Property detail.** `listing-view.tsx`. Gallery slots, chip row, the four key-figure tiles, the three detail tables, and the sticky bid panel. See README § Property detail.

**Stage 6 — Dashboard.** `components/profile-view.tsx` and `components/account-header.tsx`. Sidebar plus four tabs: Saved Properties, My Alerts, Service Requests, Account Info. Every existing control stays — alert frequency select, pause/resume, delete, the four-stage service tracker, KYC fields with their PAN/Aadhaar helper text, change password, delete account with its DELETE confirmation. See README § Dashboard.

**Stage 7 — Sweep.** Check the out-of-scope pages still render. Check 360px, 768px and 1280px. Check light and dark. Run the repo's lint and build. Update `MEMORY.md`.

## What "done" looks like

- Side by side with `Option 2 - Marketplace.dc.html`, each of the four screens matches in colour, type, spacing, radius and shadow.
- No horizontal scroll at 360px on any screen, in either theme.
- No hardcoded hex values in the components you touched — everything reads a token.
- `npm run build` (or the repo's equivalent) passes.
- Every filter, field and string that existed before still exists.

Ask me before adding any section, page or copy that is not in the spec.
