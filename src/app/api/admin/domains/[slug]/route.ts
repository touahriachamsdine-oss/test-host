import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/api-auth';
import { setDomainMeta } from '@/lib/admin';
import { domainMetaPatchSchema } from '@/lib/validation';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError, NotFoundError } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['reviewer', 'admin']);
    const { slug } = await context.params;
    const body = domainMetaPatchSchema.parse(await request.json());
    const domain = await setDomainMeta(actor, slug, body);
    return NextResponse.json({ domain });
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