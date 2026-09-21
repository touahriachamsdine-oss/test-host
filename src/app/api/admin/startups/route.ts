import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/api-auth';
import { createStartup, listStartupsForAdmin, listMineForAdmin } from '@/lib/admin';
import { startupSubmissionSchema } from '@/lib/validation';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const mine = searchParams.get('mine') === 'true';

    if (mine) {
      const actor = await getActor(['team', 'reviewer', 'admin']);
      const startups = await listMineForAdmin(actor.id);
      return NextResponse.json({ startups });
    }

    const actor = await getActor(['reviewer', 'admin']);
    void actor;
    const startups = await listStartupsForAdmin(status);
    return NextResponse.json({ startups });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['team', 'reviewer', 'admin']);
    const body = startupSubmissionSchema.parse(await request.json());
    const startup = await createStartup(actor, {
      name: body.name,
      country: body.country,
      domain: body.domain,
      subDomain: body.subDomain || undefined,
      shortDescription: body.shortDescription,
      technology: body.technology,
      yearFounded: body.yearFounded,
      officialSite: body.officialSite || undefined,
      sourceUrl: body.sourceUrl || undefined,
      whyRelevant: body.whyRelevant,
      priority: body.priority
    });
    return NextResponse.json({ startup }, { status: 201 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_failed', details: error.flatten() }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}