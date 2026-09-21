import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminLocale, getAdminMessages } from '../../i18n';
import { UsersManager } from './UsersManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'admin') redirect('/admin/review');

  const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);

  return <UsersManager locale={locale} messages={messages} />;
}