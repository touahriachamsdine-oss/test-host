# Theme: light / dark / night mode for the public surface

Written against: working tree of `startup-ideas-dz` (no commit metadata available in workspace).

## Evidence chain

- Surface: public routes `/` (home), `/browse`, `/domain/[slug]`, `/saved`, `/startup/[id]`, all locales en/fr/ar (ar = RTL). Layout root: `src/app/[locale]/layout.tsx`.
- Problem: the public surface is single-theme (light only). All color is emitted as fixed hex from `src/globals.css` `@theme inline` (`--color-ink #16233a`, `--color-paper #f7f5f0`, `--color-line #d8d2c4`, `--color-surface #ffffff`, `--color-signal #1f6f5c`, `--color-flag-gold #a67c2e`), so there is no way to present the surface at night without duplicating styling. User-requested: dark and night modes.
- Design evidence: the atlas system resolves every color utility through the `--color-*` token names; no consumer hardcodes a public hex anywhere on the audited routes. Fonts: IBM Plex Sans/Arabic/Mono (weight arrays). Primary action uses `bg-signal text-paper`; text `text-ink` on `bg-paper`; rules `border-line`; surface blocks `bg-surface`.
- Owner: `src/globals.css` (token layer) and `src/app/[locale]/layout.tsx` (root markup).
- Scope and affected surfaces: all public routes/locales; admin (`src/app/admin/**`, `src/app/admin/admin.css`) is excluded and stays dark.
- Uncertainty: exact palette steps for dark/night are new values (no repo precedent); propose conservative values below, tuned to pass WCAG contrast with ink/paper.

## Design decision

Make the audit's token names theme-aware without touching consumers: move the six palette values into CSS custom properties declared on `:root` / `[data-theme='dark']` / `[data-theme='night']`, and point the Tailwind v4 `@theme inline` color entries at those variables (`--color-ink: var(--ink);` …). Because Tailwind v4 emits `color-mix()` for opacity modifiers, existing usage such as `bg-paper/90`, `bg-signal/10`, and `hover:bg-line/20` keeps working and flips with the theme.

Three modes: `light` (current palette unchanged), `dark` (deep blue-grey paper, raised surface, desaturated signal), `night` (near-black paper, dimmed gold, brightest signal for readability). Mode is set as `data-theme` on `<html>`; default is `system` (respects `prefers-color-scheme`, resolving to `dark` or `light`). Persistence to `localStorage`. An inline init script at the top of `<body>` applies the stored/system theme before the rest of the body renders, which prevents a flash of the wrong mode.

## Reuse

- All existing color token names unchanged: `bg-paper text-ink border-line bg-surface text-signal text-flag-gold` etc. Consumers are unmodified by this plan.
- Existing Navbar control cluster, LangSwitcher styling, and icon-button conventions (16px, hairline, mono optional) shape `ThemeToggle`.
- Exemplar for theme-flagging: `data-theme` attribute naming, matching the existing `html[dir=rtl]` attribute-based routing rules already in `globals.css`.

No new dependency. A `ThemeToggle` component is required because no existing control cycles themes; it reuses existing token/variant styling.

## Changes

1. `src/globals.css`
   - Change: add, before the `@theme` block:
     - `:root { color-scheme: light; --ink:#16233a; --paper:#f7f5f0; --line:#d8d2c4; --surface:#ffffff; --signal:#1f6f5c; --flag-gold:#a67c2e; }`
     - `[data-theme='dark'] { color-scheme: dark; --ink:#e9e6de; --paper:#10151c; --line:#2a333f; --surface:#171e27; --signal:#57b492; --flag-gold:#d9b25e; }`
     - `[data-theme='night'] { color-scheme: dark; --ink:#e6e2d6; --paper:#07090c; --line:#1f2733; --surface:#0d1217; --signal:#6ac49f; --flag-gold:#d9b25e; }`
     - `@media (prefers-reduced-motion: no-preference) { html, body { transition: background-color 180ms ease, color 180ms ease; } }` for a calm crossfade on toggle.
   - Change: inside the `@theme inline` block, replace the six `--color-*` literals with `var(...)` references (`--color-ink: var(--ink);` etc.). Preserve any other entries (`--color-brand-*`, fonts) exactly; if a brand alias exists, map it to the same variable.
   - Verify: `npx tsc --noEmit` passes; a utility like `bg-signal/10` still compiles (grep the build output for `color-mix` usage — expected).
