import type { Startup } from '@/data/startups';

export function buildSimilarMap(startups: Startup[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const s of startups) {
    const candidates = startups
      .filter(
        (o) =>
          o.id !== s.id &&
          (o.subDomain === s.subDomain || o.domain === s.domain)
      )
      .sort((a, b) => b.yearFounded - a.yearFounded)
      .slice(0, 2)
      .map((o) => o.name);
    map[s.id] = candidates;
  }
  return map;
}