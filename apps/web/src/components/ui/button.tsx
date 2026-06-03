import { cn } from '@/lib/utils';
import { CONTROL_HEIGHT } from '@/lib/control-styles';
import Link from 'next/link';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonVariants({
  variant = 'default',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    CONTROL_HEIGHT,
    variant === 'default' &&
      'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110',
    variant === 'accent' &&
      'bg-gradient-to-r from-accent to-amber-600 text-white shadow-md shadow-accent/25 hover:brightness-110',
    variant === 'outline' &&
      'border border-border bg-card-solid/80 text-foreground backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5',
    variant === 'ghost' && 'text-foreground hover:bg-black/5',
    variant === 'destructive' &&
      'bg-red-50 text-red-700 ring-1 ring-red-100 hover:bg-red-100',
    size === 'sm' && 'px-3 text-sm',
    size === 'md' && 'px-4 text-sm',
    size === 'lg' && 'px-6 text-base',
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

interface ButtonLinkProps extends ButtonStyleOptions {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLink({
  href,
  children,
  variant = 'default',
  size = 'md',
  className,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonVariants({ variant, size, className })}>
      {children}
    </Link>
  );
}
