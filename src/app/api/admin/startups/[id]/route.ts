import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/api-auth';
import {
  getStartupForAdminById,
  updateStartupStatus,
  updateStartupPriority,
  setDuplicateFlag,
  updateStartup
} from '@/lib/admin';
import { startupPatchSchema, startupSubmissionSchema } from '@/lib/validation';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const actor = await getActor(['team', 'reviewer', 'admin']);
    const { id } = await context.params;
    const startup = await getStartupForAdminById(id);
    if (!startup) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (actor.role === 'team' && startup.submittedByTeam !== actor.id) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ startup });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['team', 'reviewer', 'admin']);
    const { id } = await context.params;
    const body = startupSubmissionSchema.parse(await request.json());
    const startup = await updateStartup(actor, id, body);
    return NextResponse.json({ startup });
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

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['reviewer', 'admin']);
    const { id } = await context.params;
    const body = startupPatchSchema.parse(await request.json());

    const existing = await getStartupForAdminById(id);
    if (!existing) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let startup = existing;
    if (body.status && body.status !== existing.status) {
      startup = await updateStartupStatus(actor, id, body.status);
    }
    if (body.priority && body.priority !== existing.priority) {
      startup = await updateStartupPriority(actor, id, body.priority);
    }
    if (
      body.isDuplicate2025 !== undefined &&
      body.isDuplicate2025 !== existing.isDuplicate2025
    ) {
      startup = await setDuplicateFlag(actor, id, body.isDuplicate2025);
    }

    return NextResponse.json({ startup });
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