# UI Replication Gap Analysis — vs. boliwala.netlify.app

**Purpose:** list every visual/animation gap between the live prototype
(`boliwala.netlify.app`) and the current build (`project/`), so you can pick
which ones to greenlight. **Nothing in this doc has been executed.** On your
go-ahead next session, work through the priorities in §6 top to bottom.

**Method:** `boliwala.netlify.app` was spot-checked with WebFetch and its
content (hero copy, stats "12,400+ / 140+ / 18+", section order) matches the
local `demo/` mirror exactly, so `demo/`'s compiled HTML/CSS/JS was used as
the ground truth — it's more reliable than a markdown-converted fetch for
finding animation classes, since WebFetch strips styling. Findings below cite
the exact Tailwind classes/keyframes found in `demo/index.html`,
`demo/search.html`, and `demo/_next/static/chunks/*.css` alongside the
current React source that would need to change.

**Scope note:** no `demo/*.html` exists for a single listing page, and
`about.html` / `services.html` / `partner.html` map to routes that are still
Sprint-4 placeholders in `project/`. This doc covers what's *built* today:
Header, Footer, Logo, Homepage, and (by inheritance) the Search/Properties
page. Rebuilding About/Services/Channel Partner is tracked separately in
`plans/boliwala-phase1-sprint-plan.md` — see §5 for how this work should feed
into that sprint instead of duplicating it.

---

## 1. Logo — biggest branding gap

**Prototype** (`demo/index.html`, appears in header + footer): a 38×38px
rounded-xl box with an amber gradient (`from-[#FFC981] to-[#D97706]`) and
drop shadow, containing a custom stroke-icon (looks like a stylised
check/swipe mark, not a lucide stock icon — 5 `<path>`s). On hover of the
logo group, the icon scales to 110% and rotates -6°
(`transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`).

**Current** (`src/components/site/Logo.tsx`): a plain solid-color square with
the letter "B". No icon, no gradient, no hover animation.

**Blocked:** `MEMORY.md` §9 already flags "brand assets (logo SVG, favicon,
OG image)" as an open question for the client. Two ways to proceed:
- Recreate the exact SVG path data captured from the prototype's compiled JS
  (I have it) — gets pixel parity but isn't necessarily the *real* brand mark.
- Wait for the client's actual logo file.

**Recommendation:** ask the user which path before touching this one.

---

## 2. Header

**Prototype:** `fixed` (not `sticky`) and starts **transparent, white text,
over the hero** (`bg-transparent`, `py-4`, `text-white` nav links), then
morphs to a solid/rounded bar on scroll (`transition-all duration-500` on
the header; scroll-position state confirmed in 6 of the compiled JS chunks).
Nav links have an animated underline sweep on hover — a `after:` pseudo
element that grows from `w-0` to `w-full`:
```
hover:text-[rgb(251,146,60)] transition-colors duration-300 relative
after:absolute after:bottom-0 after:left-0 after:h-px after:w-0
hover:after:w-full after:bg-[rgb(251,146,60)] after:transition-all after:duration-300
```

**Current** (`src/components/site/Header.tsx`): always `sticky top-0`,
always solid `bg-background/85 backdrop-blur`. Nav links get a background
pill on hover (`hover:bg-secondary`), no underline sweep, no
transparent-over-hero state.

**Fix outline:**
- Small `useScrolled(threshold)` client hook toggling header classes between
  the transparent-over-hero state and the current solid state.
- Swap nav link hover from background-pill to the `after:` underline sweep
  (pure CSS, no JS).
- Note: our Hero is already dark/full-bleed, so a transparent header over it
  is visually compatible — this isn't blocked on anything.

---

## 3. Mobile nav — different pattern, not necessarily wrong

**Prototype:** an inline panel directly under the header that slides open
via a height/opacity transition:
`overflow-hidden transition-all duration-300 ease-in-out max-h-0 opacity-0`
→ expanded state removes `max-h-0 opacity-0`.

