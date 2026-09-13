# Handoff: Boliwala user-facing visual refresh

## Overview

A visual refresh of the Boliwala user-facing UI — the "Marketplace" direction, approved from three
explored options. Boliwala is an Indian platform for bank-auction (SARFAESI) property listings; the
audience is property buyers and investors looking for verified deals, so the UI must read as
trustworthy and credible rather than flashy.

The refresh keeps the product identical and changes only how it looks: layout, typography, colour
palette, spacing and component styling. Information architecture, filters, form fields, functionality
and copy are unchanged.

**Screens in this pass:** homepage, browse/search, property detail, user dashboard.
**Explicitly out of scope:** the admin/internal side, and (for this pass) signup/login, services,
partner, about, contact, FAQ, pricing and legal pages.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes showing the intended
look and behaviour. They are **not production code to copy directly**. The task is to recreate these
designs in the target codebase's existing environment (Next.js App Router, React, Tailwind CSS v4,
the `components/ui` primitives) using its established patterns and libraries.

Do not lift the prototypes' inline styles. Map every value onto the token layer described below.

| File | What it is |
| --- | --- |
| `Option 2 - Marketplace.dc.html` | **The approved design.** Top bar switches Home / Search / Listing / Dashboard, plus Mobile and Dark toggles. |
| `Boliwala Current.dc.html` | Faithful recreation of the CURRENT UI, for before/after comparison. |
| `boliwala-tokens.css` | Token values as CSS custom properties, light + `.dark`. Authoritative. |
| `boliwala-tokens.json` | The same values as data. |
| `boliwala-mark.svg` | Logo mark alone (gradient tile + gavel). |
| `boliwala-lockup.svg` | Full lockup: mark + wordmark + tagline. |
| `Boliwala Brand Sheet.dc.html` | Printable one-document summary of the whole system. |
| `MASTER_PROMPT.md` | The prompt to drive the implementation. |

## Fidelity

**High-fidelity.** Final colours, typography, spacing and interactions. Recreate the UI
pixel-accurately using the codebase's existing libraries and patterns.

---

## Design tokens

Semantic names only. No raw hex in component code — that is what lets the dark theme swap cleanly.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--paper` | `#FFFFFF` | `#1C1917` | Card and panel surfaces |
| `--surface` | `#FBF7F1` | `#141110` | Page background, inset field fills |
| `--ink` | `#22201D` | `#F3EDE5` | Primary text |
| `--ink2` | `#6E675E` | `#A89E92` | Secondary text, labels, meta |
| `--line` | `#E7DFD3` | `#332C26` | Borders, dividers, rules |
| `--brand` | `#A8442A` | `#E08B6D` | Primary action, prices, active filters |
| `--brandSoft` | `#FBEFE9` | `#2B1D17` | Active chips, deadline block |
| `--gold` | `#9A6F2A` | `#D8A860` | Process tags, in-progress states |
| `--goldSoft` | `#FAF2E2` | `#2A2113` | Tag and step backgrounds |
| `--pos` | `#2F6B4F` | `#6FBF95` | Physical possession, verified, success |
| `--posSoft` | `#E9F2EC` | `#16251D` | Possession panel, completed steps |
| `--slot` | `#EFE7DB` | `#262019` | Photo placeholder fill |
| `--onBrand` | `#FFFFFF` | `#22201D` | Text and icons on a brand fill |
| `--danger` | `#B3261E` | `#F2857C` | Destructive text and icons |
| `--dangerLine` | `rgba(179,38,30,0.35)` | `rgba(242,133,124,0.4)` | Destructive container borders |

Brand constants, identical in both themes: logo tile gradient `#FFC981` → `#D97706`
(to bottom right), gavel stroke `#3E2400`, wordmark accent `#D97706` on light / `#FFC981` on dark.

