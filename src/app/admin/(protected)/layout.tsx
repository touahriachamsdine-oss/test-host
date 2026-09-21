import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminLocale, getAdminMessages } from '../i18n';
import { AdminNav } from '../AdminNav';

export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);

  return (
    <div className="flex min-h-screen">
      <AdminNav
        role={session.user.role}
        teamDomain={session.user.teamDomain}
        userName={session.user.name ?? ''}
        locale={locale}
        messages={messages}
      />
      <main className="flex-1 overflow-x-auto px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}