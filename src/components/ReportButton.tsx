'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Flag, X } from 'lucide-react';

const REASONS = ['wrong_info', 'translation', 'broken_link', 'duplicate', 'other'] as const;

export function ReportButton({ startupId }: { startupId: string }) {
  const t = useTranslations('Report');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('wrong_info');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setDone(false);
    setError(false);
    setNote('');
    setReason('wrong_info');
  }

  async function submit() {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId, reason, note })
      });
      if (!response.ok) {
        setError(true);
        return;
      }
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ring-focus inline-flex items-center gap-1.5 rounded-full border border-line/60 px-2.5 py-1 text-xs text-ink/60 hover:border-line hover:text-ink"
      >
        <Flag size={12} aria-hidden />
        {t('open')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm print:hidden"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="w-full max-w-md rounded-2xl border border-line/60 bg-paper p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="report-title" className="text-base font-semibold text-ink">
                  {t('title')}
                </h2>
                <p className="mt-1 text-sm leading-5 text-ink/60">{t('subtitle')}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t('close')}
                className="ring-focus rounded p-1 text-ink/50 hover:text-ink"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            {done ? (
              <div className="mt-5 rounded-xl border border-signal/30 bg-signal/[0.06] p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Check size={15} aria-hidden /> {t('thanksTitle')}
                </p>
                <p className="mt-1 text-sm leading-5 text-ink/65">{t('thanksText')}</p>
                <button
                  type="button"
                  onClick={close}
                  className="ring-focus mt-3 rounded-[3px] bg-ink px-3 py-1.5 text-sm text-paper"
                >
                  {t('close')}
                </button>
              </div>
            ) : (
              <>
                <fieldset className="mt-4 space-y-2">
                  <legend className="text-xs font-medium uppercase tracking-wide text-ink/50">
                    {t('reasonLabel')}
                  </legend>
                  {REASONS.map((value) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-line/50 px-3 py-2 text-sm text-ink/80 has-[:checked]:border-signal has-[:checked]:bg-signal/[0.05]"
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                        className="accent-signal"
                      />
                      {t(value)}
                    </label>
                  ))}
                </fieldset>

                <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  {t('noteLabel')}
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={600}
                    rows={3}
                    placeholder={t('notePlaceholder')}
                    className="ring-focus mt-1.5 w-full rounded-lg border border-line/60 bg-paper px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink placeholder:text-ink/35"
                  />
                </label>

                {error && <p className="mt-2 text-xs text-red-600">{t('failed')}</p>}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="ring-focus rounded-[3px] bg-signal px-3 py-1.5 text-sm font-medium text-paper disabled:opacity-60"
                  >
                    {busy ? t('sending') : t('submit')}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="ring-focus text-sm text-ink/60 underline underline-offset-2 hover:text-ink"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
