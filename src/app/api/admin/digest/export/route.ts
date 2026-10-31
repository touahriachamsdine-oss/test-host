import { NextResponse } from 'next/server';
import { getActor } from '@/lib/api-auth';
import { ForbiddenError } from '@/lib/db';
import { listDigestMembers } from '@/lib/digest';
import { collegeLabel } from '@/data/colleges';

export const dynamic = 'force-dynamic';

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  try {
    await getActor(['admin']);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    throw error;
  }

  const members = await listDigestMembers();
  const header = ['name', 'email', 'college', 'study_year', 'specialty', 'interests', 'joined_at'];
  const lines = members.map((member) =>
    [
      member.name,
      member.email,
      member.collegeId ? collegeLabel(member.collegeId, 'fr') : '',
      member.studyYear ?? '',
      member.specialty ?? '',
      member.interests,
      member.joinedAt.slice(0, 10)
    ]
      .map(cell)
      .join(',')
  );

  return new Response(`\uFEFF${header.join(',')}\n${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="digest-members.csv"',
      'Cache-Control': 'no-store'
    }
  });
}
