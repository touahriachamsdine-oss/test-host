'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link2, MessageCircle, Printer, Send } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const item =
  'ring-focus inline-flex items-center gap-1.5 rounded-full border border-line/60 px-2.5 py-1 text-xs text-ink/70 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:border-ink/40 hover:text-ink';

export function ShareBar({
  url,
  title,
  briefHref
}: {
  url: string;
  title: string;
  briefHref: string;
}) {
  const t = useTranslations('Share');
  const [copied, setCopied] = useState(false);

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
  const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-ink/45">
        {t('label')}
      </span>
      <a href={whatsapp} target="_blank" rel="noreferrer noopener" className={item}>
        <MessageCircle size={14} aria-hidden />
        {t('whatsapp')}
      </a>
      <a href={telegram} target="_blank" rel="noreferrer noopener" className={item}>
        <Send size={14} aria-hidden />
        {t('telegram')}
      </a>
      <button type="button" onClick={copy} className={item} aria-live="polite">
        {copied ? <Check size={14} aria-hidden /> : <Link2 size={14} aria-hidden />}
        {copied ? t('copied') : t('copy')}
      </button>
      <Link href={briefHref} className={item}>
        <Printer size={14} aria-hidden />
        {t('brief')}
      </Link>
    </div>
  );
}
