import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  variant?: 'dark' | 'light';
}

const sizes = {
  sm: { img: 32, title: 'text-base', sub: 'text-[10px]' },
  md: { img: 40, title: 'text-lg', sub: 'text-[10px]' },
  lg: { img: 56, title: 'text-2xl', sub: 'text-xs' },
};

export function Logo({
  collapsed = false,
  showText = true,
  size = 'md',
  href = '/dashboard',
  className,
  variant = 'dark',
}: LogoProps) {
  const s = sizes[size];
  const isDark = variant === 'dark';

  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl ring-1',
          isDark
            ? 'shadow-lg shadow-primary/20 ring-white/10'
            : 'shadow-md shadow-primary/10 ring-black/5',
        )}
      >
        <Image
          src="/logo.png"
          alt="LinguaFlow AI"
          width={s.img}
          height={s.img}
          className="object-cover"
          priority
        />
      </div>
      {showText && !collapsed && (
        <div className="min-w-0">
          <p
            className={cn(
              'truncate font-bold tracking-tight',
              s.title,
              isDark ? 'text-white' : 'text-foreground',
            )}
          >
            LinguaFlow
          </p>
          <p
            className={cn(
              'truncate font-medium uppercase tracking-widest',
              s.sub,
              isDark ? 'text-white/50' : 'text-muted',
            )}
          >
            AI · 学中文
          </p>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
