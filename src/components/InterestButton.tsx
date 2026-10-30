'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Check, Hammer } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { AuthGateModal } from './AuthGateModal';

export function InterestButton({
  id,
  initialCount = 0
}: {
  id: string;
  initialCount?: number;
}) {
  const t = useTranslations('Interest');
  const { status } = useSession();
  const pathname = usePathname();
  const [interested, setInterested] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/me/interests')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ids?: string[] } | null) => {
        if (!cancelled && data?.ids) setInterested(data.ids.includes(id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, status]);

  async function handleClick() {
    if (status !== 'authenticated') {
      setGateOpen(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/me/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId: id })
      });
      if (response.ok) {
        const data = (await response.json()) as { interested?: boolean };
        const next = Boolean(data.interested);
        setInterested(next);
        setCount((value) => Math.max(0, value + (next ? 1 : -1)));
      }
    } catch {
      // keep previous state on failure
    } finally {
      setBusy(false);
    }
  }

  const active = status === 'authenticated' && interested;
  const label = active ? t('building') : t('want');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={active}
        aria-label={active ? t('building') : t('want')}
        title={active ? t('building') : t('want')}
        className={`inline-flex items-center justify-center gap-2 rounded-[6px] border px-4 py-3 text-sm font-medium ring-focus transition-[background-color,border-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] active:scale-[0.99] motion-reduce:active:scale-100 disabled:opacity-60 ${
          active
            ? 'border-signal bg-signal/10 text-ink'
            : 'border-line/70 text-ink/70 hover:border-ink/40 hover:text-ink'
        }`}
      >
        {active ? <Check size={16} aria-hidden /> : <Hammer size={16} aria-hidden />}
        {status === 'authenticated' ? label : t('signIn')}
      </button>

      {count > 0 && (
        <span className="text-sm text-ink/55">{t('count', { count })}</span>
      )}

      <Link
        href="/collaborate"
        className="rounded-[3px] text-sm text-signal underline underline-offset-2 ring-focus hover:text-ink"
      >
        {t('board')}
      </Link>

      <AuthGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        callbackUrl={pathname || '/'}
        action="interest"
      />
    </div>
  );
}
