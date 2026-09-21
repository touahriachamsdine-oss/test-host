'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';
import { DOMAINS } from '@/data/domains';

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: 'team' | 'reviewer' | 'admin';
  teamDomain: string | null;
  createdAt: string;
};

export function UsersManager({
  locale,
  messages
}: {
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <UsersManagerInner />
    </NextIntlClientProvider>
  );
}

function UsersManagerInner() {
  const t = useTranslations('Admin');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'team' as 'team' | 'reviewer' | 'admin',
    teamDomain: DOMAINS[0].slug,
    password: ''
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/users')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error('load_failed');
        return data;
      })
      .then((data) => {
        if (!cancelled) setUsers(data.users ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(t('users.errors.load'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, t]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        teamDomain: form.role === 'team' ? form.teamDomain : null,
        email: form.email.toLowerCase().trim()
      })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error === 'validation_failed'
        ? t('users.errors.invalidData')
        : t('users.errors.alreadyUsed'));
      return;
    }
    setSuccess(t('users.successCreated', { email: form.email }));
    setForm((f) => ({ ...f, name: '', email: '', password: '' }));
    setRefreshKey((k) => k + 1);
  }

  async function changeRole(user: AdminUserRow, role: AdminUserRow['role'], teamDomain: string | null) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, teamDomain })
    });
    if (!res.ok) {
      setError(t('users.errors.roleChange'));
      return;
    }
    setError(null);
    setRefreshKey((k) => k + 1);
  }

  const roleLabel = (role: AdminUserRow['role']) => t(`roles.${role}`);

  return (
    <div className="max-w-5xl">
      <h1 className="admin-title">{t('users.title')}</h1>
      <p className="admin-subtitle">{t('users.subtitle')}</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">{success}</div>
      )}

      <form onSubmit={createUser} className="mt-6 admin-card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          {t('users.inviteTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="u-name" className="admin-label">{t('users.nameLabel')}</label>
            <input id="u-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="admin-input" />
          </div>
          <div>
            <label htmlFor="u-email" className="admin-label">{t('users.emailLabel')}</label>
            <input id="u-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="admin-input" placeholder={t('users.emailPlaceholder')} />
          </div>
          <div>
            <label htmlFor="u-role" className="admin-label">{t('users.roleLabel')}</label>
            <select id="u-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminUserRow['role'] }))} className="admin-input">
              <option value="team">{roleLabel('team')}</option>
              <option value="reviewer">{roleLabel('reviewer')}</option>
              <option value="admin">{roleLabel('admin')}</option>
            </select>
          </div>
          {form.role === 'team' && (
            <div>
              <label htmlFor="u-domain" className="admin-label">{t('users.domainLabel')}</label>
              <select id="u-domain" value={form.teamDomain} onChange={(e) => setForm((f) => ({ ...f, teamDomain: e.target.value }))} className="admin-input">
                {DOMAINS.map((d) => (
                  <option key={d.slug} value={d.slug}>{d.slug}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="u-password" className="admin-label">{t('users.passwordLabel')}</label>
            <input id="u-password" type="text" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="admin-input" placeholder={t('users.passwordPlaceholder')} />
          </div>
        </div>
        <button type="submit" className="admin-btn admin-btn-primary">
          <UserPlus size={16} aria-hidden />
          {t('users.createButton')}
        </button>
      </form>

      {loading ? (
        <p className="mt-6 admin-subtitle">{t('common.loading')}</p>
      ) : (
        <div className="mt-6 admin-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2">{t('users.colName')}</th>
                <th className="pb-2">{t('users.colEmail')}</th>
                <th className="pb-2">{t('users.colRole')}</th>
                <th className="pb-2">{t('users.colDomain')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-800 text-slate-300">
                  <td className="py-2.5 font-medium text-white">{u.name}</td>
                  <td className="py-2.5">{u.email}</td>
                  <td className="py-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as AdminUserRow['role'], e.target.value === 'team' ? u.teamDomain : null)}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                    >
                      <option value="team">{roleLabel('team')}</option>
                      <option value="reviewer">{roleLabel('reviewer')}</option>
                      <option value="admin">{roleLabel('admin')}</option>
                    </select>
                  </td>
                  <td className="py-2.5">
                    {u.role === 'team' ? (
                      <select
                        value={u.teamDomain ?? ''}
                        onChange={(e) => changeRole(u, 'team', e.target.value)}
                        className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                      >
                        {DOMAINS.map((d) => (
                          <option key={d.slug} value={d.slug}>{d.slug}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-500">{roleLabel(u.role)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}