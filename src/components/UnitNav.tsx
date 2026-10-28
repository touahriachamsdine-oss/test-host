import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { UNITS } from '@/data/units';

/**
 * Header strip that lists the five support units and marks the current one, so
 * every unit page can be reached from the header of any other unit page.
 */
export async function UnitNav({ current }: { current?: string }) {
  const t = await getTranslations('Units');
  const names = await getTranslations('unitNames');

  return (
    <nav
      aria-label={t('navLabel')}
      className="flex flex-wrap items-center gap-1.5 border-y border-line/40 py-2"
    >
      <Link
        href="/units"
        aria-current={current ? undefined : 'page'}
        className={`ring-focus rounded-[3px] px-2 py-1 text-xs transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] ${
          current ? 'text-ink/50 hover:text-ink' : 'font-medium text-ink shadow-[inset_0_-2px_0_var(--signal)]'
        }`}
      >
        {t('backToUnits')}
      </Link>
      {UNITS.map((unit) => {
        const active = unit.slug === current;
        return (
          <Link
            key={unit.slug}
            href={`/unit/${unit.slug}`}
            aria-current={active ? 'page' : undefined}
            className={`ring-focus rounded-[3px] px-2 py-1 text-xs transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] ${
              active
                ? 'font-medium text-ink shadow-[inset_0_-2px_0_var(--signal)]'
                : 'text-ink/50 hover:text-ink'
            }`}
          >
            {names(unit.slug)}
          </Link>
        );
      })}
    </nav>
  );
}
