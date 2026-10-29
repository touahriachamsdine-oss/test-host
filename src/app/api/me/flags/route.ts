import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { assertSameOrigin } from '@/lib/csrf';
import { requireMemberRole } from '@/lib/members';
import { query, ForbiddenError } from '@/lib/db';

async function currentMember() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role };
}

export async function GET() {
  const member = await currentMember();
  if (!member) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    requireMemberRole(member.role);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    throw error;
  }
  const rows = await query<{ startup_id: string }>(
    `SELECT startup_id FROM startup_flags WHERE member_id = $1 ORDER BY created_at DESC`,
    [member.id]
  );
  return NextResponse.json({ ids: rows.map((r) => r.startup_id) });
}

const toggleSchema = z.object({ startupId: z.string().min(1).max(120) });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'cross_origin' }, { status: 403 });
    }
    throw error;
  }

  const member = await currentMember();
  if (!member) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    requireMemberRole(member.role);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    throw error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_startup_id' }, { status: 400 });
  }

  const removed = await query<{ startup_id: string }>(
    `DELETE FROM startup_flags WHERE member_id = $1 AND startup_id = $2 RETURNING startup_id`,
    [member.id, parsed.data.startupId]
  );
  if (removed.length > 0) {
    return NextResponse.json({ pinned: false });
  }

  const exists = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startups WHERE id = $1`,
    [parsed.data.startupId]
  );
  if (Number(exists[0]?.count ?? 0) === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  await query(
    `INSERT INTO startup_flags (startup_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [parsed.data.startupId, member.id]
  );
  return NextResponse.json({ pinned: true });
}
