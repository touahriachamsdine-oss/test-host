import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const page = readFileSync(resolve(process.cwd(), 'src/app/[locale]/analytics/page.tsx'), 'utf8');

describe('analytics page contract', () => {
  it('mounts the insight components as the page composition', () => {
    expect(page).toContain('InsightsGrid');
    expect(page).toContain('InsightTile');
    expect(page).toContain('InsightBreakdown');
  });

  it('feeds the page from the directory data layer', () => {
    expect(page).toContain('getPublicStats');
    expect(page).toContain('getVerifiedStartups');
    expect(page).toContain('countVerifiedByDomain');
  });

  it('derives metrics through the pure insights helpers', () => {
    expect(page).toContain('priorityBreakdown');
    expect(page).toContain('domainLeaderboard');
  });

  it('resolves labels through next-intl namespaces without new copy', () => {
    expect(page).toContain('getTranslations');
    expect(page).not.toContain("'Analytics'");
    expect(page).not.toContain('"Analytics"');
  });
});