import 'server-only';
import { query } from '@/lib/db';

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
  sampleId: string;
  sampleName: string;
  city: string | null;
}

export interface MapFacet {
  value: string;
  count: number;
}

export interface CityFacet {
  city: string;
  count: number;
}

const BASE_WHERE = `status = 'verified' AND is_duplicate_2025 = FALSE
  AND latitude IS NOT NULL AND longitude IS NOT NULL`;

export async function getMapClusters(options: {
  country?: string | null;
  city?: string | null;
  step?: number;
  limit?: number;
}): Promise<MapCluster[]> {
  const step = options.step ?? 0.5;
  const limit = options.limit ?? 1200;
  const rows = await query<{
    lat: string;
    lng: string;
    count: string;
    sample_id: string;
    sample_name: string;
    city: string | null;
  }>(
    `SELECT (round(latitude::numeric / $1) * $1)::text AS lat,
            (round(longitude::numeric / $1) * $1)::text AS lng,
            COUNT(*)::text AS count,
            (array_agg(id ORDER BY priority, name))[1] AS sample_id,
            (array_agg(name ORDER BY priority, name))[1] AS sample_name,
            (array_agg(hq_city ORDER BY priority, name))[1] AS city
     FROM startups
     WHERE ${BASE_WHERE}
       AND ($2::text IS NULL OR country = $2)
       AND ($3::text IS NULL OR hq_city = $3)
     GROUP BY 1, 2
     ORDER BY COUNT(*) DESC
     LIMIT $4`,
    [step, options.country ?? null, options.city ?? null, limit]
  );
  return rows.map((row) => ({
    lat: Number(row.lat),
    lng: Number(row.lng),
    count: Number(row.count),
    sampleId: String(row.sample_id),
    sampleName: String(row.sample_name),
    city: row.city ? String(row.city) : null
  }));
}

export async function getMapCountries(): Promise<MapFacet[]> {
  const rows = await query<{ country: string; count: string }>(
    `SELECT country, COUNT(*)::text AS count
     FROM startups
     WHERE ${BASE_WHERE}
     GROUP BY country
     ORDER BY COUNT(*) DESC, country
     LIMIT 40`
  );
  return rows.map((row) => ({ value: String(row.country), count: Number(row.count) }));
}

export async function getAlgeriaCities(): Promise<CityFacet[]> {
  const rows = await query<{ city: string; count: string }>(
    `SELECT hq_city AS city, COUNT(*)::text AS count
     FROM startups
     WHERE ${BASE_WHERE} AND country = 'Algeria' AND hq_city IS NOT NULL
     GROUP BY hq_city
     ORDER BY COUNT(*) DESC, hq_city`
  );
  return rows.map((row) => ({ city: String(row.city), count: Number(row.count) }));
}

export function normalizePlace(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matchCityByPlace(cities: CityFacet[], place: string | null | undefined): string | null {
  if (!place) return null;
  const target = normalizePlace(place);
  if (!target) return null;
  const exact = cities.find((city) => normalizePlace(city.city) === target);
  if (exact) return exact.city;
  const loose = cities.find((city) => {
    const normalized = normalizePlace(city.city);
    return normalized.includes(target) || target.includes(normalized);
  });
  return loose ? loose.city : null;
}
