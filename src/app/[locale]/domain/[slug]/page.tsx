import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getDomain } from '@/data/domains';
import { referenceCode } from '@/lib/reference';
import { getVerifiedByDomain, getDomainMeta } from '@/lib/public-startups';
import { getMemberSavedIdsSafe } from '@/lib/savedIds';
import { DomainExplorer } from '@/components/DomainExplorer';
import { SavedProvider } from '@/components/SavedProvider';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) return {};
  const names = await getTranslations('domainNames');
  return { title: names(slug) };
}

export default async function DomainPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const names = await getTranslations('domainNames');
  const domainsT = await getTranslations('Domains');
  const browseT = await getTranslations('Browse');
  const validationT = await getTranslations('DomainValidation');
  const locale = (await getLocale()) as Locale;
  const startups = await getVerifiedByDomain(slug, locale);
  const meta = await getDomainMeta(slug);
  const initialIds = await getMemberSavedIdsSafe();

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
      <p className="mt-3 text-sm text-ink/60">
        {domainsT('count', { count: startups.length })}
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
        <DomainExplorer startups={startups} />
      </SavedProvider>
    </section>
  );
}