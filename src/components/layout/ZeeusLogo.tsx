import { cn } from '@/lib/utils';

interface ZeeusLogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  dark?: boolean; // white on dark bg
}

export function ZeeusLogo({ className, variant = 'full', dark = false }: ZeeusLogoProps) {
  const textColor = dark ? 'text-white' : 'text-zeeus-dark';
  const dotColor = dark ? '#B9E021' : '#39B54A';

  if (variant === 'mark') {
    // Just the circle mark
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('h-10 w-10', className)}
        aria-label="ZEEUS"
      >
        <circle cx="20" cy="20" r="20" fill="#39B54A" />
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="800"
          fontSize="18"
          fill="white"
        >
          Z
        </text>
        <circle cx="30" cy="30" r="4" fill="#B9E021" />
      </svg>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo mark */}
      <svg viewBox="0 0 36 36" fill="none" className="h-9 w-9 flex-shrink-0" aria-hidden="true">
        <circle cx="18" cy="18" r="18" fill="#39B54A" />
        <text
          x="18"
          y="24"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="800"
          fontSize="16"
          fill="white"
        >
          Z
        </text>
        <circle cx="27" cy="27" r="4" fill={dotColor} />
      </svg>
      {/* Wordmark */}
      <div className={cn('flex flex-col leading-none', textColor)}>
        <span
          className="text-2xl font-black tracking-[0.08em] uppercase"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em' }}
        >
          ZEEUS
        </span>
        <span className="text-[9px] font-medium tracking-widest uppercase opacity-70">
          Zero Emissions
        </span>
      </div>
    </div>
  );
}
