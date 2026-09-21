import type { CSSProperties } from 'react';

export type InsightMarker = 'signal' | 'gold' | 'muted';

const markerClass: Record<InsightMarker, string> = {
  signal: 'border-signal bg-signal',
  gold: 'border-flag-gold bg-flag-gold',
  muted: 'border-ink/50'
};

export function InsightTile({
  label,
  value,
  note,
  marker,
  index = 0,
  className
}: {
  label: string;
  value: string;
  note?: string;
  marker?: InsightMarker;
  index?: number;
  className?: string;
}) {
  return (
    <div
      role="listitem"
      style={{ '--n': index } as CSSProperties}
      className={`panel-glass tile-hover grid-guard flex flex-col gap-1.5 p-4 sm:p-5 ${className ?? ''}`}
    >
      {marker ? (
        <span aria-hidden className={`h-2.5 w-2.5 rounded-[2px] border ${markerClass[marker]}`} />
      ) : null}
      <p className="text-xs leading-4 text-ink/60">{label}</p>
      <p dir="ltr" className="whitespace-nowrap font-mono text-xl leading-7 tabular-nums text-signal">
        {value}
      </p>
      {note ? <p className="mt-auto text-xs leading-4 text-ink/50">{note}</p> : null}
    </div>
  );
}