**Current** (`src/components/site/MobileNav.tsx`): a right-side drawer with
a backdrop overlay, close-on-Escape, scroll-lock. This is a different but
arguably *better* pattern (works better for longer nav lists, has focus
trapping groundwork).

**Recommendation:** flag only — don't change unless you want strict parity.
Current implementation is functionally solid.

---

## 4. Homepage — "Our Process" section (largest structural gap)

**Prototype** (`demo/index.html`, `id="about"`): two-column layout, **not**
a card grid.
- Left column is `lg:sticky lg:top-32` — stays pinned while the right
  column scrolls past it. Contains the eyebrow ("Our Process"), a large
  serif-scale heading (`text-5xl md:text-6xl lg:text-7xl`) reading "You
  Browse. We Handle **Everything.**" where "Everything." has a hand-drawn
  underline SVG that draws itself in:
  ```html
  <path d="M0 8 Q50 2, 100 6 T200 8" stroke-dasharray="200" stroke-dashoffset="200"
        style="transition: stroke-dashoffset 0.8s ease-out">
  ```
  and the architecture sketch image below it.
- Right column is a **vertical numbered list** (not icon cards): "01",
  "02" … in large muted type, each row scroll-revealed —
  `transition-all duration-700 opacity-0 translate-y-8`, staggered
  `transition-delay: {index * 100}ms` (5 items → 0/100/200/300/400ms).
  Each row is a hover `group`: the number tints orange and the title tints
  to full foreground color on hover
  (`group-hover:text-orange-300`, `group-hover:text-foreground`).

**Current** (`src/app/page.tsx`, the "Process" section): heading + image
side by side at the top (not sticky), then a separate `<ol>` grid of 5
icon-cards below (`grid gap-5 md:grid-cols-2 lg:grid-cols-3`, each with an
icon box, tag chip, number, title, body). No scroll reveal, no per-row hover
color shift, no sticky column, no animated underline.

**Fix outline:**
- Rebuild as two-column: sticky left (heading + underline SVG + image),
  vertical numbered list right.
- Build one reusable `<Reveal delay={i * 100}>` client wrapper
  (IntersectionObserver-based) matching the exact
  `opacity-0 translate-y-8 → opacity-100 translate-y-0`, `duration-700`
  timing — reuse it in §5 (CityDirectory) too instead of duplicating logic.
- This is a genuine layout redesign, not a small tweak — size the estimate
  accordingly.

---

## 5. Homepage — "Auctions by City"

**Prototype:** same grid-of-state-cards structure we already have, but each
card scroll-reveals with the same `opacity-0 translate-y-8` pattern,
staggered by grid position: `transition-delay: {(index % 4) * 100}ms` (caps
at 400ms regardless of how many cards, so it reads as column-based stagger
not linear).

