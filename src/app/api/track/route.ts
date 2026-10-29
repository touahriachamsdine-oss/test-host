import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getMemberProfile } from '@/lib/members';

const trackSchema = z.object({
  path: z.string().min(1).max(300),
  startupId: z.string().min(1).max(120).optional(),
  locale: z.enum(['ar', 'fr', 'en'])
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { path, startupId, locale } = parsed.data;
  if (path.startsWith('/admin') || path.startsWith('/api')) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const session = await auth();
  const memberId = session?.user?.id ?? null;
  let collegeId: string | null = null;
  if (memberId) {
    try {
      const profile = await getMemberProfile(memberId);
      collegeId = profile?.collegeId ?? null;
    } catch {
      collegeId = null;
    }
  }

  await query(
    `INSERT INTO page_views (path, startup_id, locale, member_id, college_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [path, startupId ?? null, locale, memberId, collegeId]
  );

  return NextResponse.json({ ok: true });
}
