import 'server-only';
import { query } from '@/lib/db';

export interface DatasetFilters {
  domain?: string;
  country?: string;
  buildable?: string;
}

export interface DatasetRow {
  id: string;
  name: string;
  country: string;
  domain: string;
  subDomain: string | null;
  yearFounded: number;
  shortDescription: string;
  technology: string | null;
  priority: string;
  difficultyScore: number | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  officialSite: string | null;
  sourceUrl: string | null;
  updatedAt: string;
}

const WHERE_BASE = `status = 'verified' AND is_duplicate_2025 = FALSE`;

function buildWhere(filters: DatasetFilters): { clause: string; params: Array<string | number | boolean | null> } {
  const clauses = [WHERE_BASE];
  const params: Array<string | number | boolean | null> = [];

  if (filters.domain) {
    params.push(filters.domain);
    clauses.push(`domain = $${params.length}`);
  }
  if (filters.country) {
    params.push(filters.country);
    clauses.push(`country = $${params.length}`);
  }
  if (filters.buildable === 'open-hardware') {
    clauses.push(`id LIKE 'oh-%'`);
  } else if (filters.buildable === 'easy') {
    clauses.push(`difficulty_score IS NOT NULL AND difficulty_score <= 40`);
  } else if (filters.buildable === 'complete') {
    clauses.push(
      `team_rec IS NOT NULL AND product_issues IS NOT NULL AND build_approach IS NOT NULL AND latitude IS NOT NULL`
    );
  }

  return { clause: clauses.join(' AND '), params };
}

const COLUMNS = `id, name, country, domain, sub_domain, year_founded, short_description,
  technology, priority, difficulty_score, latitude, longitude, hq_city, official_site, source_url, updated_at`;

type RawRow = {
  id: string;
  name: string;
  country: string;
  domain: string;
  sub_domain: string | null;
  year_founded: number;
  short_description: string;
  technology: string | null;
  priority: string;
  difficulty_score: number | null;
  latitude: number | null;
  longitude: number | null;
  hq_city: string | null;
  official_site: string | null;
  source_url: string | null;
  updated_at: Date | string;
};

function mapRow(row: RawRow): DatasetRow {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    domain: row.domain,
    subDomain: row.sub_domain,
    yearFounded: Number(row.year_founded),
    shortDescription: row.short_description ?? '',
    technology: row.technology,
    priority: row.priority,
    difficultyScore: row.difficulty_score === null ? null : Number(row.difficulty_score),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    city: row.hq_city,
    officialSite: row.official_site,
    sourceUrl: row.source_url,
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export async function countDataset(filters: DatasetFilters): Promise<number> {
  const { clause, params } = buildWhere(filters);
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startups WHERE ${clause}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

export async function fetchDatasetPage(
  filters: DatasetFilters,
  limit: number,
  offset: number
): Promise<DatasetRow[]> {
  const { clause, params } = buildWhere(filters);
  const rows = await query<RawRow>(
    `SELECT ${COLUMNS} FROM startups WHERE ${clause} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return rows.map(mapRow);
}

export const DATASET_LICENSE = 'CC BY 4.0';
export const DATASET_VERSION = '2026-10';

export const DATASET_SCHEMA = [
  { name: 'id', type: 'text', note: 'Stable identifier used in URLs' },
  { name: 'name', type: 'text', note: 'Project or patent title' },
  { name: 'country', type: 'text', note: 'Country of the source record' },
  { name: 'domain', type: 'text', note: 'One of 16 sectors (see /domains)' },
  { name: 'sub_domain', type: 'text', note: 'Free-text sub-sector' },
  { name: 'year_founded', type: 'integer', note: 'Source year' },
  { name: 'short_description', type: 'text', note: 'Normalised summary' },
  { name: 'technology', type: 'text', note: 'Readable technology / IPC mapping' },
  { name: 'priority', type: 'text', note: 'high, medium or low' },
  { name: 'difficulty_score', type: 'integer', note: '0–100, higher is harder' },
  { name: 'latitude', type: 'double', note: 'WGS84, when geocoded' },
  { name: 'longitude', type: 'double', note: 'WGS84, when geocoded' },
  { name: 'hq_city', type: 'text', note: 'City, when known' },
  { name: 'official_site', type: 'text', note: 'Official or source URL' },
  { name: 'source_url', type: 'text', note: 'Original record URL' },
  { name: 'updated_at', type: 'timestamp', note: 'Last verification date' }
] as const;
