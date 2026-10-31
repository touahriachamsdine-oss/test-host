import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listReports, type ReportStatus } from '@/lib/reports';
import { getAdminLocale } from '../../i18n';
import { ReportActions } from './ReportActions';

export const dynamic = 'force-dynamic';

const STATUSES: Array<ReportStatus | 'all'> = ['open', 'resolved', 'dismissed', 'all'];

const REASON_KEY: Record<string, string> = {
  wrong_info: 'reasonWrongInfo',
  translation: 'reasonTranslation',
  broken_link: 'reasonBrokenLink',
  duplicate: 'reasonDuplicate',
  other: 'reasonOther'
};

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'reviewer' && session.user.role !== 'admin') {
    redirect('/admin/review');
  }

  const params = await searchParams;
  const status = STATUSES.includes(params.status as ReportStatus) ? (params.status as ReportStatus) : 'open';

  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'Admin' });
  const reports = await listReports(status);

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div>
      <h1 className="admin-title">{t('reportsPage.title')}</h1>
      <p className="admin-subtitle">{t('reportsPage.subtitle')}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/reports?status=${value}`}
            className={
              value === status
                ? 'rounded-full border border-emerald-400/60 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200'
                : 'rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500'
            }
          >
            {t(`reportsPage.filter_${value}`)}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-6 text-sm text-slate-400">
          {t('reportsPage.empty')}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-start">{t('reportsPage.colDate')}</th>
                <th className="px-4 py-3 text-start">{t('reportsPage.colProject')}</th>
                <th className="px-4 py-3 text-start">{t('reportsPage.colReason')}</th>
                <th className="px-4 py-3 text-start">{t('reportsPage.colNote')}</th>
                <th className="px-4 py-3 text-start">{t('reportsPage.colReporter')}</th>
                <th className="px-4 py-3 text-start">{t('reportsPage.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports.map((report) => (
                <tr key={report.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {dateFormat.format(new Date(report.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/startup/${report.startupId}`}
                      className="text-slate-100 underline decoration-slate-600 underline-offset-2 hover:decoration-slate-300"
                    >
                      {report.startupName}
                    </Link>
                    <span className="mt-0.5 block text-xs text-slate-500">{report.startupId}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                    {t(`reportsPage.${REASON_KEY[report.reason] ?? 'reasonOther'}`)}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-300">{report.note ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {report.reporterName ?? t('reportsPage.anonymous')}
                    {report.reporterEmail && (
                      <span className="mt-0.5 block text-slate-500">{report.reporterEmail}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ReportActions id={report.id} status={report.status} />
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
