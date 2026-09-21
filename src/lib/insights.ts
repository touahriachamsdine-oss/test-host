import type { Startup, StartupPriority } from '@/data/startups';
import { DOMAINS } from '@/data/domains';

export type PriorityInsight = {
  priority: StartupPriority;
  count: number;
  share: number;
};

export type DomainInsightRow = {
  slug: string;
  code: string;
  count: number;
  share: number;
};

const PRIORITY_TIERS: StartupPriority[] = ['A', 'B', 'C'];

export function priorityBreakdown(startups: Startup[]): PriorityInsight[] {
  const total = startups.length;
  return PRIORITY_TIERS.map((priority) => {
    const count = startups.filter((startup) => startup.priority === priority).length;
    return { priority, count, share: total > 0 ? count / total : 0 };
  });
}

const DOMAIN_CODES: Record<string, string> = Object.fromEntries(
  DOMAINS.map((domain) => [domain.slug, domain.code])
);

export function domainLeaderboard(
  counts: Record<string, number>,
  limit = 4
): DomainInsightRow[] {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return Object.entries(counts)
    .map(([slug, count]) => ({
      slug,
      code: DOMAIN_CODES[slug] ?? slug,
      count,
      share: total > 0 ? count / total : 0
    }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}