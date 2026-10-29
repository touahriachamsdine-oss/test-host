import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ExternalLink } from 'lucide-react';
import { getVerifiedById } from '@/lib/public-startups';
import { getMemberSavedIdsSafe } from '@/lib/savedIds';
import { getDomain } from '@/data/domains';
import { referenceCode } from '@/lib/reference';
import { sourceKindOf } from '@/lib/source';
import { ipcSections, isIpcClassification } from '@/lib/technology';
import type { StartupPriority } from '@/data/startups';
import { Link } from '@/i18n/navigation';
import { SaveButton } from '@/components/SaveButton';
import { PinButton } from '@/components/PinButton';
import { SavedProvider } from '@/components/SavedProvider';
import { DifficultyMeter } from '@/components/DifficultyMeter';
import { MvpPrompt } from '@/components/MvpPrompt';
import { alternatesFor } from '@/lib/seo';
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
  const alternates = alternatesFor(`/startup/${id}`);
  return {
    title: startup.name,
    description: startup.shortDescription,
    alternates,
    openGraph: {
      title: startup.name,
      description: startup.shortDescription,
      url: alternates.canonical,
      type: 'article'
    }
  };
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
  const sourceT = await getTranslations('Source');
  const ipcT = await getTranslations('Ipc');

  const domain = getDomain(startup.domain);
  const sourceKind = sourceKindOf(startup.id);
  const ipc = isIpcClassification(startup.technology);
  const technologyValue = ipc
    ? ipcSections(startup.technology)
        .map((section) => ipcT(section as never))
        .join(' · ')
    : startup.technology;
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
    { label: t('technologyLabel'), value: technologyValue },
    { label: t('priorityLabel'), value: priorityT(startup.priority) },
    ...(startup.teamName ? [{ label: t('teamLabel'), value: startup.teamName }] : [])
  ];

  const metaLine = [
    ...(startup.hqCity && startup.hqCity !== startup.country ? [startup.hqCity] : []),
    startup.country,
    ...(year ? [year] : [])
  ].join(', ');

  const lat =
    typeof startup.latitude === 'number' && Number.isFinite(startup.latitude)
      ? startup.latitude
      : NaN;
  const lng =
    typeof startup.longitude === 'number' && Number.isFinite(startup.longitude)
      ? startup.longitude
      : NaN;
  const hasMap = Number.isFinite(lat) && Number.isFinite(lng);
  const bbox = hasMap
    ? `${lng - 0.012},${lat - 0.012},${lng + 0.012},${lat + 0.012}`
    : '';
  const mapSrc = hasMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
    : '';
  const mapLink = hasMap
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`
    : '';

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
              <span className="flex flex-wrap items-center gap-2">
                <span dir="ltr" className="font-mono text-sm font-medium leading-5 text-signal">
                  {code}
                </span>
                {sourceKind !== 'curated' && (
                  <span className="rounded-[2px] border border-line/60 px-1.5 font-mono text-[10px] uppercase leading-4 tracking-wide text-ink/50">
                    {sourceT(sourceKind)}
                  </span>
                )}
                {ipc && (
                  <span dir="ltr" className="font-mono text-[10px] uppercase leading-4 tracking-wide text-ink/35">
                    {startup.technology.split(/[;,\s]+/).filter(Boolean).slice(0, 3).join(' ')}
                  </span>
                )}
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
        <p className="mt-2 text-sm text-ink/60">{metaLine}</p>
      </header>

      <p className="mt-6 max-w-2xl text-base leading-[26px] text-ink/80">
        {startup.shortDescription}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SavedProvider initialIds={initialIds}>
          <SaveButton id={startup.id} />
        </SavedProvider>
        <PinButton id={startup.id} />
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

      {startup.algeriaValue && startup.algeriaValue !== startup.whyRelevant && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">{t('algeriaValueLabel')}</h2>
          <p className="mt-2 text-base leading-[26px] text-ink/80">{startup.algeriaValue}</p>
        </div>
      )}

      {startup.mainSellers && startup.mainSellers.length > 0 && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">{t('sellersLabel')}</h2>
          <ul className="mt-2 space-y-1.5">
            {startup.mainSellers.map((seller) => (
              <li key={seller} className="flex items-start gap-2 text-base leading-[26px] text-ink/80">
                <span aria-hidden className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                {seller}
              </li>
            ))}
          </ul>
        </div>
      )}

      {startup.teamRec && startup.teamRec.length > 0 && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">
            {t('teamRecLabel')}
            <span className="ml-2 font-mono text-xs text-ink/50">
              {t('teamTotalLabel', { count: startup.teamRec.reduce((sum, r) => sum + r.count, 0) })}
            </span>
          </h2>
          <ul className="mt-2 space-y-1.5">
            {startup.teamRec.map((r) => (
              <li key={r.role} className="flex items-center gap-2 text-base text-ink/80">
                <span dir="ltr" className="font-mono text-sm text-signal">
                  {r.count}×
                </span>
                {r.role}
              </li>
            ))}
          </ul>
        </div>
      )}

      {startup.buildApproach && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">{t('buildApproachLabel')}</h2>
          <p className="mt-2 text-base leading-[26px] text-ink/80">{startup.buildApproach}</p>
        </div>
      )}

      {startup.productIssues && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">{t('fixLabel')}</h2>
          <p className="mt-2 text-base leading-[26px] text-ink/80">{startup.productIssues}</p>
        </div>
      )}

      {typeof startup.difficultyScore === 'number' && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">{t('difficultyLabel')}</h2>
          <div className="mt-3 card-soft p-4">
            <DifficultyMeter
              score={startup.difficultyScore}
              breakdown={startup.difficultyBreakdown}
              labels={{
                tier: t(
                  startup.difficultyScore >= 70
                    ? 'difficultyHigh'
                    : startup.difficultyScore >= 40
                      ? 'difficultyMedium'
                      : 'difficultyLow'
                ),
                axes: {
                  technical: t('difficultyTech'),
                  capital: t('difficultyCapital'),
                  regulatory: t('difficultyRegulatory'),
                  market: t('difficultyMarket')
                }
              }}
            />
          </div>
        </div>
      )}

      <MvpPrompt startup={startup} />

      <p className="mt-10 max-w-2xl text-xs leading-5 text-ink/40">
        {t('generatedNoteLabel')}
        {startup.sourceNote ? ` ${startup.sourceNote}` : ''}
      </p>

      {startup.history && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">{t('historyLabel')}</h2>
          <p className="mt-2 text-base leading-[26px] text-ink/80">{startup.history}</p>
        </div>
      )}

      {hasMap && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">
            {t('locationLabel')}
            {startup.hqCity && startup.hqCity !== startup.country ? `: ${startup.hqCity}` : ''}
          </h2>
          <iframe
            title={`${startup.name} — ${t('locationLabel')}`}
            src={mapSrc}
            loading="lazy"
            className="mt-3 h-72 w-full rounded-xl border border-line/40 bg-surface/40"
          />
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-signal underline underline-offset-2 hover:text-ink"
          >
            {t('viewMapLabel')}
            <ExternalLink size={14} aria-hidden />
          </a>
        </div>
      )}

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