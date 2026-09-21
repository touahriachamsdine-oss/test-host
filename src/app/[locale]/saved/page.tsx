import { redirect } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { getSavedIds } from '@/lib/members';
import { getVerifiedByIds } from '@/lib/public-startups';
import { SavedProvider } from '@/components/SavedProvider';
import { SavedList } from '@/components/SavedList';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Saved' });
  return {
    title: t('title')
  };
}

export default async function SavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
    return;
  }

  const ids = await getSavedIds(session.user.id);
  const startups = await getVerifiedByIds(ids, locale as Locale);

  return (
    <SavedProvider initialIds={ids}>
      <SavedList startups={startups} />
    </SavedProvider>
  );
}