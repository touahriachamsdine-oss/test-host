import { getTranslations } from 'next-intl/server';
import { Search } from 'lucide-react';
import { DOMAINS } from '@/data/domains';
import { searchVerifiedStartups } from '@/lib/public-startups';
import { getMemberSavedIdsSafe } from '@/lib/savedIds';
import { buildSimilarMap } from '@/lib/similar';
import { StartupRow } from '@/components/StartupRow';
import { ResultsGrid } from '@/components/ResultsGrid';
import { SavedProvider } from '@/components/SavedProvider';
import { Link, getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({
  searchParams,
  params
}: {
  searchParams: Promise<{ q?: string; domain?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations('Browse');
  const names = await getTranslations('domainNames');
  const { locale } = await params;
  const sp = await searchParams;
  const query = sp.q ?? '';
  const domain = sp.domain ?? 'all';
  const action = getPathname({ locale, href: '/browse' });

  const startups = await searchVerifiedStartups(query, domain, locale as Locale);
  const similar = buildSimilarMap(startups);
  const count = startups.length;
  const initialIds = await getMemberSavedIdsSafe();

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="pb-6">
        <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-ink/60">{t('subtitle')}</p>
      </header>

      <form
        action={action}
        method="get"
        className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <label className="relative flex-1">
          <Search
            size={16}
            className="absolute start-2 top-1/2 -translate-y-1/2 text-ink/40"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="w-full rounded-[6px] field-glass ring-focus py-2 ps-7 pe-2 text-base text-ink placeholder:text-ink/40 transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)]"
          />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">{t('filterLabel')}</span>
          <select
            name="domain"
            defaultValue={domain}
            className="w-full rounded-[6px] field-glass ring-focus px-2.5 py-2 text-base text-ink transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)]"
          >
            <option value="all">{t('allDomains')}</option>
            {DOMAINS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {names(d.slug)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-11 whitespace-nowrap rounded-xl bg-signal px-5 text-sm font-medium text-paper ring-focus shadow-[0_12px_26px_-14px_var(--signal)] transition-[background-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90 active:scale-[0.98] motion-reduce:active:scale-100"
        >
          {t('searchButton')}
        </button>
      </form>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2 pb-4">
        <p className="text-sm text-ink/60">{t('entries', { count })}</p>
        {(query || domain !== 'all') && (
          <Link href="/browse" className="text-sm text-signal underline underline-offset-2">
            {t('clear')} {query ? `“${query}”` : ''}
          </Link>
        )}
      </div>

      {count > 0 ? (
        <SavedProvider initialIds={initialIds}>
          <ResultsGrid preset="ledger" className="mt-8">
            {startups.map((startup) => (
              <StartupRow key={startup.id} startup={startup} similar={similar[startup.id]} />
            ))}
          </ResultsGrid>
        </SavedProvider>
      ) : (
        <div className="py-16">
          <p className="text-base text-ink/70">{t('emptyTitle')}.</p>
          <Link
            href="/browse"
            className="mt-3 inline-block text-sm text-signal underline underline-offset-2"
          >
            {t('clear')}
          </Link>
        </div>
      )}
    </section>
  );
}