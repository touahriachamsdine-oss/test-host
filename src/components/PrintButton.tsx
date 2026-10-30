'use client';

import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PrintButton() {
  const t = useTranslations('Brief');

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ring-focus inline-flex items-center gap-2 rounded-[6px] border border-signal bg-signal px-4 py-2 text-sm font-medium text-paper transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)] active:scale-[0.99] motion-reduce:active:scale-100 print:hidden"
    >
      <Printer size={15} aria-hidden />
      {t('print')}
    </button>
  );
}
