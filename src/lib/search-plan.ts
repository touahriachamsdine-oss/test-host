import type { Locale } from '@/i18n/routing';

const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'ar'];

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function buildVerifiedSearchPlan(
  baseWhere: string,
  queryText = '',
  domain?: string,
  locale: Locale = 'en'
): { joins: string[]; clauses: string[]; values: (string | number | boolean | null)[] } {
  const clauses = [baseWhere];
  const joins: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  const safeLocale = isLocale(locale) ? locale : 'en';

  if (safeLocale !== 'en') {
    values.push(safeLocale);
    joins.push(
      `LEFT JOIN startup_translations tr ON tr.startup_id = startups.id AND tr.locale = $${values.length}`
    );
  }

  if (domain && domain !== 'all') {
    values.push(domain);
    clauses.push(`startups.domain = $${values.length}`);
  }

  if (queryText.trim()) {
    const needle = `%${queryText.trim()}%`;
    values.push(needle);
    const idx = values.length;
    const fields = [
      `startups.name ILIKE $${idx}`,
      `startups.short_description ILIKE $${idx}`,
      `startups.technology ILIKE $${idx}`,
      `COALESCE(startups.sub_domain,'') ILIKE $${idx}`,
      `startups.country ILIKE $${idx}`
    ];
    if (safeLocale !== 'en') {
      fields.push(
        `tr.name ILIKE $${idx}`,
        `tr.short_description ILIKE $${idx}`,
        `tr.technology ILIKE $${idx}`,
        `COALESCE(tr.sub_domain,'') ILIKE $${idx}`,
        `COALESCE(tr.country,'') ILIKE $${idx}`
      );
    }
    clauses.push(`(${fields.join(' OR ')})`);
  }

  return { joins, clauses, values };
}