2. `src/app/[locale]/layout.tsx`
   - Change: render an inline `<script dangerouslySetInnerHTML>` as the first child of `<body>`, before `<NextIntlClientProvider>`. Script (plain JS, no imports):
     - read `localStorage.getItem('deeptech.theme')`; if absent, resolve the `<html>` `data-theme` from `matchMedia('(prefers-color-scheme: dark)')` → `'dark' : 'light'`; if the stored value is `'system'`, do the same; otherwise apply the stored value (`'light' | 'dark' | 'night'`).
     - set `document.documentElement.setAttribute('data-theme', resolved)`.
   - Preserve: layout structure, fonts, font variables, `body` class string.
   - Verify: hard refresh with theme `dark` stored → no light flash; with no storage → follows OS.
3. New `src/lib/theme.ts` (client-safe, no server APIs)
   - Export `type ThemeSetting = 'light' | 'dark' | 'night' | 'system'`, `STORAGE_KEY = 'deeptech.theme'`, `getStoredTheme()`, `resolveTheme(setting): 'light'|'dark'|'night'` (system honors OS), `applyTheme(setting, { persist })` (set `data-theme` + optional storage), `listenToSystem(cb)` (drives re-apply when OS scheme changes and setting is `system`).
4. New `src/components/ThemeToggle.tsx` (`'use client'`)
   - Render a hairline group: `inline-flex items-center divide-x divide-line border border-line` of three square buttons (`h-8 w-8`), icons Sun / Moon / MoonStar drawn as inline SVGs (stroke, 16px), per locale via next-intl:
     - active = `bg-ink text-paper`; idle = `bg-transparent text-ink/60 hover:text-ink`.
     - `aria-label` from messages `Theme.light/dark/night`; `aria-pressed` reflects selection.
     - initial state from `getStoredTheme()`; on click `applyTheme(v, { persist: true })`.
     - when stored is `system`, no button reads active (matches "follows OS").
5. `src/app/[locale]/layout.tsx` / `src/components/Navbar.tsx`
   - Change: import and render `<ThemeToggle />` in the Navbar control cluster beside `LangSwitcher`; keep it visible on mobile (it is three 32px buttons; if the cluster crowds, order after LangSwitcher).
   - Preserve: Navbar layout, edition mark, all existing links and aria.
   - Verify: toggle present on all locales including `ar`.
6. `messages/{en,fr,ar}.json`
   - Add `"Theme": { "light": …, "dark": …, "night": … }` with correct translations (fr: «Clair», «Sombre», «Nuit»; ar: فاتح / داكن / ليلي — keep short labels for the aria-labels).

## Scope

- Inherit: all public locales and routes; every component using the six token names; background `bg-paper/90` surfaces; `html[dir=rtl]` rules.
- Verify: RTL pages, `/saved` (uses `surface` blocks), startup detail pages, admin stays visually unchanged (excluded but confirm no bleed).
- Exclude: `src/app/admin/**`, donor project `algeria-deeptech`, print styles, OG/metadata images.

## Validation

- Product: user changes theme on `/`, `/en/browse`, `/ar/domain/ai-computing`; the mode persists across reload; OS-dark users get dark on first visit, then their explicit choice wins.
- Interface: each route × three modes; toggling under `prefers-reduced-motion: reduce` shows no transition; focus ring (`--color-signal`) visible in dark and night; text contrast ink/paper ≥ 4.5:1 at `font-normal` (check `#e9e6de` on `#10151c` and `#e6e2d6` on `#07090c`).
- System: consumers restyled only via tokens — grep audited public components for literal `#` hex to confirm none remain.
- Repository: `npx eslint src scripts --max-warnings 0` → clean; `npx tsc --noEmit` → clean; `node node_modules/next/dist/bin/next build` → succeeds with locale pages built.

## Stop conditions

- Stop if a consumer hard-codes a public hex (then tokenize it first) or if `@theme inline` + `var()` does not resolve in the installed Tailwind v4 build (then confirm the mechanism on a single token before porting all six).
- Stop if WCAG contrast fails at `font-normal` in dark/night; adjust only the surface/ink pairs.

## Design documentation

- After acceptance and validation: add a short "Themes" note to the plan record (`design-plans/000-audit.md`) — or, if the repo gains a `DESIGN.md`, record the three mode palettes and the `data-theme` contract there. Default: `design-plans/000-audit.md` only.