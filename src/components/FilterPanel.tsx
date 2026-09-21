'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useStartupFilters } from '@/hooks/useStartupFilters';

export type StartupFilterState = ReturnType<typeof useStartupFilters>;

const priorityOptions = ['A', 'B', 'C'] as const;

const priorityMark: Record<string, { active: string; idle: string }> = {
  A: {
    active: 'border-signal bg-signal text-paper',
    idle: 'border-ink/40 text-ink/60'
  },
  B: {
    active: 'border-flag-gold bg-flag-gold text-paper',
    idle: 'border-ink/40 text-ink/60'
  },
  C: {
    active: 'border-ink bg-ink text-paper',
    idle: 'border-ink/40 text-ink/60'
  }
};

const sectionLabel = 'text-xs font-medium text-ink/60';

export function FilterPanel({ filters }: { filters: StartupFilterState }) {
  const t = useTranslations('Filters');
  const priorityT = useTranslations('Priority');
  const locale = useLocale();
  const fmt = new Intl.NumberFormat(locale);
  const [countryQuery, setCountryQuery] = useState('');

  const visibleCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return filters.availableCountries;
    return filters.availableCountries.filter((c) => c.toLowerCase().includes(q));
  }, [countryQuery, filters.availableCountries]);

  const span = filters.maxYear - filters.minYear || 1;
  const minPct = ((filters.yearRange.min - filters.minYear) / span) * 100;
  const maxPct = ((filters.yearRange.max - filters.minYear) / span) * 100;

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className={sectionLabel}>{t('country')}</legend>
        <input
          type="search"
          value={countryQuery}
          onChange={(e) => setCountryQuery(e.target.value)}
          placeholder={t('searchCountries')}
          aria-label={t('searchCountries')}
          className="mt-3 w-full rounded-[6px] field-glass ring-focus px-2.5 py-1.5 text-sm text-ink placeholder:text-ink/40 transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)]"
        />
        <div className="mt-3 flex flex-col gap-2">
          {visibleCountries.length === 0 && (
            <p className="text-sm text-ink/40">{t('noCountries')}</p>
          )}
          {visibleCountries.map((country) => (
            <label
              key={country}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-ink/80"
            >
              <input
                type="checkbox"
                checked={filters.countries.includes(country)}
                onChange={() => filters.toggleCountry(country)}
                className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-ink/40 accent-signal"
              />
              {country}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={sectionLabel}>{t('priority')}</legend>
        <div className="mt-3 flex items-center gap-2">
          {priorityOptions.map((p) => {
            const active = filters.priorities.includes(p);
            const style = active ? priorityMark[p].active : priorityMark[p].idle;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                aria-label={priorityT(p)}
                onClick={() => filters.togglePriority(p)}
                className={`flex h-5 w-5 items-center justify-center rounded-[3px] border font-mono text-[10px] transition-colors duration-100 ${style}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={sectionLabel}>{t('years')}</legend>
        <div dir="ltr" className="mt-3">
          <div className="mb-3 flex items-center justify-between font-mono text-sm text-ink/80">
            <span>{fmt.format(filters.yearRange.min)}</span>
            <span>{fmt.format(filters.yearRange.max)}</span>
          </div>
          <div className="relative h-5">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-line" />
            <div
              className="absolute top-1/2 h-px -translate-y-1/2 bg-signal"
              style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
            />
            <input
              type="range"
              min={filters.minYear}
              max={filters.maxYear}
              value={filters.yearRange.min}
              onChange={(e) => filters.setYearMin(Number(e.target.value))}
              aria-label={`${t('from')} ${t('years')}`}
              className="range-input"
            />
            <input
              type="range"
              min={filters.minYear}
              max={filters.maxYear}
              value={filters.yearRange.max}
              onChange={(e) => filters.setYearMax(Number(e.target.value))}
              aria-label={`${t('to')} ${t('years')}`}
              className="range-input"
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}