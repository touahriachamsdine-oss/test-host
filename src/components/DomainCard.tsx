import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Domain } from '@/data/domains';

export async function DomainCard({
  domain,
  count,
  className
}: {
  domain: Domain;
  count: number;
  className?: string;
}) {
  const t = await getTranslations('Domains');
  const names = await getTranslations('domainNames');

  return (
    <Link
      href={`/domain/${domain.slug}`}
      data-stagger
      aria-label={`${names(domain.slug)} — ${t('count', { count })}`}
      className={`group card-soft grid-guard flex h-full flex-col gap-2 p-3 sm:p-4 ${className ?? ''}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span dir="ltr" className="min-w-0 truncate font-mono text-xs font-medium leading-5 tabular-nums text-signal">
          {domain.code}
        </span>
        <span dir="ltr" className="shrink-0 font-mono text-xs leading-5 tabular-nums text-ink/50">
          {String(count).padStart(2, '0')}
        </span>
      </span>
      <span className="min-w-0 text-[17px] font-medium leading-7 tracking-tight text-ink transition-colors duration-[var(--dur-base)] group-hover:text-signal">
        {names(domain.slug)}
      </span>
      <span
        aria-hidden
        className="flip-rtl mt-auto self-end font-mono text-sm leading-5 text-ink/40 transition-colors duration-[var(--dur-base)] group-hover:text-signal"
      >
        →
      </span>
    </Link>
  );
}