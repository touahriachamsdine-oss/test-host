import 'server-only';
import { query, mapPublicStartup, type PublicStartup } from '@/lib/db';
import { DOMAINS } from '@/data/domains';
import type { Locale } from '@/i18n/routing';
import { applyStartupTranslation, type StartupTranslationRow } from '@/lib/startup-translations';
import { buildVerifiedSearchPlan, isLocale } from '@/lib/search-plan';

export type { StartupTranslationRow } from '@/lib/startup-translations';
export { buildVerifiedSearchPlan } from '@/lib/search-plan';

const PUBLIC_WHERE = [
  "status = 'verified'",
  "is_duplicate_2025 = FALSE",
  process.env.PUBLIC_PRIORITY_FILTER === 'A' ? "priority = 'A'" : null
]
  .filter(Boolean)
  .join(' AND ');

function selectColumns(alias = ''): string {
  const p = alias ? `${alias}.` : '';
  return `${p}id, ${p}name, ${p}country, ${p}domain, ${p}sub_domain,
      ${p}short_description, ${p}technology, ${p}year_founded, ${p}official_site,
      ${p}source_url, ${p}why_relevant, ${p}history, ${p}hq_city,
      ${p}latitude, ${p}longitude, ${p}priority, ${p}status,
      ${p}submitted_by_team_code,
      ${p}concept, ${p}main_sellers, ${p}team_rec, ${p}build_approach, ${p}product_issues,
      ${p}algeria_value, ${p}difficulty_score, ${p}difficulty_breakdown,
      ${p}source_tier, ${p}source_note,
      ROW_NUMBER() OVER (PARTITION BY ${p}domain ORDER BY ${p}year_founded, ${p}name) AS ref_no`;
}

const ORDER = 'ORDER BY year_founded, name';

async function withTranslations(
  rows: PublicStartup[],
  locale: Locale
): Promise<PublicStartup[]> {
  if (locale === 'en' || rows.length === 0) return rows;
  const safeLocale = isLocale(locale) ? locale : 'en';
  if (safeLocale === 'en') return rows;
  const ids = rows.map((r) => r.id);
  const translations = await query<StartupTranslationRow>(
    `SELECT startup_id, name, country, sub_domain, short_description,
            technology, why_relevant, history, hq_city,
            concept, main_sellers, team_rec, build_approach, product_issues, algeria_value
     FROM startup_translations
     WHERE locale = $1 AND startup_id = ANY($2::text[])`,
    [safeLocale, ids] as (string | number | boolean | null)[]
  );
  const byId = new Map(translations.map((tr) => [tr.startup_id, tr]));
  return rows.map((row) => applyStartupTranslation(row, byId.get(row.id)));
}

export async function getVerifiedStartups(locale: Locale = 'en'): Promise<PublicStartup[]> {
  const rows = await query(
    `SELECT ${selectColumns()} FROM startups WHERE ${PUBLIC_WHERE} ${ORDER}`
  );
  return withTranslations(rows.map(mapPublicStartup), locale);
}

export async function getVerifiedById(
  id: string,
  locale: Locale = 'en'
): Promise<PublicStartup | null> {
  const rows = await query(
    `SELECT t.*, COALESCE(tm.name, '') AS team_name
FROM (SELECT ${selectColumns()} FROM startups WHERE ${PUBLIC_WHERE}) t
     LEFT JOIN teams tm ON tm.code = t.submitted_by_team_code
     WHERE t.id = $1`,
    [id]
  );
  if (!rows.length) return null;
  const startup = mapPublicStartup(rows[0]);
  if (rows[0].team_name) startup.teamName = String(rows[0].team_name);
  const [translated] = await withTranslations([startup], locale);
  return translated;
}

export async function getVerifiedByIds(
  ids: string[],
  locale: Locale = 'en'
): Promise<PublicStartup[]> {
  if (ids.length === 0) return [];
  const indexes = ids.map((_, i) => `$${i + 1}`);
  const rows = await query(
    `SELECT * FROM (SELECT ${selectColumns()} FROM startups WHERE ${PUBLIC_WHERE}) t
     WHERE id IN (${indexes.join(',')}) ORDER BY name ASC`,
    [...ids]
  );
  return withTranslations(rows.map(mapPublicStartup), locale);
}

export async function getVerifiedByDomain(
  domain: string,
  locale: Locale = 'en'
): Promise<PublicStartup[]> {
  const rows = await query(
    `SELECT ${selectColumns()} FROM startups WHERE ${PUBLIC_WHERE} AND domain = $1 ${ORDER}`,
    [domain]
  );
  return withTranslations(rows.map(mapPublicStartup), locale);
}

export async function getVerifiedByDomains(
  domains: string[],
  locale: Locale = 'en'
): Promise<PublicStartup[]> {
  if (domains.length === 0) return [];
  const indexes = domains.map((_, i) => `$${i + 1}`);
  const rows = await query(
    `SELECT ${selectColumns()} FROM startups WHERE ${PUBLIC_WHERE} AND domain IN (${indexes.join(',')}) ${ORDER}`,
    [...domains]
  );
  return withTranslations(rows.map(mapPublicStartup), locale);
}

export async function searchVerifiedStartups(
  queryText = '',
  domain?: string,
  locale: Locale = 'en'
): Promise<PublicStartup[]> {
  const { joins, clauses, values } = buildVerifiedSearchPlan(PUBLIC_WHERE, queryText, domain, locale);
  const joined = joins.length > 0;
  const rows = await query(
    `SELECT ${selectColumns(joined ? 'startups' : '')} FROM startups ${joins.join(' ')}
     WHERE ${clauses.join(' AND ')} ${joined ? 'ORDER BY startups.year_founded, startups.name' : ORDER}`,
    values
  );
  return withTranslations(rows.map(mapPublicStartup), locale);
}

export async function countVerifiedByDomain(): Promise<Record<string, number>> {
  const rows = await query<{ domain: string; count: string }>(
    `SELECT domain, COUNT(*)::text AS count FROM startups WHERE ${PUBLIC_WHERE} GROUP BY domain`
  );
  return Object.fromEntries(rows.map((r) => [r.domain, Number(r.count)]));
}

export async function getPublicStats(): Promise<{
  entries: number;
  domains: number;
  teams: number;
}> {
  const entriesRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startups WHERE ${PUBLIC_WHERE}`
  );
  const teamsRows = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM teams`);
  return {
    entries: Number(entriesRows[0].count),
    domains: DOMAINS.length,
    teams: Number(teamsRows[0].count)
  };
}

export async function getDomainMeta(
  slug: string
): Promise<{ validationStatus: string; priorityTier: string | null } | null> {
  const rows = await query<{ validation_status: string; priority_tier: string | null }>(
    `SELECT validation_status, priority_tier FROM domain_meta WHERE slug = $1`,
    [slug]
  );
  if (!rows.length) return null;
  return {
    validationStatus: String(rows[0].validation_status),
    priorityTier: rows[0].priority_tier ? String(rows[0].priority_tier) : null
  };
}