import { describe, expect, it } from 'vitest';
import { applyStartupTranslation } from '@/lib/startup-translations';
import { buildVerifiedSearchPlan } from '@/lib/search-plan';
import type { PublicStartup } from './db';
import type { StartupTranslationRow } from '@/lib/startup-translations';

const STARTUP: PublicStartup = {
  id: 'kabas-ai',
  name: 'KABAS AI',
  country: 'Algeria',
  domain: 'ai-computing',
  subDomain: 'Generative AI',
  shortDescription: 'A sovereign Arabic large language model.',
  technology: 'LLM fine-tuning',
  whyRelevant: 'Digital sovereignty.',
  yearFounded: 2024,
  priority: 'A',
  status: 'verified'
};

describe('applyStartupTranslation', () => {
  it('returns the startup unchanged when there is no translation', () => {
    expect(applyStartupTranslation(STARTUP, null)).toBe(STARTUP);
    expect(applyStartupTranslation(STARTUP, undefined)).toBe(STARTUP);
  });

  it('overrides translatable fields from the translation row', () => {
    const tr: StartupTranslationRow = {
      startup_id: 'kabas-ai',
      name: 'KABAS AI',
      country: 'الجزائر',
      sub_domain: 'الذكاء الاصطناعي التوليدي',
      short_description: 'نموذج لغوي عربي كبير سيادي.',
      technology: 'ضبط دقيق للنماذج اللغوية',
      why_relevant: 'السيادة الرقمية.'
    };
    const result = applyStartupTranslation(STARTUP, tr);
    expect(result.name).toBe('KABAS AI');
    expect(result.country).toBe('الجزائر');
    expect(result.subDomain).toBe('الذكاء الاصطناعي التوليدي');
    expect(result.shortDescription).toBe('نموذج لغوي عربي كبير سيادي.');
    expect(result.technology).toBe('ضبط دقيق للنماذج اللغوية');
    expect(result.whyRelevant).toBe('السيادة الرقمية.');
    expect(result.id).toBe('kabas-ai');
    expect(result.priority).toBe('A');
  });

  it('falls back to the startup value for nullable fields', () => {
    const tr: StartupTranslationRow = {
      startup_id: 'kabas-ai',
      name: 'KABAS AI',
      country: null,
      sub_domain: null,
      short_description: 'Desc.',
      technology: 'Tech',
      why_relevant: 'Why.'
    };
    const result = applyStartupTranslation(STARTUP, tr);
    expect(result.country).toBe('Algeria');
    expect(result.subDomain).toBe('Generative AI');
  });
});

describe('buildVerifiedSearchPlan', () => {
  const BASE = "status = 'verified'";

  it('searches English fields only without a join for en', () => {
    const plan = buildVerifiedSearchPlan(BASE, 'solar', 'all', 'en');
    expect(plan.joins).toEqual([]);
    expect(plan.clauses[0]).toBe(BASE);
    expect(plan.clauses[1]).toContain('startups.name ILIKE $1');
    expect(plan.clauses[1]).toContain('startups.country ILIKE $1');
    expect(plan.clauses[1]).not.toContain('tr.');
    expect(plan.values).toEqual(['%solar%']);
  });

  it('joins startup_translations for fr and matches translated fields', () => {
    const plan = buildVerifiedSearchPlan(BASE, 'solaire', undefined, 'fr');
    expect(plan.joins).toHaveLength(1);
    expect(plan.joins[0]).toContain('LEFT JOIN startup_translations tr');
    expect(plan.joins[0]).toContain('tr.locale = $1');
    expect(plan.values[0]).toBe('fr');
    const search = plan.clauses[1];
    expect(search).toContain('tr.name ILIKE $2');
    expect(search).toContain('tr.short_description ILIKE $2');
    expect(search).toContain('COALESCE(tr.country,\'\') ILIKE $2');
    expect(plan.values).toContain('%solaire%');
  });

  it('appends the domain filter before the search needle and reuses the last index', () => {
    const plan = buildVerifiedSearchPlan(BASE, 'نووي', 'energy-storage', 'ar');
    expect(plan.joins[0]).toContain('tr.locale = $1');
    expect(plan.clauses[1]).toBe('startups.domain = $2');
    expect(plan.clauses[2]).toContain('startups.name ILIKE $3');
    expect(plan.clauses[2]).toContain('tr.name ILIKE $3');
    expect(plan.values).toEqual(['ar', 'energy-storage', '%نووي%']);
  });

  it('keeps the base where untouched when only a domain is given', () => {
    const plan = buildVerifiedSearchPlan(BASE, '', 'cleantech', 'fr');
    expect(plan.clauses).toEqual([BASE, 'startups.domain = $2']);
    expect(plan.values).toEqual(['fr', 'cleantech']);
  });
});