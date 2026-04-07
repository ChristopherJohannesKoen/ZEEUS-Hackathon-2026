import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?: boolean; // left green border accent
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover, onClick, accent, padding = 'md' }: CardProps) {
  const paddingMap = { sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-white border border-surface-border shadow-card',
        paddingMap[padding],
        hover &&
          'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        accent && 'border-l-4 border-l-brand',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

export function ScoreCard({
  label,
  value,
  max,
  unit,
  color = 'brand',
  children
}: {
  label: string;
  value: number | string;
  max?: number;
  unit?: string;
  color?: 'brand' | 'amber' | 'red' | 'gray';
  children?: React.ReactNode;
}) {
  const colorMap = {
    brand: 'text-brand-dark',
    amber: 'text-amber-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  };
  return (
    <div className="rounded-2xl bg-white border border-surface-border shadow-card p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className={cn('text-3xl font-black tracking-tight', colorMap[color])}>
        {value}
        {max !== undefined && <span className="text-lg text-gray-400 font-medium">/{max}</span>}
        {unit && <span className="text-base text-gray-400 font-medium ml-1">{unit}</span>}
      </div>
      {children}
    </div>
  );
}
