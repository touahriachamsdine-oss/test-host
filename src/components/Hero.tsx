import { getLocale, getTranslations } from 'next-intl/server';
import { Search } from 'lucide-react';
import { getPathname } from '@/i18n/navigation';
import { StatsStrip } from '@/components/StatsStrip';

export async function Hero({
  stats
}: {
  stats: { entries: number; domains: number; teams: number; countries: number; mapped: number };
}) {
  const t = await getTranslations('Hero');
  const locale = await getLocale();
  const browsePath = getPathname({ locale, href: '/browse' });
  const nf = new Intl.NumberFormat(locale);

  const ledger = [
    { label: t('entriesLabel'), value: nf.format(stats.entries) },
    { label: t('domainsLabel'), value: nf.format(stats.domains) },
    { label: t('countriesLabel'), value: nf.format(stats.countries) },
    { label: t('mappedLabel'), value: nf.format(stats.mapped) }
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl card-soft">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,color-mix(in_srgb,var(--signal)_12%,transparent),transparent_60%)]"
        />
        <div className="relative rise-in px-6 pb-8 pt-8 sm:px-8 sm:pt-10">
          <p
            dir="ltr"
            style={{ '--n': 0 } as React.CSSProperties}
            className="font-mono text-sm leading-5 text-ink/50"
          >
            {t('publication')}
          </p>
          <h1
            style={{ '--n': 1 } as React.CSSProperties}
            className="mt-4 max-w-3xl text-[32px] font-semibold leading-10 tracking-tight text-ink sm:text-[40px] sm:leading-[48px]"
          >
            {t('title')}{' '}
            <span className="text-shimmer">{t('highlight')}</span>
          </h1>
          <p
            style={{ '--n': 2 } as React.CSSProperties}
            className="mt-3 max-w-2xl text-base leading-[26px] text-ink/70"
          >
            {t('subtitle')}
          </p>

          <form
            action={browsePath}
            method="get"
            className="mt-8 max-w-md"
            style={{ '--n': 3 } as React.CSSProperties}
          >
            <label className="relative block">
              <Search
                size={16}
                className="absolute start-2 top-1/2 -translate-y-1/2 text-ink/40"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="w-full rounded-xl field-glass ring-focus py-2.5 ps-8 pe-2 text-base text-ink placeholder:text-ink/40 transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)]"
              />
            </label>
            <button
              type="submit"
              className="mt-4 h-11 rounded-xl bg-signal px-5 text-sm font-medium text-paper shadow-[0_12px_26px_-14px_var(--signal)] transition-[background-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90 hover:shadow-[0_16px_32px_-14px_var(--signal)] active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {t('searchButton')}
            </button>
          </form>
        </div>

        <StatsStrip items={ledger} />
      </div>
      <div className="mt-12 fade-divider" />
    </section>
  );
}