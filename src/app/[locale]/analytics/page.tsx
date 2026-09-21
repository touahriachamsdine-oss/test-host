import { getLocale, getTranslations } from 'next-intl/server';
import {
  getPublicStats,
  getVerifiedStartups,
  countVerifiedByDomain
} from '@/lib/public-startups';
import { priorityBreakdown, domainLeaderboard } from '@/lib/insights';
import { InsightsGrid } from '@/components/InsightsGrid';
import { InsightTile, type InsightMarker } from '@/components/InsightTile';
import { InsightBreakdown, type InsightBreakdownRow } from '@/components/InsightBreakdown';
import type { StartupPriority } from '@/data/startups';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const markerFor: Record<StartupPriority, InsightMarker> = {
  A: 'signal',
  B: 'gold',
  C: 'muted'
};

export default async function AnalyticsPage() {
  const t = await getTranslations('Hero');
  const domainsT = await getTranslations('Domains');
  const priorityT = await getTranslations('Priority');
  const names = await getTranslations('domainNames');
  const locale = (await getLocale()) as Locale;
  const nf = new Intl.NumberFormat(locale);
  const pct = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });

  const [stats, verified, counts] = await Promise.all([
    getPublicStats(),
    getVerifiedStartups(locale),
    countVerifiedByDomain()
  ]);

  const priorities = priorityBreakdown(verified);
  const board = domainLeaderboard(counts, 4);
  const breakdown: InsightBreakdownRow[] = board.map((row) => ({
    ...row,
    name: names(row.slug)
  }));

  const pulse = [
    { key: 'entries', label: t('entriesLabel'), value: nf.format(stats.entries) },
    { key: 'domains', label: t('domainsLabel'), value: nf.format(stats.domains) },
    { key: 'teams', label: t('teamsLabel'), value: nf.format(stats.teams) },
    { key: 'edition', label: t('editionLabel'), value: t('publication') }
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="pb-5">
        <p dir="ltr" className="font-mono text-sm leading-5 text-ink/50">
          {t('publication')}
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {domainsT('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-5 text-ink/60">{domainsT('subtitle')}</p>
      </header>

      <InsightsGrid className="mt-8">
        {pulse.map((tile, i) => (
          <InsightTile key={tile.key} index={i} label={tile.label} value={tile.value} />
        ))}
        {priorities.map((row, i) => (
          <InsightTile
            key={row.priority}
            index={pulse.length + i}
            label={priorityT(row.priority)}
            value={nf.format(row.count)}
            note={pct.format(row.share)}
            marker={markerFor[row.priority]}
          />
        ))}
      </InsightsGrid>

      <div className="mt-12">
        <InsightBreakdown rows={breakdown} className="mx-auto max-w-3xl" />
      </div>
    </section>
  );
}