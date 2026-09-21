'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Startup } from '@/data/startups';
import { useStartupFilters } from '@/hooks/useStartupFilters';
import { StartupRow } from '@/components/StartupRow';
import { FilterPanel } from '@/components/FilterPanel';
import { ResultsGrid } from '@/components/ResultsGrid';
import { buildSimilarMap } from '@/lib/similar';

export function DomainExplorer({ startups }: { startups: Startup[] }) {
  const t = useTranslations('Filters');
  const locale = useLocale();
  const fmt = new Intl.NumberFormat(locale);
  const filters = useStartupFilters(startups);
  const similar = useMemo(() => buildSimilarMap(filters.filtered), [filters.filtered]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const hasActive = filters.activeCount > 0;
  const resultsLabel = t('entries', { count: filters.filtered.length });

  return (
    <div className="mt-10 grid grid-guard items-start gap-0 lg:grid-cols-[200px_1fr]">
      <aside className="hidden rounded-xl bg-surface/50 pe-8 lg:sticky lg:top-14 lg:block">
        <h2 className="text-sm font-semibold text-ink/80">{t('indexLabel')}</h2>
        <div className="mt-6">
          <FilterPanel filters={filters} />
        </div>
      </aside>

      <div className="min-w-0 lg:ps-8">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-11 items-center gap-2 rounded-[6px] bg-signal px-5 text-sm font-medium text-paper ring-focus transition-[background-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90 active:scale-[0.99] motion-reduce:active:scale-100"
          >
            {t('title')}
            {hasActive && <span className="font-mono">{fmt.format(filters.activeCount)}</span>}
          </button>
          {hasActive && (
            <button
              type="button"
              onClick={filters.clearAll}
              className="text-sm text-signal underline underline-offset-2"
            >
              {t('clear')}
            </button>
          )}
        </div>

        <label className="block">
          <input
            type="search"
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="w-full rounded-[6px] field-glass ring-focus px-2.5 py-2 text-base text-ink placeholder:text-ink/40 transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)]"
          />
        </label>

        <div className="mt-6 flex items-baseline justify-between gap-3 pb-4">
          <p className="text-sm text-ink/60">{resultsLabel}</p>
          {hasActive && (
            <button
              type="button"
              onClick={filters.clearAll}
              className="text-sm text-signal underline underline-offset-2"
            >
              {t('clear')}
            </button>
          )}
        </div>

        {filters.filtered.length > 0 ? (
          <ResultsGrid preset="cards" className="mt-8">
            {filters.filtered.map((startup) => (
              <StartupRow key={startup.id} startup={startup} similar={similar[startup.id]} />
            ))}
          </ResultsGrid>
        ) : (
          <div className="py-16">
            <p className="text-base text-ink/70">{t('emptyTitle')}.</p>
            <button
              type="button"
              onClick={filters.clearAll}
              className="mt-3 inline-block text-sm text-signal underline underline-offset-2"
            >
              {t('clear')}
            </button>
          </div>
        )}
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-surface p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between pb-3">
              <h2 className="text-lg font-semibold text-ink">{t('title')}</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t('close')}
                className="p-1 text-ink/60 hover:text-ink"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <FilterPanel filters={filters} />
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-6 h-11 w-full rounded-[6px] bg-signal text-sm font-medium text-paper ring-focus transition-[background-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90 active:scale-[0.99] motion-reduce:active:scale-100"
            >
              {t('showResults')}: {resultsLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}