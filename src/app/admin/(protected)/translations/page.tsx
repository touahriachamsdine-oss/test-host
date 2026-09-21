import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { listStartupsForAdmin } from '@/lib/admin';
import { listStartupTranslationsForAdmin } from '@/lib/startup-translations-admin';
import { getAdminLocale, getAdminMessages } from '../../i18n';
import { TranslationsManager } from './TranslationsManager';

export const dynamic = 'force-dynamic';

export default async function AdminTranslationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role === 'team') redirect('/admin/submit');

  const [startups, translations, locale, messages] = await Promise.all([
    listStartupsForAdmin(),
    listStartupTranslationsForAdmin({
      id: session.user.id,
      role: session.user.role as 'reviewer' | 'admin',
      teamDomain: session.user.teamDomain ?? null
    }),
    getAdminLocale(),
    getAdminMessages()
  ]);

  return (
    <TranslationsManager
      startups={startups}
      translations={translations}
      locale={locale}
      messages={messages}
    />
  );
}