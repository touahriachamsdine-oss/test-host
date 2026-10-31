import { redirect } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { getMemberProfile } from '@/lib/members';
import { ProfileForm } from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Profile' });
  return { title: t('title') };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect({ href: '/login?callbackUrl=%2Fprofile', locale });
    return;
  }

  const profile = await getMemberProfile(session.user.id);
  if (!profile) {
    redirect({ href: '/login', locale });
    return;
  }

  const t = await getTranslations({ locale, namespace: 'Profile' });

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{t('subtitle')}</p>
      {(!profile.collegeId || !profile.roleType) && (
        <p className="mt-4 max-w-2xl rounded-xl border border-flag-gold/40 bg-flag-gold/[0.07] px-4 py-3 text-sm leading-6 text-ink/75">
          {t('completePrompt')}
        </p>
      )}
      <ProfileForm profile={profile} />
    </section>
  );
}