**Two rules that are easy to get wrong:**
1. Text on a brand fill uses `--onBrand`, never a hardcoded `#fff`. In dark, `--brand` is a light
   salmon and white type on it measures 2.6:1 — a contrast failure.
2. Destructive text and borders use `--danger`/`--dangerLine`, never a hardcoded red. A hardcoded
   `#B3261E` on the dark `--paper` measures 2.6:1.

### Typography

- **Display — Source Serif 4** (Google Fonts, weights 400–700). Headlines, prices, key figures, panel headings.
- **UI — Figtree** (Google Fonts, weights 400–800). Everything else: body, labels, chips, buttons, tables.

| Role | Family | Size | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Hero headline | Display | 50px | 600 | -0.025em |
| Page title | Display | 40px | 600 | -0.03em |
| Section heading | Display | 32px | 600 | -0.02em |
| Panel heading | Display | 26px | 600 | -0.02em |
| Price, large | Display | 28px | 600 | -0.02em |
| Price, card | Display | 26–27px | 600 | -0.02em |
| Key figure | Display | 23px | 600 | -0.02em |
| Card title | UI | 15.5px | 600 | — |
| Body | UI | 14.5px / 1.6 | 400 | — |
| Meta, secondary | UI | 13.5px | 400 | — |
| Field label | UI | 11px | 800 | 0.1em, uppercase |
| Chip, badge | UI | 10.5px | 700 | 0.06em, uppercase |
| Eyebrow | UI | 11px | 700 | 0.14em, uppercase |

All figures — price, EMD, area, dates, credit balances — use `font-variant-numeric: tabular-nums`
so digits align down a column of cards. Body copy sets `text-wrap: pretty`, headlines `balance`.

### Radii, elevation, spacing

| Role | Value | Applied to |
| --- | --- | --- |
| Pill | `999px` | Buttons, chips, filter pills, pagination |
| Panel | `20px` | Page panels, dashboard cards |
| Card | `18px` | Listing cards, alert rows, hero |
| Block | `16px` | Inner blocks inside a panel |
| Field | `12px` | Inputs, selects, deadline block |

| Shadow | Value |
| --- | --- |
| Card | `0 10px 26px -22px rgba(34,32,29,0.5)` |
| Panel | `0 12px 30px -26px rgba(34,32,29,0.45)` |
| Sticky panel | `0 18px 40px -30px rgba(34,32,29,0.55)` |

Content max width `1240px`. Page gutter `20px`. Section gap `24px`. Card grid
`repeat(auto-fill, minmax(280px, 1fr))` with `18px` gap. Control heights 48 / 46 / 38 / 36px;
minimum tap target 44px.

---

## Screens

### Shell — header and footer
`components/header.tsx`, `components/footer.tsx`

**Header.** Solid `--paper`, `1px` bottom border in `--line`, `min-height: 72px`, content capped
at 1240px with 20px gutters, `flex-wrap`. Left: logo lockup — 38px gradient tile at `12px` radius
with a `0 6px 14px -6px rgba(217,119,6,0.6)` glow, wordmark in Source Serif 4 23px/700 with "wala"
in `#D97706`, tagline below at 8.5px/700, 0.2em tracking, uppercase, `--ink2`. Centre: nav at
14.5px/500, 26px gap, active item `--ink` 600, rest `--ink2`. Right: "Log In" as a bare pill
(14px/600, `--ink`, 10px 16px) and "Sign Up" as a filled pill (`--brand` background,
`--onBrand` text, 10px 20px).

Below the desktop breakpoint the nav and Log In collapse into a 44×44 hamburger button
(`1px --line` border, pill radius) sitting left of Sign Up.

**Important:** the current header is transparent and overlays a 200vh parallax hero, and pages
compensate with `pt-24 md:pt-28`. The new header does not overlay. Remove that padding
compensation when you convert it.

