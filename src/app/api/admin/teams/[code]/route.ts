import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/api-auth';
import { setTeamQuota } from '@/lib/admin';
import { teamQuotaPatchSchema } from '@/lib/validation';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError, NotFoundError } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ code: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['admin']);
    const { code } = await context.params;
    const body = teamQuotaPatchSchema.parse(await request.json());
    const team = await setTeamQuota(actor, code, body.quota);
    return NextResponse.json({ team });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_failed' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}