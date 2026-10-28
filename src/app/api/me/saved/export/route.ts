import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSavedIds } from '@/lib/members';
import { getVerifiedByIds } from '@/lib/public-startups';

const HEADERS = [
  'Name',
  'Domain',
  'Country',
  'City',
  'Year founded',
  'Priority',
  'Description',
  'Technology',
  'Website',
  'Source'
];

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ids = await getSavedIds(session.user.id);
  const startups = await getVerifiedByIds(ids, 'en');

  const lines = [
    HEADERS.join(','),
    ...startups.map((startup) =>
      [
        startup.name,
        startup.domain,
        startup.country,
        startup.hqCity,
        startup.yearFounded > 0 ? startup.yearFounded : '',
        startup.priority,
        startup.shortDescription,
        startup.technology,
        startup.officialSite,
        startup.sourceUrl
      ]
        .map(csvCell)
        .join(',')
    )
  ];

  return new NextResponse(`\uFEFF${lines.join('\r\n')}`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="saved-projects.csv"'
    }
  });
}