**Footer.** `--paper` with a `1px --line` top border, 44px top padding. Four-column
`repeat(auto-fit, minmax(200px, 1fr))` grid, brand column spanning 2. Column headings at
10.5px/700, 0.12em tracking, uppercase, `--ink2`; links 14px in `--ink2`. Bottom bar separated by
a `1px --line` rule, 13px, space-between, wrapping.

### Homepage
`app/page.tsx` → `hero.tsx`, `search-section.tsx`, `trust-banner.tsx`, `philosophy.tsx`,
`alerts-section.tsx`, `call-to-action.tsx`, `auctions-by-city.tsx`

**Hero.** Replaces the 200vh sticky parallax entirely. A `22px`-radius full-bleed block,
`min-height: 440px`, inside the 1240px container with 20px gutters. Background is a labelled photo
slot (see *Photo placeholders*). Content sits bottom-left over a
`linear-gradient(to top, rgba(24,20,16,0.88), rgba(24,20,16,0.55) 55%, transparent)` scrim, capped
at 640px: a glass pill badge ("IN" chip + "India's bank auction property platform" at 11.5px/600,
0.1em caps), the headline in Source Serif 4 50px/600 white with "30–40% below market" in `#FFC981`,
and the existing sub-paragraph at 16.5px/1.55 in `rgba(255,255,255,0.85)`.

**Search card.** Overlaps the hero by `-34px` with `z-index: 5`, inset 20px from the hero edges.
`--paper`, `18px` radius, `1px --line`, panel shadow, 16px padding. A wrapping flex row of four
items: Location (`flex: 2 1 190px`), Lender select, Reserve price min/max pair, and a filled
`--brand` submit button — all 46px tall, inputs at `12px` radius on `--surface`. Field labels
above each at 11px/700, 0.08em caps, `--ink2`. Below the card, a wrapping row of quick-filter
pills: `--paper`, `1px --line`, 8px 14px, 13px/600.

**Stat strip.** Four cards, `repeat(auto-fit, minmax(190px, 1fr))`, 14px gap. Each `--paper`,
`16px` radius, `1px --line`, 18px 20px padding: value in Source Serif 4 32px/600 tabular, label
below at 12px/600, 0.1em caps, `--ink2`.

**Live auctions.** Eyebrow ("Closing soonest", `--brand`), Source Serif 4 32px heading, and a
"View all 12,400 →" link right-aligned. Then the listing-card grid, three cards.

**Trust banner.** One `--paper` panel, `22px` radius, 30px padding, holding a
`repeat(auto-fit, minmax(210px, 1fr))` grid of four items. Each: a 36px `--goldSoft` tile at
`12px` radius with its index in `--gold` 13px/800, then title 15.5px/700 and description 13.5px
in `--ink2`.

**Process.** Two columns, `repeat(auto-fit, minmax(300px, 1fr))`, 44px gap. Left: eyebrow, Source
Serif 4 40px/600 heading, paragraph, and a 4:3 photo slot at `18px` radius. Right: five stacked
`--paper` cards at `16px` radius, each with the step number in Source Serif 4 18px `--brand`, the
title at 17px/700, a `--goldSoft`/`--gold` pill tag, and the description at 14px/1.6.

**Alerts.** Full-width `--ink` block at `24px` radius, 44px 32px padding, two columns. Left:
eyebrow in `#FFC981`, Source Serif 4 36px/600 white heading, paragraph, three bullets with
`#FFC981` markers. Right: a `rgba(255,255,255,0.07)` card at `18px` radius with the email and
WhatsApp fields (46px, `12px` radius, translucent) and a `#FFC981`-on-`#3E2400` submit button.

### Browse / search
`app/search/page.tsx` → `search-section.tsx`, `property-results.tsx`, `property-grid.tsx`

`app/listing/page.tsx` redirects to `/search`, so this single page is both "Properties" and
"Search". It renders the full filter panel above the results.

