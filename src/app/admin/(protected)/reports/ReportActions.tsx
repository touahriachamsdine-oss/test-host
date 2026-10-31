'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ReportStatus } from '@/lib/reports';

export function ReportActions({ id, status }: { id: number; status: ReportStatus }) {
  const t = useTranslations('Admin.reportsPage');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function update(next: ReportStatus) {
    setError(false);
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: next })
        });
        if (!response.ok) {
          setError(true);
          return;
        }
        router.refresh();
      } catch {
        setError(true);
      }
    });
  }

  const next: Array<{ value: ReportStatus; label: string }> =
    status === 'open'
      ? [
          { value: 'resolved', label: t('resolve') },
          { value: 'dismissed', label: t('dismiss') }
        ]
      : [{ value: 'open', label: t('reopen') }];

  return (
    <div className="flex flex-col gap-1">
      {next.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={pending}
          onClick={() => update(option.value)}
          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500 disabled:opacity-50"
        >
          {option.label}
        </button>
      ))}
      {error && <span className="text-xs text-red-400">{t('failed')}</span>}
    </div>
  );
}
