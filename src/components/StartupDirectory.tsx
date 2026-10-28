import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DOMAINS } from '@/data/domains';
import { StartupRow } from '@/components/StartupRow';
import { ResultsGrid } from '@/components/ResultsGrid';
import { buildSimilarMap } from '@/lib/similar';
import type { PublicStartup } from '@/lib/db';

export interface DirectoryParams {
  q: string;
  domain: string;
  country: string;
  priority: string;
  from: string;
  to: string;
}

function buildQuery(params: DirectoryParams, page?: number): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.domain && params.domain !== 'all') search.set('domain', params.domain);
  if (params.country && params.country !== 'all') search.set('country', params.country);
  if (params.priority && params.priority !== 'all') search.set('priority', params.priority);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (page && page > 1) search.set('page', String(page));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const control =
  'ring-focus w-full rounded-[6px] field-glass px-2.5 py-1.5 text-sm text-ink placeholder:text-ink/40 transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)]';
const label = 'text-xs font-medium text-ink/60';

export async function StartupDirectory({
  startups,
  total,
  page,
  pageCount,
  params,
  facets,
  basePath,
  lockedDomain = false
}: {
  startups: PublicStartup[];
  total: number;
  page: number;
  pageCount: number;
  params: DirectoryParams;
  facets: { countries: string[]; minYear: number; maxYear: number };
  basePath: string;
  lockedDomain?: boolean;
}) {
  const t = await getTranslations('Browse');
  const filtersT = await getTranslations('Filters');
  const domainNames = await getTranslations('domainNames');
  const similar = buildSimilarMap(startups);

  const years: number[] = [];
  for (let y = facets.maxYear; y >= facets.minYear; y -= 1) years.push(y);

  return (
    <div className="mt-6">
      <form action={basePath} method="get" className="rounded-[10px] border border-line/50 p-3 sm:p-4">
        {lockedDomain && <input type="hidden" name="domain" value={params.domain} />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="dir-q" className={label}>
              {filtersT('search')}
            </label>
            <input
              id="dir-q"
              name="q"
              type="search"
              defaultValue={params.q}
              placeholder={t('searchPlaceholder')}
              className={`mt-1 ${control}`}
            />
          </div>

          {!lockedDomain && (
            <div>
              <label htmlFor="dir-domain" className={label}>
                {t('filterLabel')}
              </label>
              <select id="dir-domain" name="domain" defaultValue={params.domain || 'all'} className={`mt-1 ${control}`}>
                <option value="all">{t('allDomains')}</option>
                {DOMAINS.map((domain) => (
                  <option key={domain.slug} value={domain.slug}>
                    {domainNames(domain.slug)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="dir-country" className={label}>
              {filtersT('country')}
            </label>
            <select id="dir-country" name="country" defaultValue={params.country || 'all'} className={`mt-1 ${control}`}>
              <option value="all">{t('allCountries')}</option>
              {facets.countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dir-priority" className={label}>
              {filtersT('priority')}
            </label>
            <select id="dir-priority" name="priority" defaultValue={params.priority || 'all'} className={`mt-1 ${control}`}>
              <option value="all">{t('allPriorities')}</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div>
            <label htmlFor="dir-from" className={label}>
              {filtersT('from')} {filtersT('years')}
            </label>
            <select id="dir-from" name="from" defaultValue={params.from || 'all'} className={`mt-1 ${control}`}>
              <option value="all">—</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dir-to" className={label}>
              {filtersT('to')} {filtersT('years')}
            </label>
            <select id="dir-to" name="to" defaultValue={params.to || 'all'} className={`mt-1 ${control}`}>
              <option value="all">—</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="ring-focus rounded-[3px] border border-signal bg-signal px-3 py-1.5 text-sm font-medium text-paper transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)] active:scale-[0.99] motion-reduce:active:scale-100"
          >
            {t('searchButton')}
          </button>
          <Link
            href={basePath}
            className="ring-focus rounded-[3px] px-2 py-1.5 text-sm text-ink/60 underline underline-offset-2 hover:text-ink"
          >
            {t('clear')}
          </Link>
        </div>
      </form>

      <p className="mt-6 font-mono text-xs uppercase tracking-wide text-ink/50">
        {t('results', { count: total })}
      </p>

      {startups.length === 0 ? (
        <div className="mt-6 rounded-[10px] border border-line/50 p-8 text-center">
          <p className="text-base font-medium text-ink">{t('emptyTitle')}</p>
          <p className="mt-1 text-sm text-ink/60">{t('emptyText')}</p>
        </div>
      ) : (
        <ResultsGrid preset="directory" className="mt-4">
          {startups.map((startup) => (
            <StartupRow key={startup.id} startup={startup} similar={similar[startup.id]} />
          ))}
        </ResultsGrid>
      )}

      {pageCount > 1 && (
        <nav aria-label={t('title')} className="mt-8 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link
              href={`${basePath}${buildQuery(params, page - 1)}`}
              className="ring-focus rounded-[3px] border border-line/60 px-3 py-1.5 text-sm text-ink/70 hover:text-ink"
            >
              <span aria-hidden>←</span> {t('previous')}
            </Link>
          ) : (
            <span aria-hidden className="px-3 py-1.5 text-sm text-ink/25">
              <span aria-hidden>←</span> {t('previous')}
            </span>
          )}

          <span dir="ltr" className="font-mono text-xs tabular-nums text-ink/50">
            {t('page', { page, total: pageCount })}
          </span>

          {page < pageCount ? (
            <Link
              href={`${basePath}${buildQuery(params, page + 1)}`}
              className="ring-focus rounded-[3px] border border-line/60 px-3 py-1.5 text-sm text-ink/70 hover:text-ink"
            >
              {t('next')} <span aria-hidden>→</span>
            </Link>
          ) : (
            <span aria-hidden className="px-3 py-1.5 text-sm text-ink/25">
              {t('next')} <span aria-hidden>→</span>
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