**Filter panel** (from `search-section.tsx`, currently above the results). `--paper`, `20px`
radius, `1px --line`, panel shadow, 24px padding. Heading "Find Your Ideal Property" in Source
Serif 4 26px/600. Then, in order — all existing fields, unchanged:
1. `minmax(220px, 1fr)` grid: **Location** ("Enter City, Area, or Locality") and **Keyword**
   ("Building name, Road, or Street").
2. `minmax(220px, 1fr)` grid: **Price Range (₹)** as a Min/Max pair, and **Lender Name** select
   ("All Lenders").
3. **Property Type** — a `--surface` block at `16px` radius holding a
   `minmax(200px, 1fr)` grid of six radio cards: All Types / Browse everything · Residential /
   Flats, Villas, Bungalows · Commercial / Offices, Shops · Industrial / Factories, Warehouses ·
   Agricultural / Farms, Plots, Land · Mixed Use / Multi-purpose. Each card is 13px 14px at `12px`
   radius; unselected is `--paper` + `1px --line`, selected is `--brandSoft` + `1px --brand`. The
   radio is a 16px circle: unselected `1.5px --line`, selected `5px solid --brand` with
   `inset 0 0 0 2px --paper`.
4. **Possession Type** — a `--posSoft` block at `16px` radius with a `1px rgba(47,107,79,0.22)`
   border, label in `--pos`, and three pill radios (All Possession / Physical / Symbolic) using the
   same radio treatment in `--pos`.
5. Actions: filled `--brand` "Search Auctions" (`flex: 1 1 220px`, 48px) and outlined
   "Reset Filters" (`flex: 0 1 180px`).

**Active filter row.** Eyebrow "Filters", then removable chips — `--brandSoft` background,
`--brand` text, 13px/600, 6px 13px, pill, with a 0.55-opacity ✕ — then a "Clear all" link in
`--ink2`.

**Sidebar.** `flex: 1 1 250px; max-width: 290px; min-width: 250px`. `--paper`, `18px` radius,
`1px --line`. Header row "Refine filters" 14.5px/700 + "Clear all". Then one section per filter
group, each separated by a `1px --line` rule: group label at 10.5px/700, 0.1em caps, `--ink2`,
then rows of a 16px `5px`-radius checkbox + 14px label + right-aligned tabular count in `--ink2`.
Labels wrap (`align-items: flex-start`, checkbox `margin-top: 2px`) — do not truncate them. Last
section is the Reserve price Min/Max pair plus a 40px `--ink` Apply button.

**Results column.** `flex: 999 1 380px; min-width: 0`. Header row: count line
("**248** properties · Mumbai · Residential", bold in `--ink`) and the sort select (38px,
`10px` radius). Then the card grid. Pagination is a centred row of pill cells, 36px min-width,
active is `--brand` fill with `--onBrand` text.

### Listing card
`components/property-grid.tsx` — the single most repeated component in the product.

`--paper`, `18px` radius, `1px --line`, card shadow, `display: flex; flex-direction: column`,
`overflow: hidden`.

1. **Media**, `aspect-ratio: 16/10`, a photo slot. Four overlays: lender short code top-left
   (10.5px/800, 0.06em caps, `--onBrand`-white on `rgba(24,20,16,0.78)` with `blur(6px)`,
   pill); property type top-right (10.5px/700, `--ink` on `rgba(255,255,255,0.94)`, pill);
   possession bottom-left — **physical** is white on `rgba(47,107,79,0.9)`, **symbolic** is
   `--ink` on `rgba(255,255,255,0.92)`.
2. **Body**, 16px 18px. Price in Source Serif 4 27px/600 tabular; then
   "Reserve price · {perSqft} · {area} sq.ft" at 12px in `--ink2`; then the title at 15.5px/600,
   1.35 line-height; then "{locality}, {city} · {state}" at 13.5px in `--ink2`.
