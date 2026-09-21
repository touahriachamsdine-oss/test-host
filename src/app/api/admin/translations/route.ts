import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/api-auth';
import {
  upsertStartupTranslation,
  deleteStartupTranslation
} from '@/lib/startup-translations-admin';
import { translationUpsertSchema, translationDeleteSchema } from '@/lib/validation';
import { assertSameOrigin } from '@/lib/csrf';
import { ForbiddenError, NotFoundError } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['reviewer', 'admin']);
    const body = translationUpsertSchema.parse(await request.json());
    const translation = await upsertStartupTranslation(actor, {
      startupId: body.startupId,
      locale: body.locale,
      name: body.name,
      country: body.country,
      subDomain: body.subDomain,
      shortDescription: body.shortDescription,
      technology: body.technology,
      whyRelevant: body.whyRelevant
    });
    return NextResponse.json({ translation });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_failed' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getActor(['reviewer', 'admin']);
    const body = translationDeleteSchema.parse(await request.json());
    const deleted = await deleteStartupTranslation(actor, body.startupId, body.locale);
    if (!deleted) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_failed' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}