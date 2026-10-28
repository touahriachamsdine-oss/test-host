# University Incubation Units Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Explore by domain" (deep-tech domains) structure with "Explore by university incubation units". Each of the 5 units gets its own page and its own list of projects.

**Architecture:** Add `unit_slug` to startups table, create units data/config and UnitCard component, add `/[locale]/units` and `/[locale]/unit/[slug]` routes mirroring domain patterns, swap homepage to show units, update navbar/translations, keep `/browse` global. Migrate existing startups by proposing assignments.

**Tech Stack:** Next.js 16 (App Router), TypeScript, next-intl, PostgreSQL (pg), Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-10-28-university-units-design.md`

## Global Constraints
- Follow existing patterns (mirror `domains.ts`, `DomainCard.tsx`, `domain/[slug]/page.tsx`)
- Keep changes minimal and consistent with codebase style
- Update all three locales (en, fr, ar) for user-facing strings
- Propose startup-to-unit mapping before applying DB changes
- Don't break existing admin functionality unnecessarily
- Keep `/browse` global as-is

---

### Task 1: Add unit_slug to database schema and types

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `db/startup_ideas_dz.sql` (for reference/documentation of schema change)

**Interfaces:**
- Consumes: existing `PublicStartup`, `AdminStartup` types
- Produces: `unitSlug?: string` on `PublicStartup` and `AdminStartup`

- [ ] **Step 1: Update PublicStartup and AdminStartup interfaces in db.ts**

```typescript
export interface PublicStartup {
  id: string;
  name: string;
  country: string;
  domain: string;
  unitSlug?: string;
  subDomain?: string;
  // ... rest unchanged
}
```

```typescript
export interface AdminStartup extends PublicStartup {
  isDuplicate2025: boolean;
  submittedByTeam: string | null;
  submittedByTeamCode: string | null;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Update mapPublicStartup to read unit_slug**

In `mapPublicStartup` function, add:
```typescript
...(row.unit_slug ? { unitSlug: String(row.unit_slug) } : {}),
```

Add it near other optional fields.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit` (from `startup-ideas-dz/` directory)
Expected: No errors related to these changes

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add unitSlug to startup types"
```

---

### Task 2: Create units data file and UnitCard component

**Files:**
- Create: `src/data/units.ts`
- Create: `src/components/UnitCard.tsx`

**Interfaces:**
- Consumes: `lucide-react` icons
- Produces: `UNITS` array, `Unit` interface, `getUnit(slug)` function; `UnitCard` component

- [ ] **Step 1: Create src/data/units.ts**

```typescript
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Building2, FileCheck, Handshake, ClipboardList } from 'lucide-react';

export interface Unit {
  slug: string;
  code: string;
  icon: LucideIcon;
  name: { en: string; fr: string; ar: string };
  short: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
}

export const UNITS: Unit[] = [
  {
    slug: 'cde',
    code: 'CDE',
    icon: BookOpen,
    name: { 
      en: 'CDE (Entrepreneurship Development Hub)', 
      fr: "Pôle de Développement de l'Entrepreneuriat", 
      ar: 'مركز تنمية المشاريع الريادية' 
    },
    short: { 
      en: 'Culture & Skills Pre-incubation', 
      fr: 'Culture et compétences pré-incubation', 
      ar: 'التثقيف وبناء المهارات' 
    },
    description: { 
      en: 'Delivers crash-courses in management, marketing, and accounting to transition academic minds into business thinkers.', 
      fr: "Formations courtes en management, marketing et comptabilité pour passer d'un esprit universitaire à un esprit entrepreneurial.", 
      ar: 'يقدم دورات مكثفة في التسيير والتسويق والمحاسبة لتحويل الطلبة إلى رواد أعمال.' 
    }
  },
  {
    slug: 'business-incubator',
    code: 'INC',
    icon: Building2,
    name: { 
      en: 'Business Incubator (University Incubator)', 
      fr: "Incubateur Universitaire", 
      ar: 'الحاضنة الجامعية' 
    },
    short: { 
      en: 'Project Acceleration & Coaching', 
      fr: "Accompagnement et accélération", 
      ar: 'تسريع المشاريع والتكوين' 
    },
    description: { 
      en: 'Provides physical co-working spaces, expert mentoring, and business plan drafting specifically for teams working under Decree 1275.', 
      fr: "Met à disposition des espaces de coworking, un accompagnement par des experts et l'aide à l'élaboration du plan d'affaires pour les équipes relevant du décret 1275.", 
      ar: 'يوفر فضاءات عمل مشتركة، وإرشاد من الخبراء، ومساعدة في إعداد مشروع الأعمال لفائدة الفرق المعنية بالمرسوم 1275.' 
    }
  },
  {
    slug: 'cati',
    code: 'CATI',
    icon: FileCheck,
    name: { 
      en: 'CATI (Technology & Innovation Support)', 
      fr: "CATI (Cellule d'Appui à la Technologie et à l'Innovation)", 
      ar: 'مركز دعم التقانة والابتكار' 
    },
    short: { 
      en: 'Intellectual Property Protection', 
      fr: "Protection de la propriété intellectuelle", 
      ar: 'حماية الملكية الفكرية' 
    },
    description: { 
      en: 'Partnered with INAPI to check patent databases and file patents for student inventions.', 
      fr: "En partenariat avec l'INAPI, il vérifie les bases de brevets et dépose des demandes de brevet pour les inventions étudiantes.", 
      ar: 'بالشراكة مع المعهد الوطني للملكية الصناعية، يفحص قاعدة براءات الاختراع ويساعد في تسجيل براءات اختراعات الطلبة.' 
    }
  },
  {
    slug: 'blue-bleu',
    code: 'BLEU',
    icon: Handshake,
    name: { 
      en: 'BLUE/BLEU (University-Business Liaison)', 
      fr: "Liaison Université-Entreprise (BLUE/BLEU)", 
      ar: 'التواصل بين الجامعة والمؤسسة' 
    },
    short: { 
      en: 'Market Integration & External Networking', 
      fr: "Intégration au marché et réseautage", 
      ar: 'التكامل مع المحيط الاقتصادي' 
    },
    description: { 
      en: 'Coordinates internships, invites corporate leaders to review curricula, and matches university research to regional industry needs.', 
      fr: "Coordonne les stages, fait intervenir des acteurs économiques pour adapter les formations et met en relation la recherche universitaire avec les besoins des entreprises.", 
      ar: 'ينسق فترات التربص، ويُشرك الفاعلين الاقتصاديين في مراجعة المناهج، ويربط أبحاث الجامعة باحتياجات المؤسسات.' 
    }
  },
  {
    slug: 'one-stop-shop',
    code: 'OSS',
    icon: ClipboardList,
    name: { 
      en: 'The One-Stop Shop (الشباك الوحيد)', 
      fr: "Guichet Unique", 
      ar: 'الشباك الوحيد' 
    },
    short: { 
      en: 'Bureaucracy & Logistics Fast-Track', 
      fr: "Démarches administratives simplifiées", 
      ar: 'تسهيل المساطر الإدارية' 
    },
    description: { 
      en: 'A one-stop interface bringing together representatives from the Ministry of Commerce and Wilaya to register businesses directly on campus.', 
      fr: "Un guichet unique regroupant des représentants du Ministère du Commerce et de la Wilaya pour permettre la création d'entreprise sur place sans se déplacer.", 
      ar: 'واجهة موحدة تضم ممثلين عن وزارة التجارة والولاية لتسجيل المشاريع مباشرة داخل الجامعة دون التنقل.' 
    }
  }
];

export function getUnit(slug: string): Unit | undefined {
  return UNITS.find((u) => u.slug === slug);
}
```

- [ ] **Step 2: Create src/components/UnitCard.tsx**

Mirror `DomainCard.tsx` structure:
```typescript
'use client';

import { ArrowUpRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Reveal } from './Reveal';
import type { Unit } from '@/data/units';

interface UnitCardProps {
  unit: Unit;
  count: number;
}

export function UnitCard({ unit, count }: UnitCardProps) {
  const locale = useLocale() as 'en' | 'fr' | 'ar';
  const Icon = unit.icon;
  const name = unit.name[locale] || unit.name.en;
  const short = unit.short[locale] || unit.short.en;

  return (
    <Reveal className="h-full">
      <Link
        href={{ pathname: '/unit/[slug]', params: { slug: unit.slug } }}
        className="group relative flex h-full flex-col overflow-hidden rounded-[12px] border border-line bg-paper/70 p-5 shadow-[0_40px_80px_-60px_rgb(0_0_0/0.4)] transition-all duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-signal/60 hover:shadow-[0_60px_90px_-60px_color-mix(in_srgb,var(--signal)_28%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink/80">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{name}</p>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink/40">{unit.code}</p>
            </div>
          </div>
          <ArrowUpRight
            size={18}
            className="text-ink/30 transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal motion-reduce:transition-none"
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">{short}</p>
        <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink/50">
          <span className="font-mono uppercase tracking-[0.24em]">{unit.slug.replace(/-/g, ' ')}</span>
          <span className="tabular-nums">{count} {count === 1 ? 'project' : 'projects'}</span>
        </div>
      </Link>
    </Reveal>
  );
}
```

- [ ] **Step 3: Verify files compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/data/units.ts src/components/UnitCard.tsx
git commit -m "feat: add university units data and UnitCard"
```

---

### Task 3: Add DB helper functions for units

**Files:**
- Modify: `src/lib/public-startups.ts`

**Interfaces:**
- Consumes: existing query patterns
- Produces: `getVerifiedByUnit()`, `countVerifiedByUnit()`

- [ ] **Step 1: Add getVerifiedByUnit function**

```typescript
export async function getVerifiedByUnit(
  unitSlug: string,
  locale: Locale = 'en'
): Promise<PublicStartup[]> {
  const rows = await query(
    `SELECT ${selectColumns()} FROM startups WHERE ${PUBLIC_WHERE} AND unit_slug = $1 ${ORDER}`,
    [unitSlug]
  );
  return withTranslations(rows.map(mapPublicStartup), locale);
}
```

- [ ] **Step 2: Add countVerifiedByUnit function**

```typescript
export async function countVerifiedByUnit(): Promise<Record<string, number>> {
  const rows = await query<{ unit_slug: string; count: string }>(
    `SELECT unit_slug, COUNT(*)::text AS count FROM startups WHERE ${PUBLIC_WHERE} AND unit_slug IS NOT NULL GROUP BY unit_slug`
  );
  return Object.fromEntries(rows.map((r) => [r.unit_slug, Number(r.count)]));
}
```

- [ ] **Step 3: Update getPublicStats to use units count**

```typescript
export async function getPublicStats(): Promise<{
  entries: number;
  domains: number;
  teams: number;
}> {
  const entriesRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startups WHERE ${PUBLIC_WHERE}`
  );
  const teamsRows = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM teams`);
  const { UNITS } = await import('@/data/units');
  return {
    entries: Number(entriesRows[0].count),
    domains: UNITS.length,
    teams: Number(teamsRows[0].count)
  };
}
```

Note: We need to import UNITS. Add import at top or inline as shown.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/public-startups.ts
git commit -m "feat: add unit query helpers"
```

---

### Task 4: Create unit routes

**Files:**
- Create: `src/app/[locale]/units/page.tsx`
- Create: `src/app/[locale]/unit/[slug]/page.tsx`

**Interfaces:**
- Consumes: `UNITS`, `UnitCard`, `getVerifiedByUnit`, `countVerifiedByUnit`
- Produces: unit listing pages

- [ ] **Step 1: Create src/app/[locale]/units/page.tsx**

```typescript
import { getLocale, getTranslations } from 'next-intl/server';
import { UnitCard } from '@/components/UnitCard';
import { ResultsGrid } from '@/components/ResultsGrid';
import { Reveal } from '@/components/Reveal';
import { UNITS } from '@/data/units';
import { countVerifiedByUnit } from '@/lib/public-startups';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function UnitsPage() {
  const t = await getTranslations('Units');
  const counts = await countVerifiedByUnit();
  const locale = (await getLocale()) as Locale;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <Reveal className="mt-10 flex flex-wrap items-baseline justify-between gap-2 pb-4">
        <h1 className="text-[26px] font-semibold leading-[34px] text-ink">{t('title')}</h1>
        <p className="text-sm text-ink/60">{t('subtitle')}</p>
      </Reveal>

      <ResultsGrid preset="domains" className="mt-8">
        {UNITS.map((unit) => (
          <UnitCard
            key={unit.slug}
            unit={unit}
            count={counts[unit.slug] ?? 0}
          />
        ))}
      </ResultsGrid>
    </section>
  );
}
```

