'use client';

import { Children, cloneElement, isValidElement, useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { gridClass, type GridPreset } from '@/lib/layout';

export function ResultsGrid({
  children,
  className,
  preset = 'ledger',
  viewport = 1280
}: {
  children: ReactNode;
  className?: string;
  preset?: GridPreset;
  viewport?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-stagger]'));
    if (cards.length === 0) return;

    const rows: HTMLElement[][] = [];
    for (const card of cards) {
      const top = Math.round(card.getBoundingClientRect().top);
      const row = rows.find(
        (r) => Math.abs(r[0].getBoundingClientRect().top - top) < 2
      );
      if (row) row.push(card);
      else rows.push([card]);
    }

    cards.forEach((c) => c.classList.add('stagger-init'));
    const raf = requestAnimationFrame(() => {
      rows.forEach((row, i) => {
        row.forEach((card) => {
          card.style.transitionDelay = `${i * 50}ms`;
          card.classList.add('stagger-in');
        });
      });
    });

    const delay = rows.length * 50 + 400;
    const timer = setTimeout(() => {
      cards.forEach((card) => {
        card.style.transitionDelay = '';
        card.classList.remove('stagger-init', 'stagger-in');
      });
    }, delay);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  const guarded = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{ className?: string }>;
    return cloneElement(element, {
      className: `${element.props.className ?? ''} grid-guard`
    });
  });

  return (
    <div
      ref={ref}
      className={`grid grid-guard gap-3 ${gridClass(preset, viewport)} ${className ?? ''}`}
    >
      {guarded}
    </div>
  );
}