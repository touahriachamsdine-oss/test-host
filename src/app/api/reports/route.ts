import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { createReport, startupExists } from '@/lib/reports';

export const dynamic = 'force-dynamic';

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

const reportSchema = z.object({
  startupId: z.string().min(1).max(120),
  reason: z.enum(['wrong_info', 'translation', 'broken_link', 'duplicate', 'other']),
  note: z.string().trim().max(600).optional().or(z.literal(''))
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'cross_origin' }, { status: 403 });
    }
    throw error;
  }

  const limit = rateLimit(`report:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_report' }, { status: 400 });
  }

  if (!(await startupExists(parsed.data.startupId))) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const session = await auth();
  const memberId = session?.user?.id && session.user.role === 'member' ? session.user.id : null;

  const id = await createReport({
    startupId: parsed.data.startupId,
    memberId,
    reason: parsed.data.reason,
    note: parsed.data.note ?? null
  });

  return NextResponse.json({ ok: true, id });
}
