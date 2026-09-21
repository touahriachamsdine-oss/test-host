import type { CSSProperties } from 'react';
import { gridClass } from '@/lib/layout';

export type StatsItem = {
  label: string;
  value: string;
  note?: string;
};

export function StatsStrip({
  items,
  viewport = 1280
}: {
  items: StatsItem[];
  viewport?: number;
}) {
  return (
    <div
      role="list"
      className={`rise-in card-soft rounded-none grid overflow-hidden ${gridClass('stats', viewport)}`}
    >
      {items.map((item, i) => (
        <div
          key={`${i}-${item.label}`}
          role="listitem"
          style={{ '--n': i } as CSSProperties}
          className="px-6 py-4 sm:px-8 sm:py-5"
        >
          <p className="text-sm leading-5 text-ink/60">{item.label}</p>
          <p dir="ltr" className="mt-1 font-mono text-lg leading-6 tabular-nums text-signal">
            {item.value}
          </p>
          {item.note ? <p className="mt-1 text-xs leading-4 text-ink/50">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}