'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { LogIn, UserRound } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl panel-glass p-6 sm:p-8">
      {children}
    </div>
  );
}

function fieldClass() {
  return 'mt-1 w-full rounded-[6px] field-glass ring-focus ps-3 pe-3 py-2.5 text-base text-ink transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)] placeholder:text-ink/40';
}

export function LoginForm({ callbackUrl = '/' }: { callbackUrl?: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn('member-credentials', {
      email,
      password,
      redirect: false
    });
    setSubmitting(false);
    if (result?.error) {
      setError(t('errorInvalidCredentials'));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <PanelShell>
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal"
        >
          <LogIn size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="sr-only">{t('signInAccountAlt')}</span>
          <h1 className="text-xl font-semibold leading-7 tracking-tight text-ink">
            {t('loginTitle')}
          </h1>
          <p className="mt-0.5 text-sm leading-5 text-ink/60">{t('loginSubtitle')}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-[6px] border border-flag-gold/40 bg-flag-gold/10 px-3 py-2.5 text-sm text-ink">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">{t('emailLabel')}</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass()}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">{t('passwordLabel')}</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass()}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-[6px] bg-signal text-sm font-medium text-paper ring-focus transition-[background-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90 active:scale-[0.99] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink/60">
        {t('noAccount')}{' '}
        <Link
          href="/register"
          className="text-signal underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-ink"
        >
          {t('createAccount')}
        </Link>
      </p>
    </PanelShell>
  );
}

export function RegisterForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setEmailTaken(false);
    if (password.length < 8) {
      setError(t('errorWeakPassword'));
      return;
    }
    setSubmitting(true);
    let response: Response;
    try {
      response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
    } catch {
      setSubmitting(false);
      setError(t('errorGeneric'));
      return;
    }
    const data: unknown = await response.json().catch(() => null);
    setSubmitting(false);
    if (!response.ok) {
      if (data && typeof data === 'object' && 'error' in data) {
        const code = (data as { error?: unknown }).error;
        if (code === 'email_taken') {
          setEmailTaken(true);
          setError(t('errorEmailTaken'));
        } else if (code === 'rate_limited') {
          setError(t('errorRateLimited'));
        } else {
          setError(t('errorGeneric'));
        }
      } else {
        setError(t('errorGeneric'));
      }
      return;
    }
    await signIn('member-credentials', { email, password, redirect: false });
    router.push('/saved');
    router.refresh();
  }

  return (
    <PanelShell>
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal"
        >
          <UserRound size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="sr-only">{t('signInAccountAlt')}</span>
          <h1 className="text-xl font-semibold leading-7 tracking-tight text-ink">
            {t('createAccountLong')}
          </h1>
          <p className="mt-0.5 text-sm leading-5 text-ink/60">{t('loginSubtitle')}</p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-[6px] border border-flag-gold/40 bg-flag-gold/10 px-3 py-2.5 text-sm text-ink"
        >
          {error}
          {emailTaken && (
            <Link
              href="/login"
              className="ms-2 text-signal underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-ink"
            >
              {t('signIn')}
            </Link>
          )}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">{t('nameLabel')}</span>
          <input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass()}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">{t('emailLabel')}</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass()}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">{t('passwordLabel')}</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass()}
          />
          <span className="mt-1 block text-xs leading-4 text-ink/50">{t('passwordHint')}</span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-[6px] bg-signal text-sm font-medium text-paper ring-focus transition-[background-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90 active:scale-[0.99] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('createAccount')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink/60">
        {t('haveAccount')}{' '}
        <Link
          href="/login"
          className="text-signal underline underline-offset-2 ring-focus transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-ink"
        >
          {t('signIn')}
        </Link>
      </p>
    </PanelShell>
  );
}