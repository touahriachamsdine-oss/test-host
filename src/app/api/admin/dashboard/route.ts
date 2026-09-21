import { NextResponse } from 'next/server';
import { getActor } from '@/lib/api-auth';
import { getDashboardStats, listAuditLog } from '@/lib/admin';
import { ForbiddenError } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await getActor(['admin']);
    const { searchParams } = new URL(request.url);
    if (searchParams.get('audit') === 'true') {
      const log = await listAuditLog(actor);
      return NextResponse.json({ log });
    }
    const stats = await getDashboardStats(actor);
    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}