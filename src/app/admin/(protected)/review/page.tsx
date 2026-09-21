import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminLocale, getAdminMessages } from '../../i18n';
import { ReviewQueue } from './ReviewQueue';

export const dynamic = 'force-dynamic';

export default async function AdminReviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role === 'team') redirect('/admin/submit');

  const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);

  return <ReviewQueue locale={locale} messages={messages} />;
}