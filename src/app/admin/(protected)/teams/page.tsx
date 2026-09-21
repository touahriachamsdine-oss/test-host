import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { listTeamsForAdmin } from '@/lib/admin';
import { getAdminLocale, getAdminMessages } from '../../i18n';
import { TeamsManager } from './TeamsManager';

export const dynamic = 'force-dynamic';

export default async function AdminTeamsPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'reviewer' && session.user.role !== 'admin') {
    redirect('/admin/review');
  }

  const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  const actor = {
    id: session.user.id,
    role: session.user.role as 'reviewer' | 'admin',
    teamDomain: session.user.teamDomain ?? null
  };
  const teams = await listTeamsForAdmin(actor);

  return (
    <div>
      <h1 className="admin-title">{t('teamsPage.title')}</h1>
      <p className="admin-subtitle">{t('teamsPage.subtitle')}</p>
      <div className="mt-6">
        <TeamsManager teams={teams} canEditQuota={session.user.role === 'admin'} locale={locale} messages={messages} />
      </div>
    </div>
  );
}