**Current** (`src/components/home/CityDirectory.tsx`): structurally
equivalent grid + working live filter (this part is *not* a gap — the
prototype's filter is also client-side-only). Missing only the scroll-reveal
entrance.

**Fix:** apply the same `<Reveal>` wrapper from §4, delay = `(index % 4) * 100`.

---

## 6. Site-wide micro-interaction: arrow-hover slide

**Prototype:** every "View all" / arrow-icon link slides the icon 4px right
on hover: `transition-transform group-hover:translate-x-1` on the icon, with
`group` on the parent link. External-link arrows also lift diagonally
(`group-hover:translate-x-1 group-hover:-translate-y-1`).

**Current:** `Link href="/properties" className="btn-ghost"` +
`<ArrowRight />` in `src/app/page.tsx` — icon is static, no `group` class on
the link.

**Fix:** trivial — add `group` to the link, `transition-transform
group-hover:translate-x-1` to the icon. Apply everywhere `ArrowRight`
follows a CTA (homepage "View all properties", final CTA, etc.).

---

## 7. Footer — color scheme mismatch

**Prototype:** light footer, matches page background, thin top border
(`py-16 border-t border-border`), muted-foreground link color that darkens
to full foreground on hover.

**Current** (`src/components/site/Footer.tsx`): solid dark navy
(`bg-hero text-white/70`), orange hover instead of foreground-darken. This
was likely a deliberate call at the time (dark footer reads as more premium,
consistent with the hero color) rather than an oversight — `MEMORY.md`
decisions log (D7) shows a precedent of deliberately diverging from the
prototype on button treatment.

**Recommendation:** ask before changing — this is a design decision, not an
unambiguous bug. If you want parity, it's a straightforward class swap once
the logo/icon exists (footer reuses the same animated logo mark from §1).

---

## 8. Alerts section — glass panel

**Prototype:** the "Set Up Free Alerts" form sits on the dark CTA band in a
translucent glass card: `bg-background/5 border border-primary-foreground/10
backdrop-blur-sm`.

**Current** (`src/app/page.tsx`, Alerts section): uses the standard opaque
`.card` (solid white/`bg-card`) — reads as a plain white box dropped onto a
dark section rather than an integrated glass panel.

**Fix:** small — add a `.card-glass` variant in `globals.css` for use only
on dark sections (Alerts here; reusable if any future dark section needs it).

---

## 9. Search / Properties page

No section-specific animation or hover pattern was found in `demo/search.html`
beyond the shared header/footer/logo (same counts: 2× `group-hover` = header
+ footer, matches exactly). **No additional listing-card hover, filter-panel
transition, or reveal effect exists in the prototype for this page.** Once
§1–2 (logo, header) land, this page inherits the fix automatically — no
separate work item needed here beyond that.

---

## 10. Out of scope for this pass

- **Listing detail page** (`/properties/[slug]`) — no `demo/*.html`
  reference exists for it (confirmed: only `index / about / login / partner
  / services / search / signup` were exported). Nothing to replicate against;
  this was already known (master plan §0, gotcha #8 in `MEMORY.md`).
- **About / Services / Channel Partner** — currently placeholder stubs
  (Sprint 4 per the master plan). The prototype's real `about.html` /
  `services.html` / `partner.html` do have their own scroll-reveal content
  (e.g. `services.html` has 7 staggered items) worth mining when those pages
  get built — but that's new-page work, not a fix to an existing page, so it
  belongs in Sprint 4, reusing the `<Reveal>` primitive built in §4 rather
  than as a rushed add-on here.

---

## 11. Priority order (pick a cutoff, or approve all)

| # | Item | Effort | Visual impact | Blocked on |
|---|---|---|---|---|
| P0 | §6 Arrow-hover micro-interaction | Trivial | Low-medium | — |
| P0 | §8 Alerts glass panel | Small | Medium | — |
| P1 | §5 CityDirectory scroll-reveal | Small (shares `<Reveal>` w/ P1 below) | Medium | — |
| P1 | §4 "Our Process" section rebuild | Large | High | — |
| P2 | §2 Header transparent→solid morph + underline nav hover | Medium | Medium-high | — |
| P3 | §1 Logo icon + gradient + hover | Small once asset exists | High (branding) | **client logo asset, or approval to recreate prototype's SVG paths** |
| P3 | §7 Footer color scheme | Small | Medium | **your call — deliberate divergence or align?** |
| Flag only | §3 Mobile nav pattern | — | — | recommend keeping current drawer |
| Deferred | §10 About/Services/Partner | Large | High | Sprint 4 per master plan |

---

## 12. Open questions before executing

1. **Logo:** recreate the prototype's exact SVG icon, or wait for the
   client's real brand asset?
2. **Footer:** align to the prototype's light scheme, or keep the current
   dark `bg-hero` footer as an intentional choice?
3. **Cutoff:** execute P0+P1 only next session (arrows, glass panel, city
   reveal, Process rebuild), or also take P2 (header morph + nav underline)?
4. **Mobile nav:** confirm keeping the current drawer pattern (recommended)
   rather than matching the prototype's inline slide-down panel.
