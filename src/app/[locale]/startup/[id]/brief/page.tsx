import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getVerifiedById } from '@/lib/public-startups';
import { referenceCode } from '@/lib/reference';
import { sourceKindOf } from '@/lib/source';
import { ipcSections, isIpcClassification } from '@/lib/technology';
import { DifficultyMeter } from '@/components/DifficultyMeter';
import { PrintButton } from '@/components/PrintButton';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const startup = await getVerifiedById(id, locale);
  if (!startup) return {};
  const t = await getTranslations('Brief');
  return {
    title: `${startup.name} — ${t('title')}`,
    robots: { index: false, follow: false }
  };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="text-xs font-medium uppercase tracking-wide text-ink/50">{title}</h2>
      <div className="mt-1.5 text-[15px] leading-[24px] text-ink/85">{children}</div>
    </section>
  );
}

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const startup = await getVerifiedById(id, locale);
  if (!startup) notFound();

  const t = await getTranslations('StartupDetail');
  const briefT = await getTranslations('Brief');
  const names = await getTranslations('domainNames');
  const priorityT = await getTranslations('Priority');
  const ipcT = await getTranslations('Ipc');
  const sourceT = await getTranslations('Source');

  const ipc = isIpcClassification(startup.technology);
  const technology = ipc
    ? ipcSections(startup.technology)
        .map((section) => ipcT(section as never))
        .join(' · ')
    : startup.technology;
  const year =
    startup.yearFounded > 0
      ? new Intl.NumberFormat(locale, { useGrouping: false }).format(startup.yearFounded)
      : '';
  const code = referenceCode(startup.domain, startup.refNo);
  const source = (startup.officialSite || startup.sourceUrl || '').trim();
  const sourceKind = sourceKindOf(startup.id);

  const fields = [
    { label: t('countryLabel'), value: startup.country },
    { label: t('domainLabel'), value: names(startup.domain) },
    ...(startup.subDomain ? [{ label: t('subDomainLabel'), value: startup.subDomain }] : []),
    { label: t('technologyLabel'), value: technology },
    { label: t('priorityLabel'), value: priorityT(startup.priority) },
    ...(year ? [{ label: t('yearLabel'), value: year }] : []),
    ...(startup.teamName ? [{ label: t('teamLabel'), value: startup.teamName }] : [])
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 print:max-w-none print:px-0 print:pt-0">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/startup/${startup.id}`}
          className="inline-flex items-center gap-1.5 rounded-[3px] text-sm text-ink/60 underline underline-offset-2 ring-focus hover:text-ink"
        >
          <span aria-hidden>←</span>
          {briefT('back')}
        </Link>
        <PrintButton />
      </div>

      <header className="mt-8 border-b border-line/60 pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-signal">{briefT('title')}</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-9 tracking-tight text-ink">
          {startup.name}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/60">
          <span dir="ltr" className="font-mono font-medium text-signal">
            {code}
          </span>
          <span aria-hidden>·</span>
          <span>{startup.country}</span>
          {year && (
            <>
              <span aria-hidden>·</span>
              <span>{year}</span>
            </>
          )}
          {sourceKind !== 'curated' && (
            <span className="rounded-[2px] border border-line/60 px-1.5 font-mono text-[10px] uppercase leading-4 tracking-wide text-ink/50">
              {sourceT(sourceKind)}
            </span>
          )}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink/70">{briefT('subtitle')}</p>
      </header>

      <p className="mt-5 text-base leading-[26px] text-ink/85">{startup.shortDescription}</p>

      <dl className="mt-6 border-t border-line/40">
        {fields.map((field) => (
          <div
            key={field.label}
            className="grid grid-cols-[8rem_1fr] gap-3 border-b border-line/40 py-2 text-sm"
          >
            <dt className="text-ink/50">{field.label}</dt>
            <dd className="text-ink">{field.value}</dd>
          </div>
        ))}
      </dl>

      {startup.buildApproach && (
        <Block title={t('buildApproachLabel')}>
          <p>{startup.buildApproach}</p>
        </Block>
      )}

      {startup.teamRec && startup.teamRec.length > 0 && (
        <Block
          title={`${t('teamRecLabel')} — ${t('teamTotalLabel', {
            count: startup.teamRec.reduce((sum, role) => sum + role.count, 0)
          })}`}
        >
          <ul className="space-y-1">
            {startup.teamRec.map((role) => (
              <li key={role.role} className="flex items-center gap-2">
                <span dir="ltr" className="font-mono text-sm text-signal">
                  {role.count}×
                </span>
                {role.role}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {startup.productIssues && (
        <Block title={t('fixLabel')}>
          <p>{startup.productIssues}</p>
        </Block>
      )}

      {startup.whyRelevant && (
        <Block title={t('whyRelevantLabel')}>
          <p>{startup.whyRelevant}</p>
        </Block>
      )}

      {startup.algeriaValue && startup.algeriaValue !== startup.whyRelevant && (
        <Block title={t('algeriaValueLabel')}>
          <p>{startup.algeriaValue}</p>
        </Block>
      )}

      {startup.mainSellers && startup.mainSellers.length > 0 && (
        <Block title={t('sellersLabel')}>
          <ul className="space-y-1">
            {startup.mainSellers.map((seller) => (
              <li key={seller} className="flex items-start gap-2">
                <span aria-hidden className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                {seller}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {typeof startup.difficultyScore === 'number' && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink/50">
            {t('difficultyLabel')}
          </h2>
          <div className="mt-2 rounded-[10px] border border-line/50 p-4 print:border-0 print:p-0">
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
        </section>
      )}

      <footer className="mt-8 border-t border-line/60 pt-4 text-xs leading-5 text-ink/50">
        {source && (
          <p className="break-all">
            {t('sourceLabel')}: {source}
          </p>
        )}
        {startup.sourceNote && <p className="mt-1">{startup.sourceNote}</p>}
        <p className="mt-2">{briefT('footer')}</p>
      </footer>
    </article>
  );
}
