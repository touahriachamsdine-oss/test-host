import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError } from '@/lib/db';
import { setReportStatus } from '@/lib/reports';

export const dynamic = 'force-dynamic';

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(['open', 'resolved', 'dismissed'])
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['reviewer', 'admin']);
    const body = schema.parse(await request.json());
    const updated = await setReportStatus(body.id, body.status, actor.id);
    if (!updated) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
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
