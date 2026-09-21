import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('NotFound');

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="border-b border-line pb-6">
        <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {t('title')}
        </h1>
      </header>
      <p className="mt-6 max-w-xl text-base leading-[26px] text-ink/70">{t('text')}</p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm text-signal underline underline-offset-2"
      >
        {t('home')}
      </Link>
    </section>
  );
}