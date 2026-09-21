'use client';

import { useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { Save } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';

type DomainRow = {
  slug: string;
  labelEn: string;
  labelAr: string;
  validationStatus: 'TO_CHECK' | 'IN_PROGRESS' | 'VALIDATED' | 'REJECTED';
  priorityTier: 'A' | 'B' | 'C' | null;
  startupCount: number;
};

export function DomainManager({
  domains,
  locale,
  messages
}: {
  domains: DomainRow[];
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <DomainManagerInner domains={domains} />
    </NextIntlClientProvider>
  );
}

function DomainManagerInner({ domains }: { domains: DomainRow[] }) {
  const t = useTranslations('Admin');
  const [rows, setRows] = useState<DomainRow[]>(domains);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const STATUS_KEYS: Record<DomainRow['validationStatus'], string> = {
    TO_CHECK: 'statusToCheck',
    IN_PROGRESS: 'statusInProgress',
    VALIDATED: 'statusValidated',
    REJECTED: 'statusRejected'
  };

  function patch(row: DomainRow, field: 'validationStatus' | 'priorityTier', value: string | null) {
    setRows((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, [field]: value } : r)));
  }

  async function save(row: DomainRow) {
    setBusy(row.slug);
    setError(null);
    try {
      const res = await fetch(`/api/admin/domains/${row.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationStatus: row.validationStatus, priorityTier: row.priorityTier })
      });
      if (!res.ok) throw new Error('save_failed');
      const data = await res.json();
      setRows((prev) => prev.map((r) => (r.slug === row.slug ? data.domain : r)));
    } catch {
      setError(t('common.saveError'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-card overflow-x-auto">
      {error && (
        <div className="border-b border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">{t('domains.colDomain')}</th>
            <th className="px-4 py-3">{t('domains.colArabic')}</th>
            <th className="px-4 py-3">{t('domains.colStartups')}</th>
            <th className="px-4 py-3">{t('domains.colValidationTier')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug} className="border-t border-slate-800">
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-slate-200">{row.labelEn}</p>
                <p className="font-mono text-xs text-slate-500">{row.slug}</p>
              </td>
              <td className="px-4 py-3 align-top text-slate-300" dir="rtl" lang="ar">
                {row.labelAr}
              </td>
              <td className="px-4 py-3 align-top text-slate-300">{row.startupCount}</td>
              <td className="px-4 py-3 align-top">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.validationStatus}
                    onChange={(e) =>
                      patch(row, 'validationStatus', e.target.value as DomainRow['validationStatus'])
                    }
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                  >
                    {(Object.keys(STATUS_KEYS) as DomainRow['validationStatus'][]).map((s) => (
                    <option key={s} value={s}>
                      {t(`domains.${STATUS_KEYS[s]}`)}
                    </option>
                  ))}
                  </select>
                  <select
                    value={row.priorityTier ?? ''}
                    onChange={(e) => patch(row, 'priorityTier', e.target.value === '' ? null : (e.target.value as 'A' | 'B' | 'C'))}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                  >
                    <option value="">{t('domains.noTier')}</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => save(row)}
                    disabled={busy === row.slug}
                    className="admin-btn admin-btn-primary !py-1.5 text-xs"
                  >
                    <Save size={13} aria-hidden />
                    {busy === row.slug ? '…' : t('domains.save')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}