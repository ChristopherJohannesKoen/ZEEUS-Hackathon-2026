import { cn } from '@packages/ui';

export function ZeeusLogo({
  className,
  compact = false,
  dark = false
}: {
  className?: string;
  compact?: boolean;
  dark?: boolean;
}) {
  const textClassName = dark ? 'text-white' : 'text-brand-dark';
  const accentFill = dark ? '#b9e021' : '#39b54a';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        aria-hidden="true"
        className={compact ? 'h-10 w-10' : 'h-11 w-11'}
        fill="none"
        viewBox="0 0 40 40"
      >
        <circle cx="20" cy="20" fill="#39b54a" r="20" />
        <text
          fill="white"
          fontFamily="var(--font-display), var(--font-body), sans-serif"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          x="20"
          y="26"
        >
          Z
        </text>
        <circle cx="30" cy="30" fill={accentFill} r="4" />
      </svg>
      {!compact ? (
        <div className={cn('flex flex-col leading-none', textClassName)}>
          <span className="text-xl font-black tracking-[0.2em]">ZEEUS</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] opacity-70">
            Sustainability by Design
          </span>
        </div>
      ) : null}
    </div>
  );
}
