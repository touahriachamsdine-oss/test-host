import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { assertSameOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';
import { createMember, normalizeEmail } from '@/lib/members';
import { memberRegistrationSchema } from '@/lib/validation';
import { ConflictError, ForbiddenError } from '@/lib/db';

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'cross_origin' }, { status: 403 });
    }
    throw error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const parsed = memberRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path?.[0] ?? 'form';
    return NextResponse.json({ error: `invalid_${String(field)}` }, { status: 400 });
  }

  const ip = clientIp(request);
  const limitedIp = rateLimit(`register:${ip}`, 5, 3_600_000);
  const limitedEmail = rateLimit(`register-email:${parsed.data.email}`, 3, 3_600_000);
  if (!limitedIp.allowed || !limitedEmail.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSec: limitedIp.retryAfterSec ?? limitedEmail.retryAfterSec },
      { status: 429 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    await createMember({
      name: parsed.data.name,
      email: normalizeEmail(parsed.data.email),
      passwordHash
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}