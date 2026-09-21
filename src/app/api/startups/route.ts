import { NextRequest, NextResponse } from 'next/server';
import { searchVerifiedStartups, getVerifiedByIds } from '@/lib/public-startups';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(`public-startups:${clientIp(request)}`, 60);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSec) }
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? undefined;
  const domain = searchParams.get('domain') ?? undefined;
  const idsParam = searchParams.get('ids');

  if (idsParam) {
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100);
    const startups = await getVerifiedByIds(ids);
    return NextResponse.json({ startups });
  }

  const startups = await searchVerifiedStartups(q ?? '', domain);
  return NextResponse.json({ startups });
}