'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { COLLEGES, collegeLabel } from '@/data/colleges';
import type { Locale } from '@/i18n/routing';

const YEARS = [1, 2, 3, 4, 5, 6, 7, 8];

interface ProfileData {
  name: string;
  roleType: string | null;
  studentSerial: string | null;
  collegeId: string | null;
  studyYear: number | null;
  specialty: string | null;
  grade: string | null;
  digestOptIn: boolean;
}

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const t = useTranslations('Profile');
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [roleType, setRoleType] = useState<'student' | 'teacher'>(
    profile.roleType === 'teacher' ? 'teacher' : 'student'
  );
  const [collegeId, setCollegeId] = useState(profile.collegeId ?? '');
  const [specialty, setSpecialty] = useState(profile.specialty ?? '');
  const [studentSerial, setStudentSerial] = useState(profile.studentSerial ?? '');
  const [studyYear, setStudyYear] = useState(String(profile.studyYear ?? ''));
  const [grade, setGrade] = useState(profile.grade ?? '');
  const [digestOptIn, setDigestOptIn] = useState(profile.digestOptIn);

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);

    const payload: Record<string, unknown> = {
      roleType,
      collegeId,
      specialty,
      digestOptIn
    };
    if (roleType === 'student') {
      payload.studentSerial = studentSerial;
      payload.studyYear = studyYear ? Number(studyYear) : undefined;
    } else {
      payload.grade = grade;
    }

    try {
      const response = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        setError(t('error'));
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'ring-focus mt-1 w-full rounded-lg border border-line/60 bg-paper px-3 py-2 text-sm text-ink';
  const labelClass = 'block text-xs font-medium uppercase tracking-wide text-ink/50';

  return (
    <form onSubmit={submit} className="mt-8 max-w-xl space-y-4">
      <div className="rounded-xl border border-line/50 bg-surface/40 p-3 text-sm text-ink/70">
        <span className={labelClass}>{t('nameLabel')}</span>
        <p className="mt-1 font-medium text-ink">{profile.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {t('roleLabel')}
          <select
            value={roleType}
            onChange={(event) => setRoleType(event.target.value as 'student' | 'teacher')}
            className={inputClass}
          >
            <option value="student">{t('student')}</option>
            <option value="teacher">{t('teacher')}</option>
          </select>
        </label>

        <label className={labelClass}>
          {t('collegeLabel')}
          <select
            value={collegeId}
            onChange={(event) => setCollegeId(event.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              {t('collegePlaceholder')}
            </option>
            {COLLEGES.map((college) => (
              <option key={college.id} value={college.id}>
                {collegeLabel(college.id, locale)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {roleType === 'student' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {t('studyYearLabel')}
            <select
              value={studyYear}
              onChange={(event) => setStudyYear(event.target.value)}
              className={inputClass}
            >
              <option value="">{t('studyYearPlaceholder')}</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {t('yearOption', { year })}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t('serialLabel')}
            <input
              value={studentSerial}
              onChange={(event) => setStudentSerial(event.target.value)}
              maxLength={40}
              className={inputClass}
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {t('gradeLabel')}
            <input
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              maxLength={80}
              className={inputClass}
            />
          </label>
        </div>
      )}

      <label className={labelClass}>
        {t('specialtyLabel')}
        <input
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
          maxLength={120}
          className={inputClass}
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-line/50 p-3 text-sm text-ink/75">
        <input
          type="checkbox"
          checked={digestOptIn}
          onChange={(event) => setDigestOptIn(event.target.checked)}
          className="mt-0.5 accent-signal"
        />
        <span>
          <span className="font-medium text-ink">{t('digestLabel')}</span>
          <span className="mt-0.5 block text-xs leading-5 text-ink/55">{t('digestHint')}</span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="ring-focus rounded-[3px] bg-signal px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
        >
          {busy ? t('saving') : t('save')}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-signal">
            <Check size={14} aria-hidden /> {t('saved')}
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
