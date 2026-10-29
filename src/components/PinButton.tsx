'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Pin, PinOff } from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { AuthGateModal } from './AuthGateModal';

export function PinButton({ id }: { id: string }) {
  const t = useTranslations('Pin');
  const { status } = useSession();
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/me/flags')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ids?: string[] } | null) => {
        if (!cancelled && data?.ids) setPinned(data.ids.includes(id));
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
      const response = await fetch('/api/me/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId: id })
      });
      if (response.ok) {
        const data = (await response.json()) as { pinned?: boolean };
        setPinned(Boolean(data.pinned));
      }
    } catch {
      // keep previous state on failure
    } finally {
      setBusy(false);
    }
  }

  const active = status === 'authenticated' && pinned;
  const label = active ? t('pinned') : t('pin');

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={active}
        aria-label={active ? t('pinnedAria') : t('pinAria')}
        title={active ? t('pinnedAria') : t('pinAria')}
        className={`inline-flex items-center justify-center gap-2 rounded-[6px] border px-4 py-3 text-sm font-medium ring-focus transition-[background-color,border-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] active:scale-[0.99] motion-reduce:active:scale-100 disabled:opacity-60 ${
          active
            ? 'border-flag-gold bg-flag-gold/15 text-ink'
            : 'border-line/70 text-ink/70 hover:border-ink/40 hover:text-ink'
        }`}
      >
        {active ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
        {status === 'authenticated' ? label : t('signInToPin')}
      </button>

      <AuthGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        callbackUrl={pathname || '/'}
        action="pin"
      />
    </>
  );
}
