import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'amber' | 'red';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'brand',
  className
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };
  const colors = {
    brand: 'bg-brand',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-gray-600">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-gray-700">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-surface-border overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

// Segmented score bar (E/S/G topics)
export function ScoreBar({
  score,
  max = 4,
  className
}: {
  score: number;
  max?: number;
  className?: string;
}) {
  const pct = (score / max) * 100;
  let colorClass = 'bg-gray-200';
  if (score === 0) colorClass = 'bg-gray-200';
  else if (score < 1) colorClass = 'bg-emerald-400';
  else if (score < 2) colorClass = 'bg-green-500';
  else if (score < 2.5) colorClass = 'bg-amber-500';
  else colorClass = 'bg-red-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}
