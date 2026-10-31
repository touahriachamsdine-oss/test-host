import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { assertSameOrigin } from '@/lib/csrf';
import { requireMemberRole, getMemberProfile, updateMemberProfile } from '@/lib/members';
import { memberProfileSchema } from '@/lib/validation';
import { ForbiddenError } from '@/lib/db';

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
  const profile = await getMemberProfile(member.id);
  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
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

  const parsed = memberProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_profile', issues: parsed.error.issues.map((i) => i.path.join('.')) },
      { status: 400 }
    );
  }

  const profile = await updateMemberProfile(member.id, parsed.data);
  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ profile });
}
