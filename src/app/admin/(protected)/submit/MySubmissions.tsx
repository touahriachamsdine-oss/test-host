'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';

type MyStartup = {
  id: string;
  name: string;
  domain: string;
  status: string;
  priority: string;
  createdAt: string;
};

export function MySubmissions({
  actorId,
  locale,
  messages
}: {
  actorId: string;
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <MySubmissionsInner actorId={actorId} />
    </NextIntlClientProvider>
  );
}

function MySubmissionsInner({ actorId }: { actorId: string }) {
  const t = useTranslations('Admin');
  const [startups, setStartups] = useState<MyStartup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/startups?mine=true&_uid=${actorId}`)
      .then((res) => (res.ok ? res.json() : { startups: [] }))
      .then((data) => {
        if (!cancelled) setStartups(data.startups ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actorId]);

  if (loading) {
    return <p className="admin-subtitle">{t('common.loading')}</p>;
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold text-white">{t('submit.mySubmissionsTitle')}</h2>
      {startups.length === 0 ? (
        <p className="admin-subtitle mt-2">{t('submit.mySubmissionsEmpty')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {startups.map((s) => (
            <div key={s.id} className="admin-card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{s.name}</p>
                <p className="text-xs text-slate-400">{s.domain} · {s.id}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  s.status === 'verified'
                    ? 'bg-emerald-950 text-emerald-300'
                    : s.status === 'rejected'
                      ? 'bg-red-950 text-red-300'
                      : 'bg-amber-950 text-amber-300'
                }`}
              >
                {t(`status.${s.status as 'pending' | 'verified' | 'rejected'}`)}
              </span>
              <Link
                href={`/admin/submit?id=${encodeURIComponent(s.id)}`}
                className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-teal-600 hover:text-teal-300"
              >
                {t('submit.editButton')}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}