3. **Figure pair**, a 2-column grid divided by `1px --line`, each cell 12px 18px: label at
   10px/700, 0.1em caps, `--ink2`; value at 14px/700 tabular. Left cell is **Auction** date with
   days-left beneath in `--brand` 11.5px/600; right cell is **EMD** with the lender name beneath.
4. **Actions**, 12px 18px above a `1px --line` rule: "Save" (`--surface`, `1px --line`) and
   "View" (`--brand` fill, `--onBrand` text), both 38px pills, `flex: 1`.

All six dense fields the brief calls out — price, location, lender, property type, possession
type, auction date — are present and each has its own labelled position. Do not merge them.

### Property detail
`app/listing/[slug]/page.tsx` → `components/listing-view.tsx`

**Breadcrumb.** 13px, `--ink2`, `/` separators at 0.4 opacity, current page `--ink` 600.

**Gallery.** `repeat(auto-fit, minmax(240px, 1fr))` grid, 10px gap. A main 16:9 slot spanning 2
columns ("Main property photograph"), and a stacked pair beside it ("Interior", "Sale notice scan"),
all at `18px` radius.

**Chip row.** "✓ Verified against bank notice" (`--pos` on `--posSoft`), the property type
(`--ink2` on `--paper` with `1px --line`), and possession (`--pos` on `--posSoft`) — 11.5px/700,
6px 13px pills, `white-space: nowrap`.

**Title block.** H1 in Source Serif 4 38px/600, `-0.025em`, 1.12; full address beneath at 15px in
`--ink2`.

**Key figures.** `repeat(auto-fit, minmax(150px, 1fr))`, 12px gap. Four `--paper` cards at `16px`
radius, 16px 18px: label 10px/700 0.1em caps `--ink2`, value Source Serif 4 23px/600 tabular, note
12px `--ink2`. The four are Reserve price (₹5,000/sq.ft), EMD (10% · due 22 Sep), Bid increment
(Per bid), Outstanding dues (As per notice).

**Detail tables.** Three `--paper` panels at `18px` radius, `1px --line`. Each has a header row
(`1px --line` bottom) with the title in Source Serif 4 19px/600 and the source reference at 11.5px
in `--ink2`, then a full-width table: key cell 14px `--ink2` at 42% width, value cell 14px/600
`--ink` tabular, rows divided by `1px --line`. The three panels and every row they contain are
unchanged from today: **Property details**, **Auction information**, **Legal status**.

**Disclaimer.** `--goldSoft` block at `16px` radius with `1px rgba(154,111,42,0.28)`, an
"Important" heading at 11.5px/800 0.1em caps in `--gold`, and the existing "As is where is" text
verbatim at 14px/1.65.

**Bid panel.** `flex: 1 1 300px; max-width: 360px; min-width: 280px`, `position: sticky; top: 60px`.
`--paper`, `20px` radius, sticky shadow. Sections top to bottom: reserve price (label + Source
Serif 4 36px/600 tabular + per-sq.ft line); a `--brandSoft` deadline block at `14px` radius
("Auction closes in 12 days" at 10.5px/800 caps in `--brand`, then date/time 15.5px/700, then mode
and EMD deadline); four stacked actions — filled `--brand` "Hire Boliwala to bid" (48px) then three
`--surface` outlined pills (44px) for WhatsApp, callback and notice PDF; and a `--surface` package
block with the ₹25,000 + 2% pricing, the "Charged only if you win" `--pos` pill, four ticked
inclusions, and an `--ink` "Get started" button.

### Dashboard
`app/profile/` → `components/profile-view.tsx`, `components/account-header.tsx`

**Page header.** `--paper` band with a `1px --line` bottom border, 36px 20px padding. Eyebrow
"My account", then "Welcome back, {firstName}!" in Source Serif 4 40px/600 with the name in
`--brand`. Right: a filled `--brand` "Browse auctions" pill.

