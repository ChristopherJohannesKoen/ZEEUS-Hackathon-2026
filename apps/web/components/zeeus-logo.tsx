import Image from 'next/image';
import { cn } from '@packages/ui';

export function ZeeusLogo({
  className,
  compact = false,
  dark = false,
  priority = false,
  variant = 'horizontal'
}: {
  className?: string;
  compact?: boolean;
  dark?: boolean;
  priority?: boolean;
  variant?: 'horizontal' | 'vertical';
}) {
  if (compact) {
    return (
      <div className={cn('inline-flex', className)}>
        <Image
          alt="ZEEUS symbol"
          className="h-11 w-11 object-contain"
          height={364}
          priority={priority}
          src="/brand/zeeus/logos/logo-symbol-circle.png"
          width={365}
        />
      </div>
    );
  }

  const alt = dark ? 'ZEEUS logo in a monochrome reverse lockup' : 'ZEEUS logo';
  const imageClassName = dark
    ? 'h-16 w-auto object-contain md:h-[4.5rem]'
    : variant === 'vertical'
      ? 'h-16 w-auto object-contain md:h-20'
      : 'h-12 w-auto object-contain md:h-[3.4rem]';
  const src = dark
    ? '/brand/zeeus/logos/logo-negative-on-black.png'
    : variant === 'vertical'
      ? '/brand/zeeus/logos/logo-primary-vertical.png'
      : '/brand/zeeus/logos/logo-primary-horizontal.png';
  const width = dark ? 1900 : variant === 'vertical' ? 1188 : 1644;
  const height = dark ? 951 : variant === 'vertical' ? 516 : 315;

  return (
    <div
      className={cn(
        'inline-flex items-center',
        dark ? 'overflow-hidden rounded-[28px] bg-black/95 p-4' : '',
        className
      )}
    >
      <Image
        alt={alt}
        className={imageClassName}
        height={height}
        priority={priority}
        src={src}
        width={width}
      />
    </div>
  );
}
