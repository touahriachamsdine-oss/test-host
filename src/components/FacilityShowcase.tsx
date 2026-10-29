'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FileCheck,
  Handshake,
  HeartHandshake
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const FACILITIES = [
  { slug: 'cde', code: 'CDE', Icon: BookOpen },
  { slug: 'business-incubator', code: 'INC', Icon: Building2 },
  { slug: 'cati', code: 'CATI', Icon: FileCheck },
  { slug: 'blue-bleu', code: 'BLUE', Icon: Handshake },
  { slug: 'mia', code: 'MIA', Icon: Cpu },
  { slug: 'student-services', code: 'PSY', Icon: HeartHandshake }
] as const;

const COUNT = FACILITIES.length;

export function FacilityShowcase() {
  const t = useTranslations('Units');
  const names = useTranslations('unitNames');
  const taglines = useTranslations('unitTaglines');
  const descriptions = useTranslations('unitDescriptions');

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const id = window.setInterval(() => setIndex((current) => (current + 1) % COUNT), 5200);
    return () => window.clearInterval(id);
  }, [paused]);

  const go = (delta: number) => setIndex((current) => (current + delta + COUNT) % COUNT);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('title')}
      className="mx-auto max-w-6xl px-4 pt-4 sm:px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
        <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('title')}</h2>
        <p className="max-w-md text-sm text-ink/60">{t('subtitle')}</p>
      </div>

      <div
        className="facility-stage relative mt-6 h-[290px] overflow-hidden sm:h-[320px]"
        style={{ perspective: '1200px' }}
      >
        <div className="absolute inset-0">
          {FACILITIES.map((facility, position) => {
            let rel = position - index;
            if (rel > COUNT / 2) rel -= COUNT;
            if (rel < -COUNT / 2) rel += COUNT;
            const active = rel === 0;
            const side = Math.abs(rel) === 1;
            const Icon = facility.Icon;
            const shift = rel === 0 ? 0 : rel > 0 ? 92 : -92;
            const hiddenShift = rel > 0 ? 165 : -165;
            return (
              <article
                key={facility.slug}
                aria-hidden={!active}
                className={`absolute inset-0 m-auto flex h-[270px] w-[250px] flex-col gap-2 rounded-2xl border border-line bg-paper p-5 shadow-[0_18px_40px_-28px_rgb(0_0_0/0.55)] sm:h-[290px] sm:w-[330px] ${
                  active ? '' : 'pointer-events-none'
                }`}
                style={{
                  transform: active
                    ? 'translateX(0) rotateY(0deg) scale(1)'
                    : side
                      ? `translateX(${shift}%) rotateY(${-rel * 32}deg) scale(0.86)`
                      : `translateX(${hiddenShift}%) rotateY(${-rel * 38}deg) scale(0.7)`,
                  opacity: active ? 1 : side ? 0.62 : 0,
                  zIndex: active ? 3 : side ? 2 : 1,
                  transition:
                    'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease'
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span dir="ltr" className="font-mono text-xs font-medium leading-5 text-signal">
                    {facility.code}
                  </span>
                  <Icon size={18} className="text-ink/40" aria-hidden />
                </span>

                <h3 className="text-[17px] font-semibold leading-6 tracking-tight text-ink">
                  {names(facility.slug)}
                </h3>
                <p className="text-xs font-medium uppercase tracking-wide text-signal">
                  {taglines(facility.slug)}
                </p>
                <p
                  className="mt-1 overflow-hidden text-[13px] leading-[19px] text-ink/65"
                  style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}
                >
                  {descriptions(facility.slug)}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t('navLabel')}
          className="ring-focus inline-flex h-9 w-9 items-center justify-center rounded-full border border-line/60 text-ink/60 transition-colors hover:text-ink"
        >
          <ChevronLeft size={16} aria-hidden className="flip-rtl" />
        </button>

        <div className="flex items-center gap-2" aria-live="polite">
          {FACILITIES.map((facility, position) => (
            <button
              key={facility.slug}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={names(facility.slug)}
              aria-current={position === index ? 'true' : undefined}
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
                position === index ? 'w-6 bg-signal' : 'w-2 bg-ink/20 hover:bg-ink/40'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t('navLabel')}
          className="ring-focus inline-flex h-9 w-9 items-center justify-center rounded-full border border-line/60 text-ink/60 transition-colors hover:text-ink"
        >
          <ChevronRight size={16} aria-hidden className="flip-rtl" />
        </button>
      </div>
    </section>
  );
}
