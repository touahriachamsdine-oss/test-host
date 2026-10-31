import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { query } from '@/lib/db';
import { collegeLabel } from '@/data/colleges';
import { getAdminLocale } from '../../i18n';

export const dynamic = 'force-dynamic';

interface TotalsRow {
  total: number;
  last7: number;
  last30: number;
  colleges: number;
}

interface DayRow {
  day: string;
  views: number;
}

interface ProjectRow {
  id: string;
  name: string;
  views: number;
}

interface CollegeRow {
  college_id: string | null;
  views: number;
}

interface LocaleRow {
  locale: string;
  views: number;
}

const LANGUAGE_NAMES: Record<string, string> = { ar: 'العربية', fr: 'Français', en: 'English' };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'admin') redirect('/admin/review');

  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'Admin' });

  const [totals, days, projects, colleges, languages] = await Promise.all([
    query<TotalsRow>(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS last7,
              COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS last30,
              COUNT(DISTINCT college_id) FILTER (WHERE college_id IS NOT NULL)::int AS colleges
       FROM page_views`
    ),
    query<DayRow>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(v.views, 0)::int AS views
       FROM generate_series(current_date - interval '29 days', current_date, interval '1 day') AS d(day)
       LEFT JOIN (
         SELECT date_trunc('day', created_at) AS day, COUNT(*) AS views
         FROM page_views WHERE created_at >= current_date - interval '30 days'
         GROUP BY 1
       ) v ON v.day = d.day
       ORDER BY d.day`
    ),
    query<ProjectRow>(
      `SELECT p.startup_id AS id, COALESCE(s.name, p.startup_id) AS name, COUNT(*)::int AS views
       FROM page_views p
       LEFT JOIN startups s ON s.id = p.startup_id
       WHERE p.startup_id IS NOT NULL
       GROUP BY p.startup_id, s.name
       ORDER BY views DESC, name
       LIMIT 10`
    ),
    query<CollegeRow>(
      `SELECT college_id, COUNT(*)::int AS views
       FROM page_views
       GROUP BY college_id
       ORDER BY views DESC
       LIMIT 10`
    ),
    query<LocaleRow>(
      `SELECT locale, COUNT(*)::int AS views FROM page_views GROUP BY locale ORDER BY views DESC`
    )
  ]);

  const stats = totals[0] ?? { total: 0, last7: 0, last30: 0, colleges: 0 };
  const maxDay = Math.max(1, ...days.map((d) => d.views));
  const languageTotal = Math.max(1, languages.reduce((sum, row) => sum + row.views, 0));
  const nf = new Intl.NumberFormat(locale);

  const kpis = [
    { label: t('analyticsPage.totalViews'), value: stats.total },
    { label: t('analyticsPage.last7'), value: stats.last7 },
    { label: t('analyticsPage.last30'), value: stats.last30 },
    { label: t('analyticsPage.colleges'), value: stats.colleges }
  ];

  return (
    <div>
      <h1 className="admin-title">{t('analyticsPage.title')}</h1>
      <p className="admin-subtitle">{t('analyticsPage.subtitle')}</p>

      {stats.total === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-6 text-sm text-slate-400">
          {t('analyticsPage.empty')}
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
                  {nf.format(kpi.value)}
                </p>
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="text-sm font-medium text-slate-300">{t('analyticsPage.viewsByDay')}</h2>
            <div className="mt-4 flex h-40 items-end gap-1">
              {days.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    title={`${day.day}: ${day.views}`}
                    className="w-full rounded-t-[2px] bg-emerald-500/70"
                    style={{ height: `${Math.max(2, (day.views / maxDay) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500" dir="ltr">
              <span>{days[0]?.day}</span>
              <span>{days[days.length - 1]?.day}</span>
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="text-sm font-medium text-slate-300">{t('analyticsPage.topProjects')}</h2>
              <ul className="mt-3 flex flex-col divide-y divide-slate-800">
                {projects.map((project) => (
                  <li key={project.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <a
                      href={`/startup/${project.id}`}
                      className="min-w-0 truncate text-slate-200 underline-offset-2 hover:underline"
                    >
                      {project.name}
                    </a>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
                      {nf.format(project.views)}
                    </span>
                    <a
                      href={`/admin/translations?q=${encodeURIComponent(project.id)}`}
                      className="shrink-0 text-[11px] text-emerald-300 underline-offset-2 hover:underline"
                    >
                      {t('analyticsPage.reviewTranslation')}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="text-sm font-medium text-slate-300">{t('analyticsPage.topColleges')}</h2>
              <ul className="mt-3 flex flex-col divide-y divide-slate-800">
                {colleges.map((college, index) => (
                  <li
                    key={college.college_id ?? `none-${index}`}
                    className="flex items-baseline justify-between gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-slate-200">
                      {college.college_id
                        ? collegeLabel(college.college_id, locale)
                        : t('analyticsPage.empty')}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
                      {nf.format(college.views)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="text-sm font-medium text-slate-300">{t('analyticsPage.languages')}</h2>
            <div className="mt-4 flex flex-col gap-3">
              {languages.map((row) => (
                <div key={row.locale} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-slate-300">{LANGUAGE_NAMES[row.locale] ?? row.locale}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-emerald-500/70"
                      style={{ width: `${Math.round((row.views / languageTotal) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-end font-mono text-xs tabular-nums text-slate-400">
                    {nf.format(row.views)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
