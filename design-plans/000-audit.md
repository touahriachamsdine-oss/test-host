# Improve-UI audit — Public deep-tech index surface

## Design language
- Audited surface: public site of `startup-ideas-dz` — routes `/` (home), `/browse`, `/domain/[slug]`, `/saved`, `/startup/[id]`, locales en/fr/ar (ar = RTL, root locale). Admin (`/admin/**`, dark slate) and donor project `algeria-deeptech` are excluded.
- Design sources: `src/globals.css` tokens (`--color-ink #16233a`, `--color-paper #f7f5f0`, `--color-line #d8d2c4`, `--color-surface #ffffff`, `--color-signal #1f6f5c`, `--color-flag-gold #a67c2e`; IBM Plex Sans/Arabic/Mono; focus ring `--color-signal`). No in-repo `DESIGN.md`; the "atlas / index of record" identity (hairline rules, mono reference codes `AI · 001`, two CTA styles only, no pills/gradients, tabular numerals) governs by convention from prior accepted work.
- Documented decisions: none in-repo (documented decisions = the atlas tokens above).
- Governing owners and consumers: `Navbar`, `Hero` (masthead plate + ledger), `MethodNote`, `DomainCard`, `StartupRow`, `ResultsGrid` (entrance stagger), `DomainExplorer`/`FilterPanel`, `SavedList`, `Footer`; every consumer resolves colors via the `--color-*` token names.
- Explicit exceptions: None documented (admin dark theme is a separate surface; excluded).

## Findings
| # | Problem | Evidence | Proposed change | Scope | Confidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Masthead ledger (`Hero.tsx`) renders `divide-x` only at `sm:`; at `grid-cols-2` the stacked pair of cells has a vertical rule but no horizontal rule — the ledger contradicts its own 4-cell ruled-table presentation on mobile. | `src/components/Hero.tsx` ledger container class `grid grid-cols-2 divide-line border-t border-line sm:grid-cols-4 sm:divide-x`. | Apply hairline rulers at every breakpoint: `divide-y border-b border-line sm:border-b-0 sm:divide-y-0 sm:divide-x` (one change to the ledger container). | Public / home masthead | High |
| 2 | The single primary CTA (solid `bg-signal text-paper`) exists in two heights/paddings on the same surface family: search buttons `h-11 px-5` (`Hero.tsx`, `browse/page.tsx`) vs mobile filter trigger `h-9 px-4` (`DomainExplorer.tsx`). | `src/components/DomainExplorer.tsx` mobile filter button `flex h-9 items-center gap-2 bg-signal px-4 …`; search buttons in `src/components/Hero.tsx` and `src/app/[locale]/browse/page.tsx` are `h-11 … px-5`. | Unify the primary action to `h-11 px-5` (the dominant exemplar) in `DomainExplorer.tsx`. | Public / browse + domain explorer | Medium |

Both findings are folded into plan `003-cards-layout-density.md`; user-requested improvements (themes, motion, cards/layout) are specified in plans `001`, `002`, `003`.

## Improve first
Finding 1 (ledger ruling) — highest certainty, one-token change, visible on mobile; folded into plan `003`.

## Status (2026-09-14)

Accepted and executed. Plans `001` (themes), `002` (motion), `003` (cards/layout) implemented; both findings resolved.
Validated: `npx eslint src scripts --max-warnings 0` clean, `npx tsc --noEmit` clean, `node node_modules/next/dist/bin/next build` passes.
Runtime (localhost:4000): theme init script + `ThemeToggle` (system/light/dark/night) present on en/fr/ar; `page-enter` + `rise-in` cascade + `--n` delays in rendered HTML and compiled CSS; ledger ruled at all breakpoints (`border-e`/`border-t`, logical in RTL); `flip-rtl` row arrows; primary CTA unified `h-11 px-5`; reduced-motion guard emits `animation-duration:.01ms !important`; `/admin` still redirects to `/admin/login`; browse shows 27 rows, domain page 3 rows.