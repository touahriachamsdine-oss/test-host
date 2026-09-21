import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDashboardStats } from '@/lib/admin';
import { getDomain } from '@/data/domains';
import { getAdminLocale, getAdminMessages } from '../../i18n';
import { DashboardCards } from './DashboardCards';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'admin') redirect('/admin/review');

  const actor = {
    id: session.user.id,
    role: session.user.role as 'admin',
    teamDomain: session.user.teamDomain ?? null
  };
  const stats = await getDashboardStats(actor);

  const domainNames = stats.byDomain.map((s) => ({
    ...s,
    name: getDomain(s.domain)?.slug ?? s.domain
  }));

  const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);

  return <DashboardCards stats={stats} domainNames={domainNames} locale={locale} messages={messages} />;
}