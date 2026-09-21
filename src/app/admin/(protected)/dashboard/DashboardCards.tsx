'use client';

import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';
import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  FileWarning,
  Percent
} from 'lucide-react';

type DashboardStats = {
  totals: {
    total: number;
    proposed: number;
    validated: number;
    rejected: number;
    duplicates: number;
    progressPct: number;
  };
  byDomain: {
    domain: string;
    name?: string;
    total: number;
    validated: number;
    pending: number;
    rejected: number;
    duplicates: number;
  }[];
  byStatus: { status: string; count: number }[];
  byTeam: {
    userId: string | null;
    userEmail: string | null;
    teamDomain: string | null;
    total: number;
    validated: number;
    pending: number;
  }[];
  teamsQuotas: {
    code: string;
    name: string;
    domainSlug: string;
    quota: number;
    members: number;
    submissions: number;
    progressPct: number;
  }[];
};

export function DashboardCards({
  stats,
  domainNames,
  locale,
  messages
}: {
  stats: DashboardStats;
  domainNames: DashboardStats['byDomain'];
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <DashboardCardsInner stats={stats} domainNames={domainNames} />
    </NextIntlClientProvider>
  );
}

function DashboardCardsInner({
  stats,
  domainNames
}: {
  stats: DashboardStats;
  domainNames: DashboardStats['byDomain'];
}) {
  const t = useTranslations('Admin');
  const cards = [
    { label: t('dashboard.cardProposed'), value: stats.totals.proposed, icon: Clock, color: 'text-amber-400' },
    { label: t('dashboard.cardValidated'), value: stats.totals.validated, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: t('dashboard.cardRejected'), value: stats.totals.rejected, icon: FileWarning, color: 'text-red-400' },
    { label: t('dashboard.cardDuplicates'), value: stats.totals.duplicates, icon: Copy, color: 'text-sky-400' },
    { label: t('dashboard.cardProgress'), value: `${stats.totals.progressPct}%`, icon: Percent, color: 'text-teal-400' },
    { label: t('dashboard.cardTotal'), value: stats.totals.total, icon: Activity, color: 'text-slate-300' }
  ];

  const byDomain = domainNames.map((d) => ({
    ...d,
    name: d.name ?? d.domain
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-title">{t('dashboard.title')}</h1>
        <p className="admin-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="admin-card">
            <card.icon size={18} className={card.color} aria-hidden />
            <p className="mt-3 text-2xl font-bold text-white">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t('dashboard.byDomainTitle')}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2">{t('dashboard.colDomain')}</th>
                <th className="pb-2">{t('dashboard.colTotal')}</th>
                <th className="pb-2">{t('dashboard.colValidated')}</th>
                <th className="pb-2">{t('dashboard.colPending')}</th>
                <th className="pb-2">{t('dashboard.colRejected')}</th>
                <th className="pb-2">{t('dashboard.colDuplicates')}</th>
              </tr>
            </thead>
            <tbody>
              {byDomain.map((d) => (
                <tr key={d.domain} className="border-t border-slate-800">
                  <td className="py-2 font-medium text-slate-200">{d.name}</td>
                  <td className="py-2 text-slate-300">{d.total}</td>
                  <td className="py-2 text-emerald-400">{d.validated}</td>
                  <td className="py-2 text-amber-400">{d.pending}</td>
                  <td className="py-2 text-red-400">{d.rejected}</td>
                  <td className="py-2 text-sky-400">{d.duplicates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t('dashboard.byTeamTitle')}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2">{t('dashboard.colTeam')}</th>
                <th className="pb-2">{t('dashboard.colSubmissions')}</th>
                <th className="pb-2">{t('dashboard.colValidated')}</th>
                <th className="pb-2">{t('dashboard.colPending')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.byTeam.map((team) => (
                <tr key={team.userId ?? 'none'} className="border-t border-slate-800">
                  <td className="py-2 font-medium text-slate-200">
                    {team.userEmail ?? t('dashboard.unassigned')}
                    {team.teamDomain ? <span className="ml-2 text-xs text-slate-500">{team.teamDomain}</span> : null}
                  </td>
                  <td className="py-2 text-slate-300">{team.total}</td>
                  <td className="py-2 text-emerald-400">{team.validated}</td>
                  <td className="py-2 text-amber-400">{team.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-300">
          {t('dashboard.teamQuotasTitle')}
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          {t('dashboard.teamQuotasSubtitle')}
        </p>
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
          {stats.teamsQuotas.map((team) => {
            const pct = Math.min(team.progressPct, 100);
            return (
              <div key={team.code} className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono text-xs text-slate-500">{team.code}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-slate-300">{team.name}</span>
                    <span className="shrink-0 text-slate-500">
                      {team.submissions}/{team.quota}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${team.progressPct >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 shrink-0 text-right text-xs text-slate-400">
                  {team.progressPct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}