**Sidebar.** `flex: 1 1 260px; max-width: 300px; min-width: 260px`. `--paper`, `20px` radius,
card shadow. Top: 48px circular `--brand` avatar with the initial in `--onBrand` Source Serif 4
21px, then name 15.5px/700 and email 12.5px `--ink2`, both truncating. Then a credits row (label
11px/700 caps left, balance in Source Serif 4 22px `--brand` right), then the member-since line at
12.5px. Then the four nav buttons: full width, 13px 16px, `14px` radius, 14px/600 — active is
`--brandSoft` background with `--brand` text, inactive transparent with `--ink`. Footer: a
"Log Out" button in `--danger`.

**Tab 1 — Saved Properties.** Heading + subtitle + "Browse More →" link, then the listing-card grid
(`minmax(280px, 1fr)`). Card is the standard listing card with two changes: the auction date moves
to the top-right overlay in `--brand`, and the footer is an EMD line plus a "View" button and a
36px circular bookmark button (`--brandSoft`, `--brand` icon) for un-saving.

**Tab 2 — My Alerts.** Heading + subtitle + a filled "+ Create from a search" pill. Then one row
per alert: `--paper`, `18px` radius, `1px --line`, 20px padding, space-between, wrapping. Left is
a 40px circular `--goldSoft` bell tile, the criteria title at 16px/700, the frequency and created
date at 13.5px `--ink2`, and criteria chips (10px/700 0.08em caps on `--surface`). Right is the
frequency select (36px pill: Instant / Daily digest / Weekly), a "View matches" outlined pill, a
Pause/Resume pill (`--gold` when active, `--pos` when paused), and a 36px circular delete button
in `--danger`. A paused alert renders the whole row at `opacity: 0.62`.

**Tab 3 — Service Requests.** Heading + subtitle, then one `--paper` panel at `20px` radius, 26px
padding. Header: package name and property at 18px/700, "Purchased … • ₹… paid (Razorpay)" at
13.5px `--ink2`, and a status pill (`--gold` on `--goldSoft`). Then the four-stage tracker — a
wrapping flex of four `flex: 1 1 130px` cells divided by `1px --line` inside a `16px`-radius
container: **Due Diligence**, **Bid Mgmt**, **Possession**, **Loan**. A completed stage is
`--posSoft`/`--pos` with a filled 22px dot, the current stage is `--goldSoft`/`--gold` with a
filled dot, pending stages are `--paper` with a `2px dashed --ink2` hollow dot. Label 11.5px/800
0.08em caps, status 12.5px `--ink2`. Then the actions: a `#25D366` "WhatsApp Team" pill and an
outlined "View Due Diligence Report" pill, both 44px.

**Tab 4 — Account Info.** Three stacked `--paper` panels at `20px` radius, 26px padding.
1. **Details** — a `minmax(220px, 1fr)` grid of Full Name, Email Address (disabled, with the
   "Contact support to change email." hint), Phone Number, City; all 48px inputs at `12px` radius
   on `--surface`. Then a `1px --line` rule and the **KYC Details (Optional)** sub-section with
   its existing subtitle, PAN Number (10 chars, uppercase) and Aadhaar Number (numeric), and the
   existing "Both are optional…" note. Right-aligned filled "Save Changes".
2. **Change password** — Source Serif 4 20px heading, its subtitle, Current and New password fields,
   right-aligned filled button.
3. **Delete account** — `1px --dangerLine` border, Source Serif 4 20px heading in `--danger`, the
   existing explanatory paragraph, the "This cannot be undone…" warning in `--danger` 700, then a
   "Type DELETE to confirm" field and a `#B3261E` "Delete my account" button, disabled until the
   confirmation matches.

---

## Photo placeholders

Listings have no photography yet, but the design anticipates it. Every image position ships as a
labelled slot: `--slot` background with
`repeating-linear-gradient(115deg, transparent, transparent 11px, rgba(34,32,29,0.05) 11px, rgba(34,32,29,0.05) 22px)`,
centred caption at 10px/600, 0.1em caps, `--ink2` on a `--paper` pill, naming the shot required
("Property photo", "Main property photograph", "Interior", "Sale notice scan", "Team / handover photo").

