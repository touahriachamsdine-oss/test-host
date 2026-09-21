'use client';

import { useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { Save } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';

type TeamRow = {
  code: string;
  name: string;
  domainSlug: string;
  quota: number;
  members: number;
  submissions: number;
  progressPct: number;
};

export function TeamsManager({
  teams,
  canEditQuota,
  locale,
  messages
}: {
  teams: TeamRow[];
  canEditQuota: boolean;
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <TeamsManagerInner teams={teams} canEditQuota={canEditQuota} />
    </NextIntlClientProvider>
  );
}

function TeamsManagerInner({
  teams,
  canEditQuota
}: {
  teams: TeamRow[];
  canEditQuota: boolean;
}) {
  const t = useTranslations('Admin');
  const [rows, setRows] = useState<TeamRow[]>(teams);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveQuota(row: TeamRow) {
    setBusy(row.code);
    setError(null);
    try {
      const res = await fetch(`/api/admin/teams/${row.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quota: row.quota })
      });
      if (!res.ok) throw new Error('save_failed');
      const data = await res.json();
      setRows((prev) => prev.map((r) => (r.code === row.code ? data.team : r)));
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
            <th className="px-4 py-3">{t('teams.colCode')}</th>
            <th className="px-4 py-3">{t('teams.colTeamDomain')}</th>
            <th className="px-4 py-3">{t('teams.colMembers')}</th>
            <th className="px-4 py-3">{t('teams.colSubmissions')}</th>
            <th className="px-4 py-3">{t('teams.colQuota')}</th>
            <th className="px-4 py-3">{t('teams.colProgress')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = Math.min(row.progressPct, 100);
            return (
              <tr key={row.code} className="border-t border-slate-800">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.code}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{row.name}</p>
                  <p className="font-mono text-xs text-slate-500">{row.domainSlug}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{row.members}</td>
                <td className="px-4 py-3 text-slate-300">{row.submissions}</td>
                <td className="px-4 py-3">
                  {canEditQuota ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={row.quota}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.code === row.code ? { ...r, quota: Number(e.target.value) } : r
                            )
                          )
                        }
                        className="w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => saveQuota(row)}
                        disabled={busy === row.code}
                        className="admin-btn admin-btn-primary !py-1.5 text-xs"
                      >
                        <Save size={13} aria-hidden />
                        {busy === row.code ? '…' : t('teams.saveOk')}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-300">{row.quota}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${row.progressPct >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{row.progressPct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}