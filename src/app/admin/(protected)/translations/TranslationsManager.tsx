'use client';

import { useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { Languages, Save, Search, Trash2, X } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';
import type { AdminStartup } from '@/lib/db';
import type { AdminTranslation } from '@/lib/startup-translations-admin';

type TRL = 'fr' | 'ar';

function keyOf(startupId: string, locale: TRL): string {
  return `${startupId}:${locale}`;
}

function buildMap(translations: AdminTranslation[]): Record<string, AdminTranslation> {
  return Object.fromEntries(translations.map((tr) => [keyOf(tr.startupId, tr.locale), tr]));
}

export function TranslationsManager({
  startups,
  translations,
  locale,
  messages,
  initialFilter
}: {
  startups: AdminStartup[];
  translations: AdminTranslation[];
  locale: Locale;
  messages: AdminMessages;
  initialFilter?: string;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <TranslationsManagerInner
        startups={startups}
        translations={translations}
        initialFilter={initialFilter}
      />
    </NextIntlClientProvider>
  );
}

function TranslationsManagerInner({
  startups,
  translations,
  initialFilter
}: {
  startups: AdminStartup[];
  translations: AdminTranslation[];
  initialFilter?: string;
}) {
  const t = useTranslations('Admin');
  const [map, setMap] = useState<Record<string, AdminTranslation>>(() => buildMap(translations));
  const [open, setOpen] = useState<{ startup: AdminStartup; locale: TRL } | null>(null);
  const [form, setForm] = useState({
    name: '',
    country: '',
    subDomain: '',
    shortDescription: '',
    technology: '',
    whyRelevant: ''
  });
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState(initialFilter ?? '');

  const localeName = (loc: TRL) =>
    loc === 'fr' ? t('translations.french') : t('translations.arabic');

  function openEditor(startup: AdminStartup, locale: TRL) {
    const existing = map[keyOf(startup.id, locale)];
    setOpen({ startup, locale });
    setForm({
      name: existing?.name ?? '',
      country: existing?.country ?? startup.country,
      subDomain: existing?.subDomain ?? startup.subDomain ?? '',
      shortDescription: existing?.shortDescription ?? '',
      technology: existing?.technology ?? '',
      whyRelevant: existing?.whyRelevant ?? ''
    });
    setError(null);
    setSuccess(null);
    setConfirmDelete(false);
  }

  async function save() {
    if (!open) return;
    setBusy('save');
    setError(null);
    setSuccess(null);
    const res = await fetch('/api/admin/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startupId: open.startup.id,
        locale: open.locale,
        name: form.name,
        country: form.country,
        subDomain: form.subDomain,
        shortDescription: form.shortDescription,
        technology: form.technology,
        whyRelevant: form.whyRelevant
      })
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(t('translations.errors.saveFailed'));
      return;
    }
    setMap((m) => ({ ...m, [keyOf(open.startup.id, open.locale)]: data.translation as AdminTranslation }));
    setSuccess(t('translations.saved', { locale: localeName(open.locale) }));
  }

  async function del() {
    if (!open) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy('delete');
    setError(null);
    setSuccess(null);
    const res = await fetch('/api/admin/translations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startupId: open.startup.id, locale: open.locale })
    });
    setBusy(null);
    if (!res.ok) {
      setError(t('translations.errors.deleteFailed'));
      return;
    }
    setMap((m) => {
      const next = { ...m };
      delete next[keyOf(open.startup.id, open.locale)];
      return next;
    });
    setSuccess(t('translations.deleted', { locale: localeName(open.locale) }));
    setOpen(null);
    setConfirmDelete(false);
  }

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const covered = new Set(Object.values(map).map((tr) => tr.startupId)).size;
  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? startups.filter((s) =>
        [s.name, s.id, s.domain]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle))
      )
    : startups;

  return (
    <div>
      <h1 className="admin-title">{t('translations.title')}</h1>
      <p className="admin-subtitle">{t('translations.subtitle')}</p>
      <p className="admin-subtitle mt-1">
        {t('translations.coverage', { done: covered, total: startups.length })}
      </p>

      <label className="relative mt-5 block max-w-md">
        <Search size={15} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
        <span className="sr-only">{t('translations.searchPlaceholder')}</span>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('translations.searchPlaceholder')}
          className="admin-input ps-8"
        />
      </label>

      {(success && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
          <Save size={16} className="mt-0.5 shrink-0" aria-hidden />
          {success}
        </div>
      )) ||
        (error && (
          <div className="mt-4 rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ))}

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{t('translations.noResults')}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.map((s) => {
          const hasFr = Boolean(map[keyOf(s.id, 'fr')]);
          const hasAr = Boolean(map[keyOf(s.id, 'ar')]);
          const isOpenFr = open?.startup.id === s.id && open.locale === 'fr';
          const isOpenAr = open?.startup.id === s.id && open.locale === 'ar';
          return (
            <div key={s.id} className="admin-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-white">{s.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      hasFr ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                    }`}>
                      FR · {hasFr ? t('translations.translated') : t('translations.missing')}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      hasAr ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                    }`}>
                      AR · {hasAr ? t('translations.translated') : t('translations.missing')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{s.domain} · {s.id}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEditor(s, 'fr')} className="admin-btn admin-btn-secondary">
                    <Languages size={14} aria-hidden />
                    {t('translations.french')}
                  </button>
                  <button type="button" onClick={() => openEditor(s, 'ar')} className="admin-btn admin-btn-secondary">
                    <Languages size={14} aria-hidden />
                    {t('translations.arabic')}
                  </button>
                </div>
              </div>

              {open && (isOpenFr || isOpenAr) && (
                <div className="mt-4 rounded-lg border border-slate-700 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">
                      {t('translations.editing', { locale: localeName(open.locale) })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setOpen(null)}
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                    >
                      <X size={14} aria-hidden />
                      {t('translations.cancel')}
                    </button>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                    <p className="mb-1 font-semibold text-slate-300">{t('translations.sourceLabel')}</p>
                    <p><span className="text-slate-500">{t('submit.nameLabel')} </span>{open.startup.name}</p>
                    <p><span className="text-slate-500">{t('submit.countryLabel')} </span>{open.startup.country}</p>
                    <p><span className="text-slate-500">{t('submit.subDomainLabel')} </span>{open.startup.subDomain ?? '—'}</p>
                    <p><span className="text-slate-500">{t('submit.shortDescriptionLabel')} </span>{open.startup.shortDescription}</p>
                    <p><span className="text-slate-500">{t('submit.technologyLabel')} </span>{open.startup.technology}</p>
                    <p><span className="text-slate-500">{t('submit.whyRelevantLabel')} </span>{open.startup.whyRelevant}</p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="admin-label">{t('submit.nameLabel')}</label>
                        <input
                          required
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label">{t('submit.countryLabel')}</label>
                        <input
                          value={form.country}
                          onChange={(e) => update('country', e.target.value)}
                          className="admin-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="admin-label">{t('submit.subDomainLabel')}</label>
                      <input
                        value={form.subDomain}
                        onChange={(e) => update('subDomain', e.target.value)}
                        className="admin-input"
                        placeholder={t('submit.subDomainPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="admin-label">{t('submit.shortDescriptionLabel')}</label>
                      <textarea
                        required
                        rows={3}
                        value={form.shortDescription}
                        onChange={(e) => update('shortDescription', e.target.value)}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label">{t('submit.technologyLabel')}</label>
                      <input
                        required
                        value={form.technology}
                        onChange={(e) => update('technology', e.target.value)}
                        className="admin-input"
                        placeholder={t('submit.technologyPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="admin-label">{t('submit.whyRelevantLabel')}</label>
                      <textarea
                        required
                        rows={3}
                        value={form.whyRelevant}
                        onChange={(e) => update('whyRelevant', e.target.value)}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button type="button" disabled={busy !== null} onClick={save} className="admin-btn admin-btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                      <Save size={15} aria-hidden />
                      {busy === 'save' ? t('translations.saving') : t('translations.save')}
                    </button>
                    {map[keyOf(open.startup.id, open.locale)] && (
                      <button type="button" disabled={busy !== null} onClick={del} className="admin-btn admin-btn-secondary disabled:cursor-not-allowed disabled:opacity-60">
                        <Trash2 size={15} aria-hidden />
                        {busy === 'delete'
                          ? t('translations.deleting')
                          : confirmDelete
                            ? t('translations.deleteConfirm')
                            : t('translations.delete')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}