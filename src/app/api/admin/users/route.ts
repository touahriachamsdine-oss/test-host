import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getActor } from '@/lib/api-auth';
import { createUser, listUsers } from '@/lib/admin';
import { userCreateSchema } from '@/lib/validation';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await getActor(['admin']);
    const users = await listUsers(actor);
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['admin']);
    const body = userCreateSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await createUser(actor, {
      name: body.name,
      email: body.email.toLowerCase().trim(),
      role: body.role,
      teamDomain: body.teamDomain ?? null,
      passwordHash
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_failed' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}