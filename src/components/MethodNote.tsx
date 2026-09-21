import { getTranslations } from 'next-intl/server';
import type { StartupPriority } from '@/data/startups';

const squares: Record<StartupPriority, string> = {
  A: 'border-signal bg-signal',
  B: 'border-flag-gold bg-flag-gold',
  C: 'border-ink/50'
};

export async function MethodNote() {
  const t = await getTranslations('HowItWorks');
  const priorityT = await getTranslations('Priority');

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="py-12">
        <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('title')}</h2>
        <p className="mt-2 max-w-xl text-base leading-[26px] text-ink/70">{t('intro')}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <span
            dir="ltr"
            className="inline-flex items-center rounded-md field-glass px-3 py-1.5 font-mono text-sm font-medium text-signal"
          >
            AI · 014
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/70">
            <span className="flex items-center gap-2">
              <span className={`h-3.5 w-3.5 rounded-[3px] border ${squares.A}`} aria-hidden />
              {priorityT('A')}
            </span>
            <span className="flex items-center gap-2">
              <span className={`h-3.5 w-3.5 rounded-[3px] border ${squares.B}`} aria-hidden />
              {priorityT('B')}
            </span>
            <span className="flex items-center gap-2">
              <span className={`h-3.5 w-3.5 rounded-[3px] border ${squares.C}`} aria-hidden />
              {priorityT('C')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}