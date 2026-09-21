'use client';

import { useRef, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { FileUp, ClipboardPaste, Loader2, RotateCcw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '../../i18n';
import type { DomainCandidate } from '@/lib/import-parse';
import {
  IMPORTABLE_FIELDS,
  buildImportRows,
  resolveDomain
} from '@/lib/import-parse';

type ParseState = ReturnType<typeof buildImportRows> | null;

type ResultState = {
  imported: number;
  skipped: { line: number; name?: string; reason: string }[];
  errors: { line: number; name?: string; reason: string }[];
} | null;

function translateReason(reason: string, t: ReturnType<typeof useTranslations>): string {
  if (reason.startsWith('unknown_domain')) return t('import.reason.unknownDomain');
  if (reason.startsWith('shortDescription')) return t('import.reason.shortDescription');
  if (reason.startsWith('name:')) return t('import.reason.invalidName');
  if (reason.startsWith('country:')) return t('import.reason.invalidCountry');
  if (reason.startsWith('yearFounded')) return t('import.reason.invalidYear');
  if (reason.startsWith('officialSite') || reason.startsWith('sourceUrl')) return t('import.reason.invalidUrl');
  if (reason.startsWith('priority')) return t('import.reason.invalidPriority');
  if (reason.startsWith('name_required')) return t('import.reason.missingName');
  if (reason === 'duplicate_name') return t('import.reason.duplicateName');
  return reason;
}

function previewCell(value: string): string {
  const v = value.trim();
  if (v.length === 0) return '—';
  return v.length > 48 ? `${v.slice(0, 48)}…` : v;
}

export function ImportSheet({
  candidates,
  locale,
  messages
}: {
  candidates: DomainCandidate[];
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <ImportSheetInner candidates={candidates} />
    </NextIntlClientProvider>
  );
}

function ImportSheetInner({ candidates }: { candidates: DomainCandidate[] }) {
  const t = useTranslations('Admin');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParseState>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleFields = parsed
    ? IMPORTABLE_FIELDS.filter((f) => parsed.mapping[f] != null)
    : [];

  const unknownDomainRows = parsed
    ? parsed.data.filter((d) => !resolveDomain(candidates, d.row.domain ?? '')).length
    : 0;

  function delimLabel(delimiter: string): string {
    const key: Record<string, string> = { tab: 'tab', ';': 'semicolon', ',': 'comma', '|': 'pipe' };
    return key[delimiter] ? t(`import.delim.${key[delimiter]}`) : delimiter;
  }

  function analyse() {
    setResult(null);
    if (!text.trim()) {
      setNotice(t('import.notice.pasteFirst'));
      return;
    }
    setNotice(null);
    setParsed(buildImportRows(text));
  }

  async function submit() {
    if (!parsed || parsed.data.length === 0) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsed.data.slice(0, 500).map((d) => ({ line: d.line, row: d.row }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? 'import_failed');
      }
      setResult(data.result);
    } catch {
      setNotice(t('import.notice.importFailed'));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setText('');
    setParsed(null);
    setResult(null);
    setNotice(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <div className="admin-card">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="admin-btn admin-btn-secondary"
          >
            <FileUp size={16} aria-hidden />
            {t('import.openFile')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 500_000) {
                setNotice(t('import.notice.fileTooLarge'));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                setText(String(reader.result ?? ''));
                setParsed(null);
                setResult(null);
                setNotice(null);
              };
              reader.readAsText(file, 'utf-8');
            }}
          />
          <span className="text-xs text-slate-500">{t('import.or')}</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
            <ClipboardPaste size={16} aria-hidden />
            {t('import.copyPasteHint')}
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          spellCheck={false}
          rows={8}
          placeholder={t('import.textareaPlaceholder')}
          className="admin-input mt-4 h-44 font-mono text-[13px] leading-5"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={analyse} className="admin-btn admin-btn-primary">
            {t('import.analyse')}
          </button>
          <button type="button" onClick={reset} className="admin-btn admin-btn-secondary">
            <RotateCcw size={16} aria-hidden />
            {t('import.reset')}
          </button>
        </div>

        {notice && <p className="mt-3 text-sm text-amber-400">{notice}</p>}
      </div>

      {parsed && (
        <div className="admin-card">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
            <span className="text-slate-300">
              {t('import.linesDetected', { count: parsed.data.length })}
            </span>
            <span className="text-slate-400">
              {t('import.delimiterLabel')}{' '}
              <span className="font-mono text-slate-200">{delimLabel(parsed.delimiter)}</span>
            </span>
            <span className="text-slate-400">
              {t('import.headerLabel')}{' '}
              <span className="font-mono text-slate-200">
                {parsed.hasHeader ? t('import.headerDetected') : t('import.headerNotDetected')}
              </span>
            </span>
          </div>

          {parsed.hasHeader && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {visibleFields.map((f) => (
                <span key={f} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-teal-300">
                  {t(`import.field.${f}`)}
                </span>
              ))}
            </div>
          )}

          {!parsed.hasHeader && (
            <p className="mt-3 text-sm text-amber-400">
              {t('import.noHeaderDetected', {
                fields: visibleFields.map((f) => t(`import.field.${f}`)).join(' · ')
              })}
            </p>
          )}

          {unknownDomainRows > 0 && (
            <p className="mt-3 text-sm text-rose-400">
              {t('import.unknownDomainWarning', { count: unknownDomainRows })}
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-2">{t('import.colLine')}</th>
                  {visibleFields.map((f) => (
                    <th key={f} className="px-2 py-2 font-semibold">
                      {t(`import.field.${f}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.data.slice(0, 8).map((d) => (
                  <tr key={d.line} className="border-t border-slate-800">
                    <td className="px-2 py-2 font-mono text-slate-500">{d.line}</td>
                    {visibleFields.map((f) => (
                      <td key={f} className="max-w-[16rem] truncate px-2 py-2 text-slate-300">
                        {previewCell(d.row[f] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsed.data.length > 8 && (
            <p className="mt-2 text-xs text-slate-500">
              {t('import.moreLines', { count: parsed.data.length - 8 })}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={busy || parsed.data.length === 0}
            className="admin-btn admin-btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ClipboardPaste size={16} aria-hidden />}
            {busy ? t('import.importing') : t('import.submitButton', { count: parsed.data.length })}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 admin-card">
            <p className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={16} aria-hidden />
              {t('import.result.imported', { count: result.imported })}
            </p>
            <p className="flex items-center gap-2 text-sm text-amber-400">
              <AlertTriangle size={16} aria-hidden />
              {t('import.result.ignored', { count: result.skipped.length })}
            </p>
            <p className="flex items-center gap-2 text-sm text-rose-400">
              <XCircle size={16} aria-hidden />
              {t('import.result.errors', { count: result.errors.length })}
            </p>
          </div>

          {(result.skipped.length > 0 || result.errors.length > 0) && (
            <div className="admin-card">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">{t('import.detail')}</h2>
              <ul className="space-y-1 text-sm">
                {[...result.errors, ...result.skipped].slice(0, 25).map((item, i) => (
                  <li key={`${item.line}-${i}`} className="flex items-start gap-2 text-slate-300">
                    <span className="shrink-0 font-mono text-xs text-slate-500">{t('import.lineNumber', { line: item.line })}</span>
                    <span>
                      {translateReason(item.reason, t)}
                      {item.name ? <span className="text-slate-500"> — {item.name}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
              {(result.errors.length + result.skipped.length) > 25 && (
                <p className="mt-2 text-xs text-slate-500">
                  {t('import.moreErrors', { count: result.errors.length + result.skipped.length - 25 })}
                </p>
              )}
            </div>
          )}

          <button type="button" onClick={reset} className="admin-btn admin-btn-secondary">
            <RotateCcw size={16} aria-hidden />
            {t('import.newImport')}
          </button>
        </div>
      )}
    </div>
  );
}