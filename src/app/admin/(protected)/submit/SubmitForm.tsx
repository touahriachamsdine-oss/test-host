'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';
import type { AdminStartup } from '@/lib/db';
import { DOMAINS } from '@/data/domains';
import { startupSubmissionSchema } from '@/lib/validation';

export function SubmitForm({
  teamDomain,
  locale,
  messages,
  editId = null,
  initial = null
}: {
  teamDomain: string | null;
  locale: Locale;
  messages: AdminMessages;
  editId?: string | null;
  initial?: AdminStartup | null;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <SubmitFormInner teamDomain={teamDomain} editId={editId} initial={initial} />
    </NextIntlClientProvider>
  );
}

function SubmitFormInner({
  teamDomain,
  editId = null,
  initial = null
}: {
  teamDomain: string | null;
  editId?: string | null;
  initial?: AdminStartup | null;
}) {
  const t = useTranslations('Admin');
  const router = useRouter();
  const isEdit = Boolean(editId && initial);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    country: initial?.country ?? 'Algeria',
    domain: initial?.domain ?? teamDomain ?? DOMAINS[0].slug,
    subDomain: initial?.subDomain ?? '',
    shortDescription: initial?.shortDescription ?? '',
    technology: initial?.technology ?? '',
    yearFounded: initial ? String(initial.yearFounded) : '2024',
    officialSite: initial?.officialSite ?? '',
    sourceUrl: initial?.sourceUrl ?? '',
    whyRelevant: initial?.whyRelevant ?? '',
    priority: initial?.priority ?? 'C'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const domainLocked = Boolean(teamDomain);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      yearFounded: Number(form.yearFounded),
      subDomain: form.subDomain || undefined,
      officialSite: form.officialSite || undefined,
      sourceUrl: form.sourceUrl || undefined
    };

    const parsed = startupSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message).filter(Boolean);
      setError(issues.length ? issues.join(' — ') : t('submit.errors.invalidData'));
      return;
    }

    setLoading(true);

    const url = isEdit ? `/api/admin/startups/${encodeURIComponent(editId ?? '')}` : '/api/admin/startups';
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error === 'Forbidden' ? t('submit.errors.domainForbidden') : t('submit.errors.submitFailed'));
      return;
    }

    if (isEdit) {
      setSuccess(t('submit.successUpdated', { id: data.startup.id }));
    } else {
      setSuccess(t('submit.successCreated', { id: data.startup.id }));
      setForm((f) => ({
        ...f,
        name: '',
        subDomain: '',
        shortDescription: '',
        technology: '',
        officialSite: '',
        sourceUrl: '',
        whyRelevant: ''
      }));
    }
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="admin-title">{isEdit ? t('submit.editTitle') : t('submit.title')}</h1>
      <p className="admin-subtitle">
        {domainLocked
          ? t('submit.domainLocked', { domain: teamDomain ?? '' })
          : t('submit.domainUnlocked')}
      </p>

      {success && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
          {success}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="admin-card space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="admin-label">{t('submit.nameLabel')}</label>
              <input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} className="admin-input" />
            </div>
            <div>
              <label htmlFor="country" className="admin-label">{t('submit.countryLabel')}</label>
              <input id="country" value={form.country} onChange={(e) => update('country', e.target.value)} className="admin-input" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="domain" className="admin-label">{t('submit.domainLabel')}</label>
              <select
                id="domain"
                value={form.domain}
                onChange={(e) => update('domain', e.target.value)}
                disabled={domainLocked}
                className="admin-input disabled:opacity-60"
              >
                {DOMAINS.map((d) => (
                  <option key={d.slug} value={d.slug}>{d.slug}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subDomain" className="admin-label">{t('submit.subDomainLabel')}</label>
              <input id="subDomain" value={form.subDomain} onChange={(e) => update('subDomain', e.target.value)} className="admin-input" placeholder={t('submit.subDomainPlaceholder')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="yearFounded" className="admin-label">{t('submit.yearFoundedLabel')}</label>
              <input id="yearFounded" type="number" min={1980} max={2030} required value={form.yearFounded} onChange={(e) => update('yearFounded', e.target.value)} className="admin-input" />
            </div>
            <div>
              <label htmlFor="priority" className="admin-label">{t('submit.priorityLabel')}</label>
              <select id="priority" value={form.priority} onChange={(e) => update('priority', e.target.value)} className="admin-input">
                <option value="C">{t('submit.priorityC')}</option>
                <option value="B">B</option>
                <option value="A">A</option>
              </select>
            </div>
            <div>
              <label htmlFor="technology" className="admin-label">{t('submit.technologyLabel')}</label>
              <input id="technology" required value={form.technology} onChange={(e) => update('technology', e.target.value)} className="admin-input" placeholder={t('submit.technologyPlaceholder')} />
            </div>
          </div>

          <div>
            <label htmlFor="shortDescription" className="admin-label">{t('submit.shortDescriptionLabel')}</label>
            <textarea id="shortDescription" required rows={3} value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} className="admin-input" />
          </div>

          <div>
            <label htmlFor="whyRelevant" className="admin-label">{t('submit.whyRelevantLabel')}</label>
            <textarea id="whyRelevant" required rows={3} value={form.whyRelevant} onChange={(e) => update('whyRelevant', e.target.value)} className="admin-input" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="officialSite" className="admin-label">{t('submit.officialSiteLabel')}</label>
              <input id="officialSite" type="url" value={form.officialSite} onChange={(e) => update('officialSite', e.target.value)} className="admin-input" placeholder={t('common.urlPlaceholder')} />
            </div>
            <div>
              <label htmlFor="sourceUrl" className="admin-label">{t('submit.sourceUrlLabel')}</label>
              <input id="sourceUrl" type="url" value={form.sourceUrl} onChange={(e) => update('sourceUrl', e.target.value)} className="admin-input" placeholder={t('common.urlPlaceholder')} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="admin-btn admin-btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          <PlusCircle size={16} aria-hidden />
          {loading
            ? isEdit ? t('submit.updating') : t('submit.submitting')
            : isEdit ? t('submit.updateButton') : t('submit.submitButton')}
        </button>
      </form>
    </div>
  );
}