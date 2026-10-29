'use client';

import { useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { PublicStartup } from '@/lib/db';

export function MvpPrompt({ startup }: { startup: PublicStartup }) {
  const t = useTranslations('MvpPrompt');
  const domainNames = useTranslations('domainNames');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const field = domainNames.has(startup.domain) ? domainNames(startup.domain) : startup.domain;
  const site = (startup.officialSite || startup.sourceUrl || '').trim();

  const record = [
    `- ${t('nameLabel')}: ${startup.name}`,
    `- ${t('fieldLabel')}: ${field}`,
    startup.country ? `- ${t('countryLabel')}: ${startup.country}` : null,
    startup.yearFounded > 0 ? `- ${t('yearLabel')}: ${startup.yearFounded}` : null,
    startup.technology ? `- ${t('technologyLabel')}: ${startup.technology}` : null,
    startup.shortDescription ? `- ${t('summaryLabel')}: ${startup.shortDescription}` : null,
    startup.teamRec && startup.teamRec.length > 0
      ? `- ${t('teamLabel')}: ${startup.teamRec.map((r) => `${r.count}× ${r.role}`).join('; ')}`
      : null,
    startup.buildApproach ? `- ${t('buildLabel')}: ${startup.buildApproach}` : null,
    startup.productIssues ? `- ${t('problemsLabel')}: ${startup.productIssues}` : null,
    startup.algeriaValue ? `- ${t('algeriaLabel')}: ${startup.algeriaValue}` : null,
    site ? `- ${t('sourceLabel')}: ${site}` : null
  ]
    .filter(Boolean)
    .join('\n');

  const deliverables = [t('d1'), t('d2'), t('d3'), t('d4'), t('d5'), t('d6'), t('d7'), t('d8')]
    .map((line, index) => `${index + 1}. ${line}`)
    .join('\n');

  const rules = [t('r1'), t('r2'), t('r3'), t('r4')].map((line) => `- ${line}`).join('\n');

  const prompt = [
    t('role'),
    '',
    t('recordTitle'),
    record,
    '',
    t('taskTitle'),
    t('task'),
    '',
    t('deliverablesTitle'),
    deliverables,
    '',
    t('rulesTitle'),
    rules,
    '',
    t('languageNote', { language: new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale })
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-10 max-w-2xl rounded-2xl border border-signal/30 bg-signal/[0.04] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
          <Sparkles size={16} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-6 text-ink">{t('title')}</h2>
          <p className="mt-1 text-sm leading-[22px] text-ink/65">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="ring-focus inline-flex items-center gap-2 rounded-[3px] border border-signal bg-signal px-3 py-1.5 text-sm font-medium text-paper transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)] active:scale-[0.99] motion-reduce:active:scale-100"
        >
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          {copied ? t('copied') : t('copy')}
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="ring-focus rounded-[3px] px-2 py-1.5 text-sm text-ink/60 underline underline-offset-2 hover:text-ink"
        >
          {open ? t('hide') : t('show')}
        </button>
      </div>

      {open && (
        <pre
          dir="auto"
          className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-line/50 bg-paper/70 p-4 text-[13px] leading-[20px] text-ink/85"
        >
          {prompt}
        </pre>
      )}

      <p className="mt-3 text-xs leading-5 text-ink/45">{t('note')}</p>
    </div>
  );
}
