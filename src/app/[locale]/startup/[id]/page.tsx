import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ExternalLink } from 'lucide-react';
import { getVerifiedById } from '@/lib/public-startups';
import { getMemberSavedIdsSafe } from '@/lib/savedIds';
import { getDomain } from '@/data/domains';
import { referenceCode } from '@/lib/reference';
import type { StartupPriority } from '@/data/startups';
import { Link } from '@/i18n/navigation';
import { SaveButton } from '@/components/SaveButton';
import { SavedProvider } from '@/components/SavedProvider';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const prioritySquare: Record<StartupPriority, string> = {
  A: 'border-signal bg-signal',
  B: 'border-flag-gold bg-flag-gold',
  C: 'border-ink/50'
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const startup = await getVerifiedById(id, locale);
  if (!startup) return {};
  return { title: startup.name, description: startup.shortDescription };
}

export default async function StartupPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const startup = await getVerifiedById(id, locale);
  if (!startup) notFound();

  const t = await getTranslations('StartupDetail');
  const names = await getTranslations('domainNames');
  const priorityT = await getTranslations('Priority');

  const domain = getDomain(startup.domain);
  const year = startup.yearFounded > 0
    ? new Intl.NumberFormat(locale, { useGrouping: false }).format(startup.yearFounded)
    : '';
  const code = referenceCode(startup.domain, startup.refNo);
  const initialIds = await getMemberSavedIdsSafe();

  const fields = [
    ...(year ? [{ label: t('yearLabel'), value: year }] : []),
    { label: t('countryLabel'), value: startup.country },
    { label: t('domainLabel'), value: names(startup.domain) },
    ...(startup.subDomain ? [{ label: t('subDomainLabel'), value: startup.subDomain }] : []),
    { label: t('technologyLabel'), value: startup.technology },
    { label: t('priorityLabel'), value: priorityT(startup.priority) },
    ...(startup.teamName ? [{ label: t('teamLabel'), value: startup.teamName }] : [])
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/50"
      >
        <Link href="/browse" className="text-signal underline underline-offset-2 hover:text-ink">
          {t('backToBrowse')}
        </Link>
        <span aria-hidden>{t('breadcrumbSeparator')}</span>
        <Link
          href={`/domain/${startup.domain}`}
          className="text-signal underline underline-offset-2 hover:text-ink"
        >
          {names(startup.domain)}
        </Link>
        <span aria-hidden>{t('breadcrumbSeparator')}</span>
        <span className="truncate font-medium text-ink">{startup.name}</span>
      </nav>

      <header className="mt-8 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {domain ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-signal/10 text-signal">
                <domain.icon size={20} aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <span dir="ltr" className="font-mono text-sm font-medium leading-5 text-signal">
                {code}
              </span>
              <h1 className="mt-1 text-[32px] font-semibold leading-10 tracking-tight text-ink">
                {startup.name}
              </h1>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <span
              aria-hidden
              className={`h-3.5 w-3.5 rounded-[3px] border ${prioritySquare[startup.priority]}`}
            />
            <span className="sr-only">{priorityT(startup.priority)}</span>
          </span>
        </div>
        <p className="mt-2 text-sm text-ink/60">
          {startup.country}
          {year ? `, ${year}` : ''}
        </p>
      </header>

      <p className="mt-6 max-w-2xl text-base leading-[26px] text-ink/80">
        {startup.shortDescription}
      </p>

      <div className="mt-6">
        <SavedProvider initialIds={initialIds}>
          <SaveButton id={startup.id} />
        </SavedProvider>
      </div>

      <div className="card-soft mt-10 max-w-2xl divide-y divide-line/40 p-2 sm:p-3">
        <dl>
          {fields.map((f) => (
            <div
              key={f.label}
              className="grid grid-cols-[9rem_1fr] gap-4 px-4 py-3 text-sm"
            >
              <dt className="text-ink/50">{f.label}</dt>
              <dd className="text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="text-sm font-medium text-ink">{t('whyRelevantLabel')}</h2>
        <p className="mt-2 text-base leading-[26px] text-ink/80">{startup.whyRelevant}</p>
      </div>

      {(startup.officialSite || startup.sourceUrl) && (
        <div className="mt-10 flex max-w-2xl flex-wrap gap-6 pt-6 text-sm">
          {startup.officialSite && (
            <a
              href={startup.officialSite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-signal underline underline-offset-2 hover:text-ink"
            >
              {t('officialSiteLabel')}
              <ExternalLink size={14} aria-hidden />
            </a>
          )}
          {startup.sourceUrl && (
            <a
              href={startup.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink/60 underline underline-offset-2 hover:text-ink"
            >
              {t('sourceLabel')}
              <ExternalLink size={14} aria-hidden />
            </a>
          )}
        </div>
      )}
    </section>
  );
}