import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UNITS, unitCount } from '@/data/units';
import { countVerifiedByDomain } from '@/lib/public-startups';
import { UnitCard } from '@/components/UnitCard';
import { UnitNav } from '@/components/UnitNav';
import { ResultsGrid } from '@/components/ResultsGrid';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Units');
  return { title: t('title') };
}

export default async function UnitsPage() {
  const t = await getTranslations('Units');
  const counts = await countVerifiedByDomain();

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="pb-5">
        <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/60">{t('subtitle')}</p>
      </header>

      <UnitNav />

      <ResultsGrid preset="units" className="mt-8">
        {UNITS.map((unit) => (
          <UnitCard key={unit.slug} unit={unit} count={unitCount(unit, counts)} />
        ))}
      </ResultsGrid>
    </section>
  );
}
