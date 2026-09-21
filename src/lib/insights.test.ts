import { describe, expect, it } from 'vitest';
import { priorityBreakdown, domainLeaderboard } from './insights';
import type { Startup } from '../data/startups';

const STARTUPS: Startup[] = [
  {
    id: 'a',
    name: 'A',
    country: 'Algeria',
    domain: 'ai-computing',
    shortDescription: '',
    technology: '',
    yearFounded: 2023,
    whyRelevant: '',
    priority: 'A',
    status: 'verified'
  },
  {
    id: 'b',
    name: 'B',
    country: 'Algeria',
    domain: 'robotics',
    shortDescription: '',
    technology: '',
    yearFounded: 2023,
    whyRelevant: '',
    priority: 'A',
    status: 'verified'
  },
  {
    id: 'c',
    name: 'C',
    country: 'Algeria',
    domain: 'robotics',
    shortDescription: '',
    technology: '',
    yearFounded: 2022,
    whyRelevant: '',
    priority: 'B',
    status: 'verified'
  },
  {
    id: 'd',
    name: 'D',
    country: 'Algeria',
    domain: 'space-aerospace',
    shortDescription: '',
    technology: '',
    yearFounded: 2021,
    whyRelevant: '',
    priority: 'C',
    status: 'verified'
  }
];

describe('priorityBreakdown', () => {
  it('returns one row per priority tier in fixed A/B/C order', () => {
    const rows = priorityBreakdown(STARTUPS);
    expect(rows.map((row) => row.priority)).toEqual(['A', 'B', 'C']);
  });

  it('counts the startups registered on each tier', () => {
    const rows = priorityBreakdown(STARTUPS);
    expect(rows[0].count).toBe(2);
    expect(rows[1].count).toBe(1);
    expect(rows[2].count).toBe(1);
  });

  it('shares each tier of the directory so the shares sum to 1', () => {
    const rows = priorityBreakdown(STARTUPS);
    expect(rows[0].share).toBeCloseTo(0.5);
    expect(rows[1].share).toBeCloseTo(0.25);
    expect(rows[2].share).toBeCloseTo(0.25);
    expect(rows.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
  });

  it('guards against an empty directory', () => {
    const rows = priorityBreakdown([]);
    for (const row of rows) {
      expect(row.count).toBe(0);
      expect(row.share).toBe(0);
    }
  });
});

describe('domainLeaderboard', () => {
  it('sorts domains by reference count descending and caps at the limit', () => {
    const rows = domainLeaderboard(
      { robotics: 2, 'ai-computing': 5, 'space-aerospace': 1 },
      2
    );
    expect(rows.map((row) => row.slug)).toEqual(['ai-computing', 'robotics']);
  });

  it('resolves the domain reference code from the domain table', () => {
    const rows = domainLeaderboard({ 'ai-computing': 2 }, 1);
    expect(rows[0].code).toBe('AI');
  });

  it('computes each domain share of all references', () => {
    const rows = domainLeaderboard({ robotics: 1, 'space-aerospace': 1 }, 2);
    expect(rows[0].share).toBeCloseTo(0.5);
    expect(rows[1].share).toBeCloseTo(0.5);
  });

  it('returns an empty board for empty counts', () => {
    expect(domainLeaderboard({}, 4)).toEqual([]);
  });
});