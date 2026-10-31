import { getTranslations } from 'next-intl/server';
import { WifiOff } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Offline' });
  return { title: t('title') };
}

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Offline' });

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 pb-24 pt-24 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-signal/10 text-signal">
        <WifiOff size={26} aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-3 text-sm leading-6 text-ink/60">{t('text')}</p>
      <Link
        href="/"
        className="ring-focus mt-6 inline-flex rounded-[3px] bg-signal px-4 py-2 text-sm font-medium text-paper"
      >
        {t('home')}
      </Link>
    </section>
  );
}
