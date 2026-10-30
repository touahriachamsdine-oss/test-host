import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { browseStartups, getDirectoryFacets } from '@/lib/public-startups';
import { getMemberSavedIdsSafe } from '@/lib/savedIds';
import { SavedProvider } from '@/components/SavedProvider';
import { StartupDirectory, type DirectoryParams } from '@/components/StartupDirectory';
import { getPathname } from '@/i18n/navigation';
import { alternatesFor } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Browse');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: alternatesFor('/browse')
  };
}

interface BrowseSearchParams {
  q?: string;
  domain?: string;
  country?: string;
  priority?: string;
  buildable?: string;
  from?: string;
  to?: string;
  page?: string;
  sort?: string;
}

function toYear(value?: string): number | undefined {
  if (!value || value === 'all') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function BrowsePage({
  searchParams,
  params
}: {
  searchParams: Promise<BrowseSearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations('Browse');
  const { locale } = await params;
  const sp = await searchParams;

  const filters: DirectoryParams = {
    q: (sp.q ?? '').trim(),
    domain: sp.domain ?? 'all',
    country: sp.country ?? 'all',
    priority: sp.priority ?? 'all',
    from: sp.from ?? 'all',
    to: sp.to ?? 'all',
    sort: sp.sort ?? 'default',
    buildable: sp.buildable ?? 'all'
  };
  const page = Math.max(Number(sp.page ?? 1) || 1, 1);

  const [result, facets, initialIds] = await Promise.all([
    browseStartups(
      {
        q: filters.q,
        domain: filters.domain,
        country: filters.country,
        priority: filters.priority,
        yearMin: toYear(filters.from),
        yearMax: toYear(filters.to),
        sort: filters.sort,
        buildable: filters.buildable
      },
      page,
      locale as Locale
    ),
    getDirectoryFacets(),
    getMemberSavedIdsSafe()
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="pb-4">
        <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-ink/60">{t('subtitle')}</p>
      </header>

      <SavedProvider initialIds={initialIds}>
        <StartupDirectory
          startups={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          params={filters}
          facets={facets}
          basePath={getPathname({ locale, href: '/browse' })}
        />
      </SavedProvider>
    </section>
  );
}
