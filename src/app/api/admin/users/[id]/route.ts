import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/api-auth';
import { updateUserRole } from '@/lib/admin';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError } from '@/lib/db';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  role: z.enum(['team', 'reviewer', 'admin']),
  teamDomain: z.string().max(80).optional().nullable()
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['admin']);
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());
    const user = await updateUserRole(actor, id, body.role, body.teamDomain ?? null);
    return NextResponse.json({ user });
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