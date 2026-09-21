import { getLocale, getTranslations } from 'next-intl/server';
import { Hero } from '@/components/Hero';
import { MethodNote } from '@/components/MethodNote';
import { DomainCard } from '@/components/DomainCard';
import { StartupRow } from '@/components/StartupRow';
import { ResultsGrid } from '@/components/ResultsGrid';
import { MarqueeStrip } from '@/components/MarqueeStrip';
import { Reveal } from '@/components/Reveal';
import { DOMAINS } from '@/data/domains';
import { getVerifiedStartups, countVerifiedByDomain, getPublicStats } from '@/lib/public-startups';
import { buildSimilarMap } from '@/lib/similar';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = await getTranslations('Domains');
  const browseT = await getTranslations('Browse');
  const locale = (await getLocale()) as Locale;
  const verified = await getVerifiedStartups(locale);
  const counts = await countVerifiedByDomain();
  const stats = await getPublicStats();
  const recent = [...verified]
    .filter((s) => s.yearFounded > 0)
    .sort((a, b) => b.yearFounded - a.yearFounded)
    .slice(0, 4);
  const similar = buildSimilarMap(recent);

  return (
    <>
      <Hero stats={stats} />
      <MarqueeStrip />
      <MethodNote />

      <section id="domains" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <Reveal className="mt-6 flex flex-wrap items-baseline justify-between gap-2 pb-4">
          <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('title')}</h2>
          <p className="text-sm text-ink/60">{t('subtitle')}</p>
        </Reveal>

        <ResultsGrid preset="domains" className="mt-8">
          {DOMAINS.map((domain) => (
            <DomainCard
              key={domain.slug}
              domain={domain}
              count={counts[domain.slug] ?? 0}
            />
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
          </div>
        )}
      </section>
    </>
  );
}