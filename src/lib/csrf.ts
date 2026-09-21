import { NextRequest } from 'next/server';
import { ForbiddenError } from '@/lib/db';

export function assertSameOrigin(request: Request | NextRequest): void {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return;
  let originHost = '';
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ForbiddenError();
  }
  if (originHost !== host) {
    throw new ForbiddenError('Cross-origin request rejected');
  }
}