import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function Footer() {
  const t = await getTranslations('Footer');
  const nav = await getTranslations('Navbar');

  return (
    <footer className="bg-gradient-to-b from-transparent to-paper/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold tracking-tight text-ink">{nav('brand')}</span>
            <span className="font-mono text-sm font-medium text-signal">{nav('brandTag')}</span>
          </p>
          <p className="mt-2 text-sm leading-5 text-ink/60">{t('tagline')}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <span className="text-sm font-medium text-ink">{t('exploreTitle')}</span>
          <Link href="/" className="w-fit rounded-[2px] text-ink/60 underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-ink">
            {nav('home')}
          </Link>
          <Link href="/browse" className="w-fit rounded-[2px] text-ink/60 underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-ink">
            {nav('browse')}
          </Link>
          <Link href="/collaborate" className="w-fit rounded-[2px] text-ink/60 underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-ink">
            {nav('collaborate')}
          </Link>
          <Link href="/units" className="w-fit rounded-[2px] text-ink/60 underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-ink">
            {nav('units')}
          </Link>
        </nav>

        <nav aria-label={t('legalTitle')} className="flex flex-col gap-2 text-sm">
          <span className="text-sm font-medium text-ink">{t('legalTitle')}</span>
          <Link href="/policy" className="w-fit rounded-[2px] text-ink/60 underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-ink">
            {t('policy')}
          </Link>
        </nav>
      </div>
      <hr className="fade-divider mx-auto max-w-6xl sm:px-6" />
      <div className="px-4 py-4 text-center text-xs text-ink/40">
        <p>
          © {new Date().getFullYear()} {nav('brand')} {nav('brandTag')} — {t('rights')}
        </p>
        <p className="mt-1 text-signal/70">{t('credit')}</p>
      </div>
    </footer>
  );
}