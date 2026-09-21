# Motion: system-wide animation tokens and entrances

Written against: working tree of `startup-ideas-dz`.

## Evidence chain

- Surface: public routes `/`, `/browse`, `/domain/[slug]`, `/saved`, `/startup/[id]`, all locales.
- Problem: motion is not systematized. The only entrance is `ResultsGrid`'s stagger (opacity + `translateY(4px)`, hard-coded durations/`ease-out` in `globals.css`), there is no page-level arrival, the masthead plate (`Hero.tsx`) has no entrance, and row hovers vary (`duration-100` on `StartupRow` vs `duration-150/200` elsewhere). User-requested: better animations.
- Design evidence: the atlas identity is ruled lines and editorial type; motion should follow — quiet, directional, transform/opacity only. Existing reduced-motion guard in `globals.css` (`@media (prefers-reduced-motion: reduce)`) is the contract for accessibility.
- Owner: `src/globals.css` (motion behavior) and the page components (`Hero.tsx`, `StartupRow.tsx`, `DomainCard.tsx`).
- Scope and affected surfaces: all public pages; admin excluded.
- Uncertainty: durations are new values; pick from the tokens below and confirm visually.

## Design decision

Introduce motion tokens and reuse them everywhere instead of inline magic values:
`--dur-fast:120ms`, `--dur-base:220ms`, `--dur-slow:380ms`, `--ease-standard:cubic-bezier(.2,.7,.2,1)`, `--ease-emphatic:cubic-bezier(.16,1,.3,1)`.

Three layers, all transform/opacity, all gated by the existing `prefers-reduced-motion` override:
1. **Page arrival** — a new `src/app/[locale]/template.tsx` renders a wrapper `div.page-enter`; App Router remounts templates on navigation, so a CSS `animation: page-enter` replays on every route change with zero JS.
2. **Hierarchical entrance** — the masthead plate in `Hero.tsx` gets a `.rise-in` parent; its children (kicker, headline, search row, ledger) cascade with nth-child delays (60ms steps, capped at 240ms).
3. **Micro-interactions** — `StartupRow`/`DomainCard` hovers get consistent `ease-standard` + `--dur-base`; on hover the row name and ref code shift to `text-signal` (tint already exists on the row). Keep the search result hover in `ResultsGrid` unchanged except tokenizing its duration.

The theme crossfade is specified in plan `001`; no JS motion library, no IntersectionObserver needed (all entrances are on-render).

## Reuse

- Existing stagger pattern in `globals.css` (`ResultsGrid` init/in classes) is the exemplar; deepen its travel from 4px to 6px under the new token so page-enter, rise-in, and stagger share one motion voice.
- Existing `@media (prefers-reduced-motion: reduce)` guard — extend it to neutralize `page-enter` and `rise-in` (add `animation: none !important`) in the same block.
- Existing icon-button/type conventions in `Hero.tsx`; no new components.

## Changes

1. `src/globals.css`
   - Add motion tokens (plain CSS vars, alongside the theme vars from plan `001`):
     `--dur-fast:120ms; --dur-base:220ms; --dur-slow:380ms; --ease-standard:cubic-bezier(.2,.7,.2,1); --ease-emphatic:cubic-bezier(.16,1,.3,1);`
   - Add keyframes `page-enter` (`opacity:0; translateY(8px)` → `opacity:1; translateY(0)`, `var(--dur-slow) var(--ease-emphatic) both`) and `rise-in` (same shape, `--dur-slow`) with utility classes `.page-enter` and `.rise-in`; `.rise-in > *` animation includes `animation-delay: calc(var(--n) * 60ms)` using `--n` inline per child (set `--n:1..4` on the four plate children) — cap visible movement at 240ms.
   - Extend the reduced-motion block: `animation: none !important` for `.page-enter`/`.rise-in`; leave the existing transition neutralization intact.
   - Tokenize the ResultsGrid durations to `var(--dur-base)`/`var(--ease-standard)` and increase stagger translate to 6px.
   - Verify: `npx tsc --noEmit`; the emitted CSS contains the keyframes; reduced-motion media query appears once, after the keyframes.
2. New `src/app/[locale]/template.tsx`
   - Export default async server component returning `<div className="page-enter">{children}</div>`. No hooks, no client directives — template remount on navigation restarts the animation.
   - Preserve: nothing else — the component only wraps children.
   - Verify: navigating `/` → `/en/browse` replays the entrance; browser back also replays.
3. `src/components/Hero.tsx`
   - Change: add `rise-in` to the masthead plate container and `style={{ '--n': 1|2|3|4 }}` (or equivalent CSS var) to its four direct children (kicker/ledger-line, headline + ledger values as one, search row, method note if present). Keep the search row interactive immediately (`animation-fill-mode: both` with short delay is fine; inputs remain usable).
   - Preserve: plate classes, ledger ruling (fix from plan `003`), all copy, search behavior.
   - Verify: on load the plate cascades in while the hero search is still tappable within ~120ms.
4. `src/components/StartupRow.tsx` and `src/components/DomainCard.tsx`
   - Change: hover state — row: `transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]`, name link `group-hover:text-signal`, ref code `group-hover:text-signal/80`; domain card: same color shift on code + name, count stays `text-ink/40`.
   - Preserve: hairline rows, tabular numerals, `hover:bg-line/20` tint, all semantics.
   - Verify: hover at 120fps on desktop; no layout shift (colors only).
5. `src/components/FilterPanel.tsx` / `src/components/ResultsGrid.tsx` (only if present)
   - Change: tokenize any remaining literal `duration-*`/`ease-*` used for results to `var(--dur-base)`/`var(--ease-standard)`.
   - Preserve: the stagger init/in contract classes.
   - Verify: `grep` for stray `duration-` literals in public components — none outside the token definitions.

## Scope

- Inherit: all public pages and locales; ResultsGrid stagger; row and domain hovers; theme crossfade (plan `001`) is separate and not modified here.
- Verify: `/ar` RTL pages (transforms are direction-agnostic), `/saved`, startup detail page (detail content should not double-animate if it already fades in — check and leave its existing behavior).
- Exclude: admin, reduced-motion users (all motion disabled per existing contract), print.

## Validation

- Product: an arrival on every route change, a masthead cascade on home, consistent row hovers; nothing animates continuously.
- Interface: `/`, `/en/browse`, `/ar/domain/[slug]`, `/saved` with DevTools "prefers-reduced-motion: reduce" — all elements appear immediately, no hidden-until-animated state; mobile viewport no horizontal overflow from `translateY`.
- System: no new utility classes collide with Tailwind (prefix `.page-enter`/`.rise-in` live in globals as plain CSS, not Tailwind utilities); no JS observables added.
- Repository: `npx eslint src scripts --max-warnings 0` → clean; `node node_modules/next/dist/bin/next build` → succeeds.

## Stop conditions

- Stop if any entrance leaves content at `opacity:0` under reduced motion, navigation responsiveness degrades (template animation blocking paint), or scroll/overlap regressions appear on mobile.
- Stop if the hero search input delay exceeds ~150ms (then reduce the ledger `--n` cap).

## Design documentation

- None by default; record "Motion tokens" in `design-plans/000-audit.md` after validation if accepted.