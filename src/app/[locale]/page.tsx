import { getLocale, getTranslations } from 'next-intl/server';
import { Hero } from '@/components/Hero';
import { MethodNote } from '@/components/MethodNote';
import { FacilityShowcase } from '@/components/FacilityShowcase';
import { DomainCard } from '@/components/DomainCard';
import { StartupRow } from '@/components/StartupRow';
import { ResultsGrid } from '@/components/ResultsGrid';
import { MarqueeStrip } from '@/components/MarqueeStrip';
import { Reveal } from '@/components/Reveal';
import { Link } from '@/i18n/navigation';
import { DOMAINS } from '@/data/domains';
import { getRecentStartups, countVerifiedByDomain, getPublicStats, browseStartups } from '@/lib/public-startups';
import { buildSimilarMap } from '@/lib/similar';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = await getTranslations('Domains');
  const browseT = await getTranslations('Browse');
  const goodT = await getTranslations('GoodFirst');
  const locale = (await getLocale()) as Locale;
  const [recent, counts, stats, easy] = await Promise.all([
    getRecentStartups(4, locale),
    countVerifiedByDomain(),
    getPublicStats(),
    browseStartups({ buildable: 'easy', sort: 'easiest' }, 1, locale, 3)
  ]);
  const similar = buildSimilarMap(recent);
  const easySimilar = buildSimilarMap(easy.rows);

  return (
    <>
      <Hero stats={stats} />
      <MarqueeStrip />
      <MethodNote />

      <FacilityShowcase />

      {easy.rows.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal className="mt-6 flex flex-wrap items-baseline justify-between gap-2 pb-4">
            <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{goodT('title')}</h2>
            <p className="max-w-lg text-sm text-ink/60">{goodT('subtitle')}</p>
          </Reveal>

          <ResultsGrid preset="ledger" className="mt-8">
            {easy.rows.map((startup) => (
              <StartupRow
                key={startup.id}
                startup={startup}
                similar={easySimilar[startup.id]}
              />
            ))}
          </ResultsGrid>

          <Reveal className="mt-6">
            <Link
              href="/browse?buildable=easy"
              className="inline-flex items-center gap-2 rounded-[3px] text-sm text-signal underline underline-offset-2 ring-focus"
            >
              {goodT('cta')}
              <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </section>
      )}

      <section id="domains" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <Reveal className="mt-6 flex flex-wrap items-baseline justify-between gap-2 pb-4">
          <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('title')}</h2>
          <p className="text-sm text-ink/60">{t('subtitle')}</p>
        </Reveal>

        <ResultsGrid preset="domains" className="mt-8">
          {DOMAINS.map((domain) => (
            <DomainCard key={domain.slug} domain={domain} count={counts[domain.slug] ?? 0} />
          ))}
        </ResultsGrid>

        {recent.length > 0 && (
          <div className="mt-16">
            <Reveal className="flex flex-wrap items-baseline justify-between gap-2 pb-4" delay={80}>
              <h2 className="text-[22px] font-semibold leading-[30px] text-ink">
                {browseT('title')}
              </h2>
              <p className="text-sm text-ink/60">{browseT('subtitle')}</p>
            </Reveal>

            <ResultsGrid preset="ledger" className="mt-8">
              {recent.map((startup) => (
                <StartupRow key={startup.id} startup={startup} similar={similar[startup.id]} />
              ))}
            </ResultsGrid>

            <Reveal className="mt-6">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-[3px] text-sm text-signal underline underline-offset-2 ring-focus"
              >
                {browseT('title')}
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        )}
      </section>
    </>
  );
}
