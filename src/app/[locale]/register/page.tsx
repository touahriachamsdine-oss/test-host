import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegisterForm } from '@/components/MemberAuthForms';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  return {
    title: t('createAccountLong')
  };
}

export default async function RegisterPage() {
  const t = await getTranslations('Auth');

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-12 sm:px-6">
      <div className="mt-8 w-full max-w-2xl sm:mt-0">
        <RegisterForm />
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-sm text-ink/60 underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-ink motion-reduce:transition-none"
      >
        <span aria-hidden>←</span>
        {t('backHome')}
      </Link>
    </section>
  );
}