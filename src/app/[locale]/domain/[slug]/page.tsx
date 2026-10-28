import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getDomain } from '@/data/domains';
import { referenceCode } from '@/lib/reference';
import { browseStartups, getDirectoryFacets, getDomainMeta } from '@/lib/public-startups';
import { getMemberSavedIdsSafe } from '@/lib/savedIds';
import { StartupDirectory, type DirectoryParams } from '@/components/StartupDirectory';
import { SavedProvider } from '@/components/SavedProvider';
import { Link, getPathname } from '@/i18n/navigation';
import { alternatesFor } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

interface DomainSearchParams {
  q?: string;
  country?: string;
  priority?: string;
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

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) return {};
  const names = await getTranslations('domainNames');
  return { title: names(slug), alternates: alternatesFor(`/domain/${slug}`) };
}

export default async function DomainPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<DomainSearchParams>;
}) {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const names = await getTranslations('domainNames');
  const browseT = await getTranslations('Browse');
  const validationT = await getTranslations('DomainValidation');
  const locale = (await getLocale()) as Locale;
  const sp = await searchParams;

  const filters: DirectoryParams = {
    q: (sp.q ?? '').trim(),
    domain: slug,
    country: sp.country ?? 'all',
    priority: sp.priority ?? 'all',
    from: sp.from ?? 'all',
    to: sp.to ?? 'all',
    sort: sp.sort ?? 'default'
  };
  const page = Math.max(Number(sp.page ?? 1) || 1, 1);

  const [result, facets, meta, initialIds] = await Promise.all([
    browseStartups(
      {
        q: filters.q,
        domain: slug,
        country: filters.country,
        priority: filters.priority,
        yearMin: toYear(filters.from),
        yearMax: toYear(filters.to),
        sort: filters.sort
      },
      page,
      locale
    ),
    getDirectoryFacets(),
    getDomainMeta(slug),
    getMemberSavedIdsSafe()
  ]);

  const tiers: Record<string, 'border-signal bg-signal' | 'border-flag-gold bg-flag-gold' | 'border-ink/50'> = {
    A: 'border-signal bg-signal',
    B: 'border-flag-gold bg-flag-gold',
    C: 'border-ink/50'
  };

  return (
    <section className="mx-auto grid max-w-6xl grid-guard px-4 pb-16 pt-10 sm:px-6">
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 rounded-[3px] text-sm text-ink/60 underline underline-offset-2 ring-focus transition-[color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-ink active:scale-[0.99] motion-reduce:active:scale-100"
      >
        <span aria-hidden>←</span>
        {browseT('title')}
      </Link>

      <header className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-5">
        <span dir="ltr" className="font-mono text-sm font-medium leading-5 text-signal">
          {referenceCode(slug)}
        </span>
        <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {names(slug)}
        </h1>
      </header>
      <p className="mt-1 text-sm text-ink/60">
        {browseT('entries', { count: result.total })}
        {meta && (
          <span className="ms-3 inline-flex items-center gap-2 text-ink/50">
            <span>{validationT('label')}: {validationT(meta.validationStatus as never)}</span>
            {meta.priorityTier && tiers[meta.priorityTier] && (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className={`h-3 w-3 rounded-[3px] border ${tiers[meta.priorityTier]}`} />
                {validationT('tier')} {meta.priorityTier}
              </span>
            )}
          </span>
        )}
      </p>

      <SavedProvider initialIds={initialIds}>
        <StartupDirectory
          startups={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          params={filters}
          facets={facets}
          basePath={getPathname({ locale, href: `/domain/${slug}` })}
          lockedDomain
        />
      </SavedProvider>
    </section>
  );
}