- [ ] **Step 2: Create src/app/[locale]/unit/[slug]/page.tsx**

Mirror `domain/[slug]/page.tsx` pattern:
```typescript
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { UnitCard } from '@/components/UnitCard';
import { ResultsGrid } from '@/components/ResultsGrid';
import { Reveal } from '@/components/Reveal';
import { StartupRow } from '@/components/StartupRow';
import { getUnit, UNITS } from '@/data/units';
import { getVerifiedByUnit, countVerifiedByUnit } from '@/lib/public-startups';
import { buildSimilarMap } from '@/lib/similar';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

interface UnitPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return UNITS.map((unit) => ({ slug: unit.slug }));
}

export default async function UnitPage({ params }: UnitPageProps) {
  const { slug } = await params;
  const unit = getUnit(slug);
  if (!unit) notFound();

  const locale = (await getLocale()) as Locale;
  const tUnits = await getTranslations('Units');
  const browseT = await getTranslations('Browse');
  
  const [startups, counts] = await Promise.all([
    getVerifiedByUnit(slug, locale),
    countVerifiedByUnit()
  ]);
  
  const similar = buildSimilarMap(startups);
  const unitName = unit.name[locale] || unit.name.en;
  const unitDesc = unit.description[locale] || unit.description.en;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <Reveal className="mt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink/40">{unit.code}</p>
            <h1 className="mt-2 text-[26px] font-semibold leading-[34px] text-ink">{unitName}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/70">{unitDesc}</p>
          </div>
          <div className="text-sm text-ink/60">
            {counts[slug] ?? 0} {counts[slug] === 1 ? 'project' : 'projects'}
          </div>
        </div>
      </Reveal>

      {startups.length === 0 ? (
        <Reveal className="mt-10 rounded-[12px] border border-line bg-paper/70 p-8 text-center">
          <p className="text-sm text-ink/60">{tUnits('empty')}</p>
        </Reveal>
      ) : (
        <ResultsGrid preset="ledger" className="mt-10">
          {startups.map((startup) => (
            <StartupRow key={startup.id} startup={startup} similar={similar[startup.id]} />
          ))}
        </ResultsGrid>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Verify routes compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/units/page.tsx src/app/[locale]/unit/[slug]/page.tsx
git commit -m "feat: add units and unit routes"
```

---

### Task 5: Update homepage to show units instead of domains

**Files:**
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `UNITS`, `UnitCard`, `countVerifiedByUnit`
- Produces: homepage showing units grid

- [ ] **Step 1: Update imports and logic**

Replace:
```typescript
import { getLocale, getTranslations } from 'next-intl/server';
import { Hero } from '@/components/Hero';
import { MethodNote } from '@/components/MethodNote';
import { DomainCard } from '@/components/DomainCard';
import { StartupRow } from '@/components/StartupRow';
import { ResultsGrid } from '@/components/ResultsGrid';
import { MarqueeStrip } from '@/components/MarqueeStrip';
import { Reveal } from '@/components/Reveal';
import { DOMAINS } from '@/data/domains';
import { getVerifiedStartups, countVerifiedByDomain, getPublicStats } from '@/lib/public-startups';
import { buildSimilarMap } from '@/lib/similar';
import type { Locale } from '@/i18n/routing';
```

With:
```typescript
import { getLocale, getTranslations } from 'next-intl/server';
import { Hero } from '@/components/Hero';
import { MethodNote } from '@/components/MethodNote';
import { UnitCard } from '@/components/UnitCard';
import { StartupRow } from '@/components/StartupRow';
import { ResultsGrid } from '@/components/ResultsGrid';
import { MarqueeStrip } from '@/components/MarqueeStrip';
import { Reveal } from '@/components/Reveal';
import { UNITS } from '@/data/units';
import { getVerifiedStartups, countVerifiedByUnit, getPublicStats } from '@/lib/public-startups';
import { buildSimilarMap } from '@/lib/similar';
import type { Locale } from '@/i18n/routing';
```

