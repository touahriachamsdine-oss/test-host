import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Download, Mail } from 'lucide-react';
import { collegeLabel } from '@/data/colleges';
import { listDigestMembers } from '@/lib/digest';
import { getAdminLocale } from '../../i18n';

export const dynamic = 'force-dynamic';

export default async function AdminDigestPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'admin') redirect('/admin/review');

  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'Admin' });
  const members = await listDigestMembers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-ink">
            <Mail size={18} aria-hidden className="text-ink/50" />
            {t('digestPage.title')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/55">{t('digestPage.subtitle')}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a
          href="/api/admin/digest/export"
          className="ring-focus inline-flex items-center gap-2 rounded-[3px] border border-line/60 px-3 py-2 text-sm text-ink/75 hover:text-ink"
        >
          <Download size={14} aria-hidden />
          {t('digestPage.export')}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line/50 bg-paper/70 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink/45">{t('digestPage.optedIn')}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{members.length}</p>
        </div>
        <div className="rounded-xl border border-line/50 bg-paper/70 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink/45">{t('digestPage.interests')}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
            {members.reduce((sum, member) => sum + member.interests, 0)}
          </p>
        </div>
      </div>

      <p className="rounded-xl border border-line/50 bg-surface/30 px-4 py-3 text-xs leading-5 text-ink/55">
        {t('digestPage.deliveryNote')}
      </p>

      {members.length === 0 ? (
        <p className="rounded-xl border border-line/50 px-4 py-6 text-sm text-ink/55">
          {t('digestPage.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line/50">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line/60 bg-surface/40">
                {[
                  t('digestPage.name'),
                  t('digestPage.email'),
                  t('digestPage.college'),
                  t('digestPage.year'),
                  t('digestPage.interestsColumn'),
                  t('digestPage.joined')
                ].map((label) => (
                  <th
                    key={label}
                    className="px-3 py-2 text-start text-[11px] uppercase tracking-wide text-ink/45"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-line/40 last:border-0">
                  <td className="px-3 py-2 text-ink">{member.name}</td>
                  <td className="px-3 py-2 text-xs text-ink/60">{member.email}</td>
                  <td className="px-3 py-2 text-xs text-ink/60">
                    {member.collegeId ? collegeLabel(member.collegeId, locale) : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums text-ink/60">
                    {member.studyYear ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums text-ink/60">{member.interests}</td>
                  <td className="px-3 py-2 text-xs tabular-nums text-ink/50">
                    {new Date(member.joinedAt).toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
