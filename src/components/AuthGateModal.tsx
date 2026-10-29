'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LogIn, UserPlus, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function AuthGateModal({
  open,
  onClose,
  callbackUrl,
  action = 'save'
}: {
  open: boolean;
  onClose: () => void;
  callbackUrl: string;
  action?: 'save' | 'pin';
}) {
  const t = useTranslations('AuthGate');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const query = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.45)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="auth-gate-title" className="text-lg font-semibold leading-7 tracking-tight text-ink">
            {action === 'pin' ? t('pinTitle') : t('title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="ring-focus -me-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-ink/50 hover:bg-line/30 hover:text-ink"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-ink/70">
          {action === 'pin' ? t('pinText') : t('text')}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/login${query}`}
            className="ring-focus inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[6px] bg-signal text-sm font-medium text-paper transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-signal/90"
          >
            <LogIn size={16} aria-hidden />
            {t('signIn')}
          </Link>
          <Link
            href={`/register${query}`}
            className="ring-focus inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[6px] border border-line/70 text-sm font-medium text-ink transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-line/20"
          >
            <UserPlus size={16} aria-hidden />
            {t('register')}
          </Link>
        </div>
      </div>
    </div>
  );
}
