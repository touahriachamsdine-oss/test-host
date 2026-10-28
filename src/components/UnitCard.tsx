import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Unit } from '@/data/units';

export async function UnitCard({
  unit,
  count,
  className
}: {
  unit: Unit;
  count: number;
  className?: string;
}) {
  const t = await getTranslations('Units');
  const names = await getTranslations('unitNames');
  const taglines = await getTranslations('unitTaglines');
  const Icon = unit.icon;

  return (
    <Link
      href={`/unit/${unit.slug}`}
      data-stagger
      aria-label={`${names(unit.slug)} — ${t('count', { count })}`}
      className={`group card-soft grid-guard flex h-full flex-col gap-2 p-3 sm:p-4 ${className ?? ''}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          dir="ltr"
          className="min-w-0 truncate font-mono text-xs font-medium leading-5 tabular-nums text-signal"
        >
          {unit.code}
        </span>
        <span dir="ltr" className="shrink-0 font-mono text-xs leading-5 tabular-nums text-ink/50">
          {String(count).padStart(2, '0')}
        </span>
      </span>
      <span className="min-w-0 text-[17px] font-medium leading-7 tracking-tight text-ink transition-colors duration-[var(--dur-base)] group-hover:text-signal">
        {names(unit.slug)}
      </span>
      <span className="text-sm leading-6 text-ink/55">{taglines(unit.slug)}</span>
      <span className="mt-auto flex items-center justify-between pt-1">
        <Icon size={16} aria-hidden className="text-ink/40 transition-colors duration-[var(--dur-base)] group-hover:text-signal" />
        <span
          aria-hidden
          className="flip-rtl font-mono text-sm leading-5 text-ink/40 transition-colors duration-[var(--dur-base)] group-hover:text-signal"
        >
          →
        </span>
      </span>
    </Link>
  );
}
