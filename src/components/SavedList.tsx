'use client';

import { useTranslations } from 'next-intl';
import type { Startup } from '@/data/startups';
import { Link } from '@/i18n/navigation';
import { useSaved } from './SavedProvider';
import { StartupRow } from '@/components/StartupRow';
import { ResultsGrid } from '@/components/ResultsGrid';
import { SaveButton } from '@/components/SaveButton';

export function SavedList({ startups }: { startups: Startup[] }) {
  const t = useTranslations('Saved');
  const { ids } = useSaved();
  const savedIds = new Set(ids);
  const rows = startups.filter((startup) => savedIds.has(startup.id));

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="pb-6">
        <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-ink/60">{t('subtitle')}</p>
      </header>

      {rows.length === 0 ? (
        <div className="py-16">
          <p className="max-w-xl text-base text-ink/70">{t('emptyText')}</p>
          <Link
            href="/browse"
            className="mt-3 inline-block text-sm text-signal underline underline-offset-2"
          >
            {t('browse')}
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-ink/60">{t('count', { count: rows.length })}</p>
          <ResultsGrid className="mt-8">
            {rows.map((startup) => (
              <div key={startup.id} className="flex flex-col gap-2">
                <StartupRow startup={startup} />
                <SaveButton id={startup.id} />
              </div>
            ))}
          </ResultsGrid>
        </>
      )}
    </section>
  );
}