Build these as one reusable component with a `label` prop and an aspect-ratio prop. Layouts already
reserve the correct ratio, so real images drop in later without a relayout. When photography
arrives, the component swaps to an `<Image>` and nothing else moves.

## Interactions and behaviour

Unchanged from the current product — this is a visual pass. Preserve every existing handler, route,
server action and validation rule. Specifically keep working: filter submit and reset, filter chip
removal, sort, pagination, save/un-save, alert create/pause/delete/frequency, the profile tab
switch, form submits, password change, and the DELETE-confirmation gate on account deletion.

- **Hover** on interactive surfaces: a subtle lift on cards (shadow one step stronger) and a
  `--surface` fill on outlined pills. Nothing moves position.
- **Focus** is visible on every control — a 2px `--brand` ring; do not remove outlines.
- **Transitions** are short and property-scoped: 150–200ms ease on background, border and shadow
  only. No layout or transform animation.
- **Responsive:** single column below ~768px. The search sidebar stacks above the results; the
  sticky bid panel unsticks and follows the content; the dashboard sidebar becomes a full-width
  block above the tab content; the header nav becomes a hamburger.

## State management

No new state. The only additions the visual layer needs are presentational: the mobile nav
open/closed flag in the header, and whatever the existing theme provider already uses for
light/dark. Everything else — filters in the URL, the profile tab, saved and alert data — stays
exactly as it is today.

## Assets

- `boliwala-mark.svg`, `boliwala-lockup.svg` — regenerated from the existing logo; the tile
  gradient and gavel path are unchanged from `components/logo.tsx`. The lockup references Figtree
  and Source Serif 4 by name rather than embedding outlines, so it needs those fonts to render.
- **No new photography.** The prototypes use labelled placeholder slots, not images. The three
  `public/images/*.webp` files the current parallax hero uses (`hously-background`,
  `hously-foreground`, `exterior`) become unused once the hero is replaced — leave them in place
  and flag them for removal rather than deleting them.
- **Icons:** keep `lucide-react`, already a dependency.
- **Fonts:** Figtree and Source Serif 4 via `next/font/google`. This replaces `Plus_Jakarta_Sans`.

## Files

Design references in this bundle:
- `Option 2 - Marketplace.dc.html` — the approved design, all four screens
- `Boliwala Current.dc.html` — the current UI, for comparison
- `Boliwala Brand Sheet.dc.html` — printable system summary
- `boliwala-tokens.css`, `boliwala-tokens.json`, `boliwala-mark.svg`, `boliwala-lockup.svg`

Repository files to change:

| Area | Files |
| --- | --- |
| Foundations | `app/globals.css`, `app/layout.tsx`, `components/logo.tsx` |
| Shell | `components/header.tsx`, `components/footer.tsx` |
| Homepage | `app/page.tsx`, `components/hero.tsx`, `trust-banner.tsx`, `philosophy.tsx`, `alerts-section.tsx`, `call-to-action.tsx`, `auctions-by-city.tsx` |
| Browse / search | `app/search/page.tsx`, `components/search-section.tsx`, `property-results.tsx`, `property-grid.tsx`, `search-sort-select.tsx`, `search-alert-banner.tsx` |
| Property detail | `app/listing/[slug]/page.tsx`, `components/listing-view.tsx` |
| Dashboard | `app/profile/`, `components/profile-view.tsx`, `components/account-header.tsx` |
| Log | `MEMORY.md` (per the repo's `CLAUDE.md` rule) |

Do **not** change: `app/admin/**`, `components/admin/**`, `components/admin-view.tsx`,
`components/partner-dashboard-view.tsx`, any file under `lib/`, or `app/actions/`.
