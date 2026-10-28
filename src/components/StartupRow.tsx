'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Startup, StartupPriority } from '@/data/startups';
import { referenceCode } from '@/lib/reference';

const priorityMarker: Record<StartupPriority, string> = {
  A: 'border-signal bg-signal',
  B: 'border-flag-gold bg-flag-gold',
  C: 'border-ink/50'
};

export function StartupRow({
  startup,
  similar,
  className
}: {
  startup: Startup;
  similar?: string[];
  className?: string;
}) {
  const t = useTranslations('StartupCard');
  const priorityT = useTranslations('Priority');
  const code = referenceCode(startup.domain, startup.refNo);

  return (
    <Link
      href={`/startup/${startup.id}`}
      data-stagger
      className={`group card-soft grid-guard flex h-full flex-col gap-2 p-3 sm:p-4 ${className ?? ''}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span dir="ltr" className="min-w-0 truncate font-mono text-xs font-medium leading-5 tabular-nums text-signal">
          {code}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span
            aria-hidden
            className={`h-2.5 w-2.5 rounded-[2px] border ${priorityMarker[startup.priority]}`}
          />
          <span className="sr-only">{priorityT(startup.priority)}</span>
        </span>
      </span>

      <span className="min-w-0">
        <span
          className="block overflow-hidden text-[15px] font-semibold leading-6 tracking-tight text-ink transition-colors duration-[var(--dur-base)] group-hover:text-signal"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {startup.name}
        </span>
        <span
          className="mt-0.5 block overflow-hidden text-[13px] leading-[18px] text-ink/70"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {startup.shortDescription && startup.shortDescription !== startup.name
            ? startup.shortDescription
            : ''}
        </span>
      </span>

      {similar && similar.length > 0 && (
        <span className="block truncate text-xs leading-4 text-ink/50">
          {t('similarLabel')} {similar.slice(0, 2).join(', ')}
        </span>
      )}

      <span className="mt-auto flex min-w-0 items-center gap-2 text-sm leading-5 text-ink/60">
        <span className="min-w-0 truncate">
          {startup.hqCity && startup.hqCity !== startup.country
            ? `${startup.hqCity}, ${startup.country}`
            : startup.country}
          {startup.yearFounded > 0 ? `, ${startup.yearFounded}` : ''}
        </span>
        <span
          aria-hidden
          className="flip-rtl ms-auto shrink-0 font-mono text-sm leading-5 text-ink/40 transition-colors duration-[var(--dur-base)] group-hover:text-signal"
        >
          →
        </span>
      </span>
    </Link>
  );
}