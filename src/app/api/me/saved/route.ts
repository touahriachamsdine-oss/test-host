import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { assertSameOrigin } from '@/lib/csrf';
import { getSavedIds, requireMemberRole, toggleSavedStartup } from '@/lib/members';
import { query, ForbiddenError } from '@/lib/db';

async function currentMember() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role };
}

export async function GET() {
  const member = await currentMember();
  if (!member) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    requireMemberRole(member.role);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    throw error;
  }
  const ids = await getSavedIds(member.id);
  return NextResponse.json({ ids });
}

const toggleSchema = z.object({
  startupId: z.string().min(1).max(120)
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

  const member = await currentMember();
  if (!member) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
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

  const exists = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM startups WHERE id = $1`,
    [parsed.data.startupId]
  );
  if (Number(exists[0]?.count ?? 0) === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const saved = await toggleSavedStartup(member.id, parsed.data.startupId);
  return NextResponse.json({ saved });
}