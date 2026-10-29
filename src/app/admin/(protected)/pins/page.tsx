import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { query } from '@/lib/db';
import { collegeLabel } from '@/data/colleges';
import { getAdminLocale } from '../../i18n';

export const dynamic = 'force-dynamic';

interface PinnedRow {
  id: string;
  name: string;
  domain: string;
  pins: number;
}

interface PinMemberRow {
  startup_id: string;
  name: string;
  college_id: string | null;
  study_year: number | null;
}

export default async function AdminPinsPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'reviewer' && session.user.role !== 'admin') {
    redirect('/admin/review');
  }

  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'Admin' });

  const [projects, members] = await Promise.all([
    query<PinnedRow>(
      `SELECT s.id, s.name, s.domain, COUNT(*)::int AS pins
       FROM startup_flags f
       JOIN startups s ON s.id = f.startup_id
       GROUP BY s.id, s.name, s.domain
       ORDER BY pins DESC, s.name
       LIMIT 200`
    ),
    query<PinMemberRow>(
      `SELECT f.startup_id, m.name, m.college_id, m.study_year
       FROM startup_flags f
       JOIN members m ON m.id = f.member_id
       ORDER BY m.name`
    )
  ]);

  const byProject = new Map<string, PinMemberRow[]>();
  for (const member of members) {
    const list = byProject.get(member.startup_id) ?? [];
    list.push(member);
    byProject.set(member.startup_id, list);
  }

  return (
    <div>
      <h1 className="admin-title">{t('pinsPage.title')}</h1>
      <p className="admin-subtitle">{t('pinsPage.subtitle')}</p>

      {projects.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-6 text-sm text-slate-400">
          {t('pinsPage.empty')}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('pinsPage.project')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('pinsPage.domain')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('pinsPage.count')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('pinsPage.pinnedBy')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projects.map((project) => (
                <tr key={project.id} className="align-top">
                  <td className="px-4 py-3">
                    <a
                      href={`/startup/${project.id}`}
                      className="font-medium text-white underline-offset-2 hover:underline"
                      dir="ltr"
                    >
                      {project.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400" dir="ltr">
                    {project.domain}
                  </td>
                  <td className="px-4 py-3 text-end font-mono tabular-nums text-white">{project.pins}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <ul className="flex flex-col gap-1">
                      {(byProject.get(project.id) ?? []).map((member, index) => (
                        <li key={`${member.name}-${index}`} className="text-xs">
                          <span className="text-slate-200">{member.name}</span>
                          {member.college_id && (
                            <span className="text-slate-500">
                              {' — '}
                              {collegeLabel(member.college_id, locale)}
                            </span>
                          )}
                          {member.study_year && (
                            <span className="font-mono text-slate-500" dir="ltr">
                              {' · '}
                              {member.study_year}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
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
