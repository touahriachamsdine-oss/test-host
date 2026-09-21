import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getImportCandidates } from '@/lib/import';
import { getAdminLocale, getAdminMessages } from '../../i18n';
import { ImportSheet } from './ImportSheet';

export const dynamic = 'force-dynamic';

export default async function AdminImportPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'reviewer' && session.user.role !== 'admin') {
    redirect('/admin/review');
  }

  const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  const candidates = await getImportCandidates();

  return (
    <div>
      <h1 className="admin-title">{t('importPage.title')}</h1>
      <p className="admin-subtitle">{t('importPage.subtitle')}</p>
      <div className="mt-6">
        <ImportSheet candidates={candidates} locale={locale} messages={messages} />
      </div>
    </div>
  );
}