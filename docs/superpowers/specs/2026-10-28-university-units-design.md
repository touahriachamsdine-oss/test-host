# Design Spec: University Incubation Units (Replace Domains)

**Date:** 2026-10-28  
**Project:** startup-ideas-dz  
**Status:** Draft for review  
**Goal:** Replace the "Explore by domain" (deep-tech domains) structure with "Explore by university incubation units". Each of the 5 units gets its own page and its own list of projects.

## 1) Units to implement

| Unit | Arabic | Slug | Code | Icon (lucide) | Purpose |
|---|---|---|---|---|---|
| **CDE (Entrepreneurship Development Hub)** | مركز تنمية المشاريع الريادية | `cde` | `CDE` | `BookOpen` | Culture & Skills Pre-incubation (management, marketing, accounting) |
| **Business Incubator (الحاضنة الجامعية)** | الحاضنة الجامعية | `business-incubator` | `INC` | `Building2` | Project Acceleration & Coaching (co-working, mentoring, business plan under Decree 1275) |
| **CATI (Technology & Innovation Support)** | مركز دعم التقانة والابتكار | `cati` | `CATI` | `FileCheck` | Intellectual Property Protection (INAPI patent search/filing for student inventions) |
| **BLUE/BLEU (University-Business Liaison)** | رابطة الجامعة بالمؤسسة | `blue-bleu` | `BLEU` | `Handshake` | Market Integration & External Networking (internships, curriculum review, link research to industry) |
| **The One-Stop Shop (الشباك الوحيد)** | الشباك الوحيد | `one-stop-shop` | `OSS` | `ClipboardList` | Bureaucracy & Logistics Fast-Track (Ministry of Commerce/Wilaya reps to register on campus) |

## 2) Decisions (approved)

- **Replace entirely:** Remove/replace the "Domains" grid on home and the "Domains" nav item. The new structure is "Units".
- **Add `unit_slug` to DB:** Add `unit_slug` to `startups` table. Migrate existing startups by assigning them to one of the 5 units (proposed mapping for review before applying).
- **Routes:** `/[locale]/units` (grid) + `/[locale]/unit/[slug]` (projects for unit). Reuse `/domain/*` patterns where helpful.
- **Navbar:** Replace "Domains" with "Units" linking to `/units`. Update `en/fr/ar` translations.
- **Browse:** Keep `/browse` as global (all projects across units). Add unit label to cards/browse where visible.

## 3) Data model changes

### Database
- **Table `startups`**: add `unit_slug text` (nullable initially for migration, then make NOT NULL after assignment or keep nullable with fallback). Add index `idx_startups_unit_slug` on `unit_slug`.
- **(Optional)** Add `units` table or just use `src/data/units.ts` as source of truth. Suggested: use code/data file as source of truth (like `DOMAINS`) to avoid extra migration complexity.

### Types
- `src/lib/db.ts`: add `unitSlug?: string` to `PublicStartup` and `AdminStartup`. Update `mapPublicStartup` to read `unit_slug`.
- `src/types/*` (if any additional types): update accordingly.

### Queries
- Add `getVerifiedByUnit(unitSlug, locale)`: similar to `getVerifiedByDomain`.
- Add `countVerifiedByUnit()`: group by `unit_slug` for unit cards.
- Update `getPublicStats()` to return units count (or keep domains count? Replace with units count).
- Update admin queries/selects to include `unit_slug` in selects/inserts/updates as needed.
- Update import logic if needed to accept/assign `unit_slug`.

## 4) UI changes

### New files
- `src/data/units.ts` - units config (mirrors `domains.ts`)
- `src/components/UnitCard.tsx` - card for unit grid (mirrors `DomainCard.tsx`)
- `src/app/[locale]/units/page.tsx` - grid of all units
- `src/app/[locale]/unit/[slug]/page.tsx` - unit detail listing projects (mirrors `domain/[slug]/page.tsx`)

### Modified files
- `src/app/[locale]/page.tsx` - replace "Explore by domain" with "Explore by units", use `UNITS` and `UnitCard`, counts via `countVerifiedByUnit()`
- `src/components/Navbar.tsx` - replace "Domains" link with "Units" -> `/units`, update active state
- `src/components/DomainCard.tsx` - may keep or deprecate (not used after replacement; can leave)
- `src/data/domains.ts` - may keep for now (admin still uses teams/domains in some places?) Need to be careful not to break admin. Check admin usage.
- `src/i18n/*` messages: update `Navbar.domains` -> `Navbar.units` (or add `units`), add unit names/descriptions/translations in `domainNames` style? Or add `unitNames` block.
- `messages/en.json`, `messages/fr.json`, `messages/ar.json` - add/update translations
- `src/lib/public-startups.ts` - add unit helpers
- `src/lib/db.ts` - type/mapping updates
- Admin files (`src/lib/admin.ts`, admin UI) - add support for `unit_slug` in forms/imports as needed (at minimum display/edit)

### Components to reuse
- `ResultsGrid`, `StartupRow`/`StartupCard`, `Reveal`, etc.

## 5) Migration plan for existing data
1. Read current startups: get all verified/pending with `id, name, domain, ...`
2. Propose a mapping (by domain/team/name heuristics) to assign each to one of the 5 units for review
3. Apply migration after approval (SQL update) adding `unit_slug`
4. Add index

## 6) Translations
Add to messages:
- `Navbar.units` (en/fr/ar)
- Possibly `Units.title`, `Units.subtitle`, `Units.explore`
- `unitNames` object with slugs -> localized names/short descriptions

## 7) Testing
- Type check (`tsc --noEmit`)
- Lint
- Build
- Manual: home shows units, unit pages load, cards show unit, browse still works, navbar updated

## 8) Implementation steps (high level)
1. Schema + types + DB helpers
2. Data files (units.ts) + components (UnitCard)
3. Routes (units + unit/[slug])
4. Home page swap
5. Navbar + translations
6. Migration of existing startups (proposed mapping)
7. Admin updates (if needed)
8. Tests/build verification

**Next:** Get user review/approval of this spec, then invoke `writing-plans` to create detailed implementation plan.