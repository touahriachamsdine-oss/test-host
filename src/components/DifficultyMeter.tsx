export type DifficultyAxisKey = 'technical' | 'capital' | 'regulatory' | 'market';

export function difficultyTier(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

interface DifficultyMeterProps {
  score: number;
  breakdown?: { technical: number; capital: number; regulatory: number; market: number };
  labels: {
    tier: string;
    axes: Record<DifficultyAxisKey, string>;
  };
}

export function DifficultyMeter({ score, breakdown, labels }: DifficultyMeterProps) {
  const tier = difficultyTier(score);
  const apexColors: Record<'low' | 'medium' | 'high', string> = {
    low: 'bg-brand-accent',
    medium: 'bg-flag-gold',
    high: 'bg-signal'
  };
  const barColors: Record<'low' | 'medium' | 'high', string> = {
    low: 'bg-brand-accent',
    medium: 'bg-flag-gold',
    high: 'bg-signal'
  };
  const axes: Array<[DifficultyAxisKey, number]> = breakdown
    ? [
        ['technical', breakdown.technical],
        ['capital', breakdown.capital],
        ['regulatory', breakdown.regulatory],
        ['market', breakdown.market]
      ]
    : [];

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={`rounded-[3px] px-2 py-1 font-mono text-sm font-semibold text-white ${apexColors[tier]}`}>
          {score}/100
        </span>
        <span className="text-sm font-medium text-ink/70">{labels.tier}</span>
      </div>
      {axes.length > 0 && (
        <div className="mt-4 grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
          {axes.map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs text-ink/60">
                <span>{labels.axes[key]}</span>
                <span dir="ltr" className="font-mono">{value}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className={`h-full rounded-full ${barColors[tier]}`}
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}