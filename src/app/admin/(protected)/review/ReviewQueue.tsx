'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NextIntlClientProvider, useFormatter, useTranslations } from 'next-intl';
import { Check, X, Flag, ArrowUpDown } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';

type AdminStartupRow = {
  id: string;
  name: string;
  country: string;
  domain: string;
  subDomain?: string;
  shortDescription: string;
  technology: string;
  yearFounded: number;
  officialSite?: string;
  sourceUrl?: string;
  whyRelevant: string;
  priority: 'A' | 'B' | 'C';
  status: 'pending' | 'verified' | 'rejected';
  isDuplicate2025: boolean;
  submittedByTeam: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ReviewQueue({
  locale,
  messages
}: {
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <ReviewQueueInner />
    </NextIntlClientProvider>
  );
}

function ReviewQueueInner() {
  const t = useTranslations('Admin');
  const format = useFormatter();
  const [startups, setStartups] = useState<AdminStartupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [loadedFilter, setLoadedFilter] = useState<
    'pending' | 'verified' | 'rejected' | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loading = loadedFilter !== filter;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/startups?status=${filter}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error('load_failed');
        return data;
      })
      .then((data) => {
        if (!cancelled) {
          setStartups(data?.startups ?? []);
          setLoadedFilter(filter);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('review.errors.load'));
      });
    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey, t]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/startups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      setError(t('review.errors.action'));
      return;
    }
    setError(null);
    setRefreshKey((k) => k + 1);
  }

  const priorityColor: Record<string, string> = {
    A: 'bg-red-950 text-red-300',
    B: 'bg-amber-950 text-amber-300',
    C: 'bg-slate-800 text-slate-300'
  };

  return (
    <div>
      <h1 className="admin-title">{t('review.title')}</h1>
      <p className="admin-subtitle">{t('review.subtitle')}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(['pending', 'verified', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-teal-600 text-white'
                : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {s === 'pending' ? t('review.filterPending')
              : s === 'verified' ? t('review.filterVerified')
              : t('review.filterRejected')}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 admin-subtitle">{t('common.loading')}</p>
      ) : startups.length === 0 ? (
        <p className="mt-8 admin-subtitle">
          {t('review.empty', {
            filter: filter === 'pending' ? t('review.filterPending') : t(`status.${filter}`)
          })}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {startups.map((s) => (
            <div key={s.id} className="admin-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{s.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${priorityColor[s.priority]}`}>
                      P{s.priority}
                    </span>
                    {s.isDuplicate2025 && (
                      <span className="rounded-full bg-sky-950 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                        {t('review.duplicateBadge')}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        s.status === 'verified'
                          ? 'bg-emerald-950 text-emerald-300'
                          : s.status === 'rejected'
                            ? 'bg-red-950 text-red-300'
                            : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {t(`status.${s.status}`)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {s.domain} · {s.country} · {s.yearFounded ?? '—'}
                    {s.subDomain ? ` · ${s.subDomain}` : ''}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{s.shortDescription}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    <span className="font-semibold text-slate-300">{t('review.technologyLabel')}</span> {s.technology}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="font-semibold text-slate-300">{t('review.relevanceLabel')}</span> {s.whyRelevant}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {t('review.submittedOn', { date: format.dateTime(new Date(s.createdAt)) })}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/admin/submit?id=${encodeURIComponent(s.id)}`}
                    className="admin-btn admin-btn-secondary text-center"
                  >
                    {t('submit.editButton')}
                  </Link>
                  {s.status !== 'verified' && (
                    <button
                      onClick={() => patch(s.id, { status: 'verified' })}
                      className="admin-btn admin-btn-primary"
                    >
                      <Check size={15} aria-hidden />
                      {t('review.approve')}
                    </button>
                  )}
                  {s.status !== 'rejected' && (
                    <button
                      onClick={() => patch(s.id, { status: 'rejected' })}
                      className="admin-btn admin-btn-secondary"
                    >
                      <X size={15} aria-hidden />
                      {t('review.reject')}
                    </button>
                  )}
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <ArrowUpDown size={14} aria-hidden />
                    {t('review.priorityLabel')}
                    <select
                      value={s.priority}
                      onChange={(e) => patch(s.id, { priority: e.target.value as 'A' | 'B' | 'C' })}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </label>
                  <button
                    onClick={() => patch(s.id, { isDuplicate2025: !s.isDuplicate2025 })}
                    className="admin-btn admin-btn-secondary"
                  >
                    <Flag size={15} aria-hidden />
                    {s.isDuplicate2025 ? t('review.removeDuplicate') : t('review.markDuplicate')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}