# Cards & layout: density, consistency, and the two audit corrections

Written against: working tree of `startup-ideas-dz`.

## Evidence chain

- Surface: public routes, `Hero.tsx` masthead (home), `DomainCard.tsx` (home domain index), `StartupRow.tsx` (home recent, browse, domain explorer, saved), `DomainExplorer.tsx` (domain page), `browse/page.tsx`.
- Problems (user-requested "cards + layouts" refinement, plus two audit findings folded in):
  a) FE1 — masthead ledger contradicts its own ruled-table presentation on mobile: `grid grid-cols-2 divide-line border-t border-line sm:grid-cols-4 sm:divide-x` has no horizontal rule between the stacked two-cell rows.
  b) FE2 — the single primary CTA appears in two sizes: search buttons `h-11 px-5` vs mobile filter trigger `h-9 px-4`.
  c) Density/perceived-clarity: rows and index cards carry only one visual state (`hover:bg-line/20`), no forward affordance on list items, and the row ref code/name baseline alignment is loose.
- Design evidence: atlas identity — hairline rules, mono reference codes (`AI · 001`, tabular numerals `padStart(2)`), no pills/gradients, at most two button styles, `--color-signal` for action. `results-band` on browse already counts entries.
- Owner: the components above; `ResultsGrid.tsx` sets the shared list frame.
- Scope and affected surfaces: home, browse, domain, saved. Admin excluded.
- Uncertainty: whether to reintroduce a covering "card" surface. The accepted identity is ruled records, not floating boxes — the refinement below strengthens the record presentation instead of reverting to rounded cards.

## Design decision

Keep the ruled-record system and increase its information density and affordance without adding new surface primitives:

1. **Ruling fix (FE1)** — give the ledger equal hairline rulers at every breakpoint: `divide-y divide-line border-t border-b border-line sm:border-y-0 sm:divide-y-0 sm:divide-x` so mobile shows a 2×2 ruled grid and desktop keeps the 4-column plate.
2. **Primary-action unification (FE2)** — all primary CTAs use `h-11 px-5 text-sm`; change only the `DomainExplorer` mobile filter trigger.
3. **Record affordance** — on `StartupRow`/`DomainCard`, add a mono trailing `→` (in RTL it renders `←` automatically when expressed as the same glyph in normal flow — verify visually) in `text-ink/40`, shifting to `text-signal` on group hover. This makes list items read as navigable without pills or borders. `StartupRow` name link already exists; `DomainCard` gets the arrow next to its count.
4. **Baseline alignment** — `StartupRow`: snap the ref code, name, and meta onto a shared baseline by removing the descender slack the two-line description creates: keep `items-start`, but set the code column `leading-[1.7]` so it aligns with the name's first line (match the description `leading-relaxed`).
5. **Mobile results header** — on browse, keep the existing `results-band`; no change needed beyond the above.

The motion hover states are specified in plan `002`; this plan does not change motion beyond what plan `002` tokens already require.

## Reuse

- Tokens/fonts: `text-flag-gold` / `text-signal` / `divide-line` / `border-line` / `--color-*` theme vars (plan `001`); mono code styling matches `DomainCard` and `StartupRow` existing `font-mono text-xs uppercase tracking-wider text-ink/40`.
- Exemplar for the arrow: the existing breadcrumb marker used on startup detail pages (verify its glyph and color, reuse the same styling so RTL handling is already solved).
- No new components.

## Changes

1. `src/components/Hero.tsx` — ledger container: replace `grid grid-cols-2 divide-line border-t border-line sm:grid-cols-4 sm:divide-x` with `grid grid-cols-2 divide-y divide-line border-y border-line sm:grid-cols-4 sm:divide-x sm:divide-y-0 sm:border-b-0 sm:border-t-0`. Verify: mobile home shows a fully ruled 2×2 grid; desktop unchanged (4 ruled cells).
2. `src/components/DomainExplorer.tsx` — mobile filter button classes `h-9 … px-4` → `h-11 … px-5`. Verify: browse and domain pages have identical primary CTA geometry at every width.
3. `src/components/StartupRow.tsx` and `src/components/DomainCard.tsx`:
   - Add group hover affordance: trailing arrow element only if the row/card is a link (both are) — `font-mono text-sm text-ink/40 transition-colors group-hover:text-signal`; for `StartupRow` place inline after the country/year meta; for `DomainCard` beside the padded count.
   - `StartupRow`: code column gets `leading-[1.7]` to hug the name baseline; keep `items-start`, `line-clamp-2`, all existing aria.
   - No new borders, shadows, or rounded corners.
   - Verify: list items read as interactive; RTL page renders the arrow mirrored (compare `dir=rtl` home and browse); no horizontal scroll.
4. `src/components/ResultsGrid.tsx` — no change required; shared frame and stagger stay. Remove any leftover `StartupCard` re-export if `StartupRow` ships one (verify first).
5. `src/app/[locale]/browse/page.tsx` — confirm the results band still conveys count + active filters; no change expected.

## Scope

- Inherit: home (domains + recent), browse list, domain explorer list, saved list — all through `StartupRow`/`DomainCard`/`ResultsGrid`.
- Verify: `/ar` RTL rendering of arrows and divider directions, startup detail page breadcrumb arrow stays consistent, `divide-*` in RTL.
- Exclude: admin, donor `algeria-deeptech`, print, and any rounded-card surface (identity decision: none exist and none are introduced).

## Validation

- Product: the index reads as a navigable, fully ruled ledger at every breakpoint; one primary button style; no floating-box regressions.
- Interface: home + browse + domain + saved at 360px, 768px, 1280px; RTL variants; hover states at rest; keyboard focus visible (tokenized focus ring flips with themes from plan `001`).
- System: no duplication of the arrow/tokenization — reuse the breadcrumb exemplar; no new primitives.
- Repository: `npx eslint src scripts --max-warnings 0` → clean; `npx tsc --noEmit` → clean; `node node_modules/next/dist/bin/next build` → succeeds.

## Stop conditions

- Stop if the ledger ruling fix changes desktop rendering of the masthead, if the arrow visually collides with the count/meta in any locale, or if `DomainExplorer`'s h-11 button crowds the filter sheet header (then keep h-11 but reduce padding to `px-4`).
- Stop if any second selected plan (`001`/`002`) supersedes a change here (e.g., motion tokens conflict with `transition-colors`); reconcile in the executing pass.

## Design documentation

- None by default; record the two corrections in `design-plans/000-audit.md` after validation.