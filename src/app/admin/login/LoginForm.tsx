'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { ShieldCheck, LogIn } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../i18n';

export function LoginForm({
  locale,
  messages
}: {
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <LoginFormInner />
    </NextIntlClientProvider>
  );
}

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError(t('login.errorInvalidCredentials'));
      return;
    }

    const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard';
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-600 text-white">
            <ShieldCheck size={26} aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900 bg-red-950/60 px-3 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="admin-label">
              {t('login.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              placeholder={t('login.emailPlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="password" className="admin-label">
              {t('login.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={16} aria-hidden />
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">{t('login.footerText')}</p>
    </div>
  );
}