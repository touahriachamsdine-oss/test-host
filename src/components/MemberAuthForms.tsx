'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { GraduationCap, LogIn, UserRound } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { COLLEGES, collegeLabel } from '@/data/colleges';

function PanelShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl panel-glass p-6 sm:p-8`}>
      {children}
    </div>
  );
}

function fieldClass() {
  return 'mt-1 w-full rounded-[6px] field-glass ring-focus ps-3 pe-3 py-2.5 text-base text-ink transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)] placeholder:text-ink/40';
}

const labelClass = 'text-sm font-medium text-ink/80';

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
          <span className={labelClass}>{t('emailLabel')}</span>
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
          <span className={labelClass}>{t('passwordLabel')}</span>
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

export function RegisterForm({ callbackUrl = '/saved' }: { callbackUrl?: string }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleType, setRoleType] = useState<'student' | 'teacher'>('student');
  const [studentSerial, setStudentSerial] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [studyYear, setStudyYear] = useState('1');
  const [specialty, setSpecialty] = useState('');
  const [grade, setGrade] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isStudent = roleType === 'student';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setEmailTaken(false);
    if (password.length < 8) {
      setError(t('errorWeakPassword'));
      return;
    }
    if (!collegeId) {
      setError(t('errorCollegeRequired'));
      return;
    }
    if (isStudent && studentSerial.trim().length < 3) {
      setError(t('errorSerialRequired'));
      return;
    }
    if (!isStudent && grade.trim().length < 2) {
      setError(t('errorGradeRequired'));
      return;
    }
    setSubmitting(true);
    let response: Response;
    try {
      response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          roleType,
          collegeId,
          specialty,
          studentSerial: isStudent ? studentSerial : '',
          studyYear: isStudent ? Number(studyYear) : undefined,
          grade: isStudent ? '' : grade
        })
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
        const code = String((data as { error?: unknown }).error ?? '');
        if (code === 'email_taken') {
          setEmailTaken(true);
          setError(t('errorEmailTaken'));
        } else if (code === 'rate_limited') {
          setError(t('errorRateLimited'));
        } else if (code.startsWith('invalid_')) {
          setError(t('errorInvalidField'));
        } else {
          setError(t('errorGeneric'));
        }
      } else {
        setError(t('errorGeneric'));
      }
      return;
    }
    await signIn('member-credentials', { email, password, redirect: false });
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <PanelShell wide>
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
          <p className="mt-0.5 text-sm leading-5 text-ink/60">{t('registerSubtitle')}</p>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>{t('nameLabel')}</span>
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
            <span className={labelClass}>{t('emailLabel')}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass()}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClass}>{t('passwordLabel')}</span>
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

        <fieldset className="rounded-[8px] border border-line/50 p-3">
          <legend className="px-1 text-xs font-medium uppercase tracking-wide text-ink/50">
            {t('roleLabel')}
          </legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(['student', 'teacher'] as const).map((role) => {
              const active = roleType === role;
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRoleType(role)}
                  className={`flex items-center justify-center gap-2 rounded-[6px] border px-3 py-2 text-sm transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] ${
                    active
                      ? 'border-signal bg-signal/10 font-medium text-ink'
                      : 'border-line/60 text-ink/60 hover:text-ink'
                  }`}
                >
                  {role === 'student' ? (
                    <GraduationCap size={16} aria-hidden />
                  ) : (
                    <UserRound size={16} aria-hidden />
                  )}
                  {role === 'student' ? t('roleStudent') : t('roleTeacher')}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>{t('collegeLabel')}</span>
            <select
              required
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className={fieldClass()}
            >
              <option value="">{t('collegePlaceholder')}</option>
              {COLLEGES.map((college) => (
                <option key={college.id} value={college.id}>
                  {collegeLabel(college.id, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>{t('specialtyLabel')}</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder={t('specialtyPlaceholder')}
              className={fieldClass()}
            />
          </label>

          {isStudent ? (
            <>
              <label className="block">
                <span className={labelClass}>{t('serialLabel')}</span>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  value={studentSerial}
                  onChange={(e) => setStudentSerial(e.target.value)}
                  placeholder={t('serialPlaceholder')}
                  className={fieldClass()}
                />
              </label>
              <label className="block">
                <span className={labelClass}>{t('studyYearLabel')}</span>
                <select
                  required
                  value={studyYear}
                  onChange={(e) => setStudyYear(e.target.value)}
                  className={fieldClass()}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                    <option key={year} value={year}>
                      {t('studyYearOption', { year })}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="block sm:col-span-2">
              <span className={labelClass}>{t('gradeLabel')}</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder={t('gradePlaceholder')}
                className={fieldClass()}
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-[6px] bg-signal text-sm font-medium text-paper ring-focus transition-[background-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90 active:scale-[0.99] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('submitting') : t('createAccount')}
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
