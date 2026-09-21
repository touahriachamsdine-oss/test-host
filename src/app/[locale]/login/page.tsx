import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/MemberAuthForms';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  return {
    title: t('loginTitle')
  };
}

function safeCallbackUrl(raw: string | undefined): string {
  if (!raw) return '/';
  const normalized = raw.replace(/\\/g, '/');
  try {
    const base = 'http://local.invalid';
    const url = new URL(normalized, base);
    if (url.origin !== base) return '/';
    if (!url.pathname.startsWith('/') || url.pathname.startsWith('//')) return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const t = await getTranslations('Auth');

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-12 sm:px-6">
      <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
        {t('welcome')}
      </h1>
      <div className="mt-8 w-full max-w-md">
        <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />
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