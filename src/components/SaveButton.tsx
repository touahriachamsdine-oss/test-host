'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { useSaved } from './SavedProvider';
import { AuthGateModal } from './AuthGateModal';

export function SaveButton({ id }: { id: string }) {
  const t = useTranslations('SaveButton');
  const { status } = useSession();
  const { ids, toggleSaved } = useSaved();
  const pathname = usePathname();
  const [gateOpen, setGateOpen] = useState(false);

  const saved = ids.includes(id);

  function handleClick() {
    if (status !== 'authenticated') {
      setGateOpen(true);
      return;
    }
    toggleSaved(id);
  }

  const label =
    status !== 'authenticated' ? t('signInToSave') : saved ? t('saved') : t('save');

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={saved ? t('savedAria') : t('saveAria')}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-[6px] border px-6 py-3 text-sm font-medium ring-focus transition-[background-color,border-color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] active:scale-[0.99] motion-reduce:active:scale-100 sm:w-auto ${
          saved
            ? 'border-ink bg-ink text-paper'
            : 'border-signal bg-signal text-paper hover:bg-signal/90'
        }`}
      >
        <span key={label} className="page-enter inline-flex items-center gap-2">
          {saved ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
          {label}
        </span>
      </button>

      <AuthGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        callbackUrl={pathname || '/'}
        action="save"
      />
    </>
  );
}
