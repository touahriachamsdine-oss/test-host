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

export function StartupCard({
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
      className={`group grid-guard panel-glass tile-hover flex h-full flex-col gap-3 p-5 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span dir="ltr" className="min-w-0 truncate font-mono text-sm font-medium leading-5 text-signal">
          {code}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span
            aria-hidden
            className={`h-3.5 w-3.5 rounded-[3px] border ${priorityMarker[startup.priority]}`}
          />
          <span className="sr-only">{priorityT(startup.priority)}</span>
        </span>
      </div>

      <h3 className="text-[22px] font-semibold leading-[30px] tracking-tight text-ink transition-colors duration-[var(--dur-base)] group-hover:text-signal">
        {startup.name}
      </h3>
      <p className="text-sm leading-5 text-ink/60">
        {startup.country}
        {startup.yearFounded > 0 ? `, ${startup.yearFounded}` : ''}
      </p>

      <p className="flex-1 line-clamp-3 text-base leading-[26px] text-ink/80">
        {startup.shortDescription}
      </p>

      {similar && similar.length > 0 && (
        <p className="pt-3 text-sm leading-5 text-ink/70">
          {t('similarLabel')}{' '}
          <span className="text-ink/60 underline decoration-line underline-offset-2">
            {similar.join(', ')}
          </span>
        </p>
      )}
    </Link>
  );
}