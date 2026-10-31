import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import {
  DATASET_LICENSE,
  DATASET_VERSION,
  countDataset,
  fetchDatasetPage,
  type DatasetFilters,
  type DatasetRow
} from '@/lib/dataset';

export const dynamic = 'force-dynamic';

const MAX_PER_PAGE = 500;

const CSV_COLUMNS: Array<keyof DatasetRow> = [
  'id',
  'name',
  'country',
  'domain',
  'subDomain',
  'yearFounded',
  'shortDescription',
  'technology',
  'priority',
  'difficultyScore',
  'latitude',
  'longitude',
  'city',
  'officialSite',
  'sourceUrl',
  'updatedAt'
];

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function readFilters(searchParams: URLSearchParams): DatasetFilters {
  const filters: DatasetFilters = {};
  const domain = searchParams.get('domain');
  const country = searchParams.get('country');
  const buildable = searchParams.get('buildable');
  if (domain) filters.domain = domain.slice(0, 80);
  if (country) filters.country = country.slice(0, 80);
  if (buildable && ['easy', 'complete', 'open-hardware'].includes(buildable)) {
    filters.buildable = buildable;
  }
  return filters;
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(`public-dataset:${clientIp(request)}`, 120);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const filters = readFilters(searchParams);
  const total = await countDataset(filters);
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'X-Dataset-License': DATASET_LICENSE,
    'X-Dataset-Version': DATASET_VERSION,
    'X-Total-Count': String(total)
  };

  if (searchParams.get('format') === 'csv') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`\uFEFF${CSV_COLUMNS.join(',')}\n`));
          const batch = 1000;
          for (let offset = 0; offset < total; offset += batch) {
            const rows = await fetchDatasetPage(filters, batch, offset);
            if (rows.length === 0) break;
            const text = rows
              .map((row) => CSV_COLUMNS.map((column) => csvCell(row[column])).join(','))
              .join('\n');
            controller.enqueue(encoder.encode(`${text}\n`));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...headers,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="startup-ideas-dz.csv"'
      }
    });
  }

  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number.parseInt(searchParams.get('perPage') ?? '50', 10) || 50)
  );

  const rows = await fetchDatasetPage(filters, perPage, (page - 1) * perPage);

  return NextResponse.json(
    {
      meta: {
        total,
        page,
        perPage,
        pages: Math.max(1, Math.ceil(total / perPage)),
        license: DATASET_LICENSE,
        version: DATASET_VERSION,
        source: 'https://test-host-pi.vercel.app/data'
      },
      data: rows
    },
    { headers }
  );
}