- [ ] **Step 2: Update translations and data fetching**

```typescript
export default async function HomePage() {
  const t = await getTranslations('Units');
  const browseT = await getTranslations('Browse');
  const locale = (await getLocale()) as Locale;
  const verified = await getVerifiedStartups(locale);
  const counts = await countVerifiedByUnit();
  const stats = await getPublicStats();
  // ... rest same
```

- [ ] **Step 3: Replace domains section with units section**

Replace the section starting at line ~35-50:
```typescript
      <section id="units" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <Reveal className="mt-6 flex flex-wrap items-baseline justify-between gap-2 pb-4">
          <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('title')}</h2>
          <p className="text-sm text-ink/60">{t('subtitle')}</p>
        </Reveal>

        <ResultsGrid preset="domains" className="mt-8">
          {UNITS.map((unit) => (
            <UnitCard
              key={unit.slug}
              unit={unit}
              count={counts[unit.slug] ?? 0}
            />
          ))}
        </ResultsGrid>
        // ... rest same
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat: replace domains with units on homepage"
```

---

### Task 6: Update Navbar and translations

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`
- Modify: `messages/ar.json`

**Interfaces:**
- Consumes: translations
- Produces: updated navbar links and translations

- [ ] **Step 1: Update Navbar.tsx**

Change links array:
```typescript
const links = [
  { href: '/' as const, label: t('home'), active: pathname === '/' },
  { href: '/browse' as const, label: t('browse'), active: pathname.startsWith('/browse') },
  { href: '/saved' as const, label: t('saved'), active: pathname.startsWith('/saved') },
  { href: '/units' as const, label: t('units'), active: pathname.startsWith('/unit') || pathname === '/units' }
];
```

- [ ] **Step 2: Update messages/en.json**

In Navbar section, replace `"domains": "Domains"` with `"units": "Units"`. Add Units section:
```json
"Units": {
  "title": "Explore by units",
  "subtitle": "University incubation units and their projects.",
  "explore": "Explore",
  "empty": "No projects assigned to this unit yet."
}
```

Also update Footer if needed (optional).

- [ ] **Step 3: Update messages/fr.json**

In Navbar: `"domains": "Domaines"` -> `"units": "Unités"`. Add Units section:
```json
"Units": {
  "title": "Explorer par unités",
  "subtitle": "Unités d'incubation universitaire et leurs projets.",
  "explore": "Explorer",
  "empty": "Aucun projet assigné à cette unité pour le moment."
}
```

- [ ] **Step 4: Update messages/ar.json**

In Navbar: need to find domains key and replace. Add Units section:
```json
"Units": {
  "title": "استكشاف حسب الوحدات",
  "subtitle": "وحدات الحاضنة الجامعية ومشاريعها.",
  "explore": "استكشاف",
  "empty": "لا توجد مشاريع مسجلة في هذه الوحدة بعد."
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/Navbar.tsx messages/en.json messages/fr.json messages/ar.json
git commit -m "feat: update navbar to units and add translations"
```

---

### Task 7: Propose startup-to-unit migration mapping

**Files:**
- Create: `scripts/migrate-units-mapping.md` or just document in plan
- Read: `db/startup_ideas_dz.sql` to understand current data

**Interfaces:**
- Consumes: startup data
- Produces: proposed mapping for review

- [ ] **Step 1: Extract startup list from DB dump or query**

Look at startups in the SQL dump to see domains and names. Based on the units:
- CDE: pre-incubation/training focused
- Business Incubator: acceleration/incubation
- CATI: IP/patents/tech transfer
- BLUE/BLEU: industry liaison/internships
- One-Stop Shop: business creation/admin

But we need to assign based on actual data. Let us look up a few examples from the dump:
- badis-ai (ai-computing) - likely CATI or Incubator
- lablabee (cloud-iot) - likely Incubator/CATI

This is a judgment call. Create a proposed mapping file.

- [ ] **Step 2: Create migration proposal**

Create `scripts/unit-migration-proposal.json` with proposed assignments:
```json
{
  "proposed": [
    {"id": "badis-ai", "currentDomain": "ai-computing", "proposedUnit": "cati", "reason": "AI/software IP focused"},
    {"id": "lablabee", "currentDomain": "cloud-iot", "proposedUnit": "business-incubator", "reason": "EdTech incubation"}
  ],
  "note": "Review and adjust before applying migration"
}
```

But better to generate from actual data. Let us read more of the startups data.

- [ ] **Step 3: Generate actual mapping from SQL dump**

Scan all startups from the dump and propose assignments. This is manual analysis based on domain and description.

I'll create the proposal file after reviewing more data.

- [ ] **Step 4: Commit proposal (for review)**

```bash
git add scripts/unit-migration-proposal.json
git commit -m "docs: add proposed unit migration mapping for review"
```

---

### Task 8: Apply database migration (after review)

**Files:**
- Create migration SQL: `sql/migrate_add_unit_slug.sql`

**Interfaces:**
- Consumes: proposal from Task 7
- Produces: schema change + data migration

- [ ] **Step 1: Create migration SQL**

```sql
-- Add unit_slug column
ALTER TABLE startups ADD COLUMN IF NOT EXISTS unit_slug text;

-- Create index
CREATE INDEX IF NOT EXISTS idx_startups_unit_slug ON startups(unit_slug);

-- Update assignments (example - will be filled from approved proposal)
-- UPDATE startups SET unit_slug = 'cati' WHERE id = 'badis-ai';
-- etc.
```

- [ ] **Step 2: Apply migration to local DB (if exists)**

Check if DB is running and apply. Or just document.

- [ ] **Step 3: Commit migration**

```bash
git add sql/migrate_add_unit_slug.sql
git commit -m "feat: add unit_slug migration"
```

---

### Task 9: Update admin panel to support unit_slug

**Files:**
- Modify: `src/lib/admin.ts`
- Modify: admin UI components if needed

**Interfaces:**
- Consumes: unit_slug
- Produces: admin can view/edit unit_slug

- [ ] **Step 1: Update admin queries to include unit_slug**

In `getStartupForAdminById` and `listStartupsForAdmin`, add `unit_slug` to SELECT.

- [ ] **Step 2: Update createStartup/updateStartup to handle unit_slug**

Add unit_slug to input and INSERT/UPDATE.

- [ ] **Step 3: Update mapAdminStartup if needed**

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin.ts
git commit -m "feat: add unit_slug support in admin"
```

---

### Task 10: Build and test

**Files:**
- None (verification only)

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run linter**

Run: `npx eslint src`
Expected: 0 warnings/errors (or as per project standards)

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All tests pass (or same as before)

- [ ] **Step 4: Try to build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit any fixes if needed**

If there are issues, fix and commit.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-28-university-units-implementation.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
