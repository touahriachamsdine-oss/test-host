import type { CSSProperties } from 'react';
import { gridClass } from '@/lib/layout';
import type { DomainInsightRow } from '@/lib/insights';

export type InsightBreakdownRow = DomainInsightRow & { name: string };

export function InsightBreakdown({
  rows,
  viewport = 1280,
  className
}: {
  rows: InsightBreakdownRow[];
  viewport?: number;
  className?: string;
}) {
  return (
    <div
      role="list"
      className={`rise-in grid grid-guard gap-2 ${gridClass('cards', viewport)} ${className ?? ''}`}
    >
      {rows.map((row, i) => (
        <div
          key={row.slug}
          role="listitem"
          style={{ '--n': i } as CSSProperties}
          className="tile-hover grid-guard flex min-w-0 flex-col gap-2 border border-line bg-surface p-4"
        >
          <span className="flex items-center justify-between gap-2">
            <span dir="ltr" className="font-mono text-xs font-medium tabular-nums text-signal">
              {row.code}
            </span>
            <span dir="ltr" className="font-mono text-lg leading-6 tabular-nums text-ink">
              {row.count}
            </span>
          </span>
          <span className="truncate text-sm leading-5 text-ink/80">{row.name}</span>
          <span aria-hidden className="h-px w-full bg-line">
            <span
              data-breakdown-bar
              className="block h-px bg-signal"
              style={{ width: `${Math.round(row.share * 100)}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}