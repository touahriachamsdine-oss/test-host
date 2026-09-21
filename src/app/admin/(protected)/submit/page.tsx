import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getStartupForAdminById } from '@/lib/admin';
import type { AdminStartup } from '@/lib/db';
import { getAdminLocale, getAdminMessages } from '../../i18n';
import { SubmitForm } from './SubmitForm';
import { MySubmissions } from './MySubmissions';

export const dynamic = 'force-dynamic';

export default async function AdminSubmitPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const sp = await searchParams;
  const editId = sp?.id ?? null;

  let initial: AdminStartup | null = null;
  if (editId) {
    const record = await getStartupForAdminById(editId);
    const isTeam = session.user.role === 'team';
    if (!record || (isTeam && record.submittedByTeam !== session.user.id)) {
      redirect('/admin/submit');
    }
    initial = record;
  }

  const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);

  return (
    <div className="space-y-10">
      <SubmitForm
        teamDomain={session.user.teamDomain ?? null}
        locale={locale}
        messages={messages}
        editId={editId}
        initial={initial}
      />
      <MySubmissions actorId={session.user.id} locale={locale} messages={messages} />
    </div>
  );
}