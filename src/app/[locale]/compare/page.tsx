import { getTranslations } from 'next-intl/server';
import { getVerifiedByIds } from '@/lib/public-startups';
import { ComparePicker } from '@/components/ComparePicker';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Compare' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function ComparePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Compare' });
  const detail = await getTranslations({ locale, namespace: 'StartupDetail' });
  const names = await getTranslations({ locale, namespace: 'domainNames' });
  const priorityT = await getTranslations({ locale, namespace: 'Priority' });

  const ids = [sp.a, sp.b].filter((id): id is string => Boolean(id));
  const startups = ids.length > 0 ? await getVerifiedByIds(ids, locale as Locale) : [];
  const byId = new Map(startups.map((startup) => [startup.id, startup]));
  const a = sp.a ? byId.get(sp.a) ?? null : null;
  const b = sp.b ? byId.get(sp.b) ?? null : null;

  const domainName = (domain: string) => (names.has(domain) ? names(domain) : domain);
  const difficultyLabel = (score: number | null | undefined) => {
    if (typeof score !== 'number') return '—';
    if (score >= 70) return detail('difficultyHigh');
    if (score >= 40) return detail('difficultyMedium');
    return detail('difficultyLow');
  };
  const teamText = (rec: Array<{ count: number; role: string }> | null | undefined) =>
    rec && rec.length > 0 ? rec.map((item) => `${item.count}× ${item.role}`).join(', ') : '—';

  const rows = [
    { label: detail('domainLabel'), a: a ? domainName(a.domain) : '—', b: b ? domainName(b.domain) : '—' },
    { label: detail('countryLabel'), a: a?.country ?? '—', b: b?.country ?? '—' },
    {
      label: detail('yearLabel'),
      a: a && a.yearFounded > 0 ? String(a.yearFounded) : '—',
      b: b && b.yearFounded > 0 ? String(b.yearFounded) : '—'
    },
    { label: detail('priorityLabel'), a: a ? priorityT(a.priority) : '—', b: b ? priorityT(b.priority) : '—' },
    {
      label: detail('difficultyLabel'),
      a: a ? difficultyLabel(a.difficultyScore) : '—',
      b: b ? difficultyLabel(b.difficultyScore) : '—'
    },
    { label: detail('technologyLabel'), a: a?.technology ?? '—', b: b?.technology ?? '—' },
    { label: detail('teamRecLabel'), a: teamText(a?.teamRec), b: teamText(b?.teamRec) },
    { label: detail('buildApproachLabel'), a: a?.buildApproach ?? '—', b: b?.buildApproach ?? '—' },
    { label: detail('fixLabel'), a: a?.productIssues ?? '—', b: b?.productIssues ?? '—' },
    { label: detail('whyRelevantLabel'), a: a?.whyRelevant ?? '—', b: b?.whyRelevant ?? '—' },
    { label: detail('algeriaValueLabel'), a: a?.algeriaValue ?? '—', b: b?.algeriaValue ?? '—' }
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{t('subtitle')}</p>

      <ComparePicker a={a?.id ?? null} b={b?.id ?? null} />

      {a && b ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line/60">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line/60 bg-surface/40">
                <th className="w-40 px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-ink/45">
                  {t('fieldColumn')}
                </th>
                <th className="px-4 py-3 text-start text-ink">
                  <Link href={`/startup/${a.id}`} className="underline decoration-line underline-offset-2">
                    {a.name}
                  </Link>
                </th>
                <th className="px-4 py-3 text-start text-ink">
                  <Link href={`/startup/${b.id}`} className="underline decoration-line underline-offset-2">
                    {b.name}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-line/40 last:border-0 align-top">
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-ink/45">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-ink/80">{row.a}</td>
                  <td className="px-4 py-3 text-ink/80">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 max-w-2xl rounded-xl border border-line/50 px-4 py-6 text-sm leading-6 text-ink/55">
          {t('emptyHint')}
        </p>
      )}
    </section>
  );
}
