import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          variant === 'default' &&
            'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110',
          variant === 'accent' &&
            'bg-gradient-to-r from-accent to-amber-600 text-white shadow-md shadow-accent/25 hover:brightness-110',
          variant === 'outline' &&
            'border border-border bg-card-solid/80 text-foreground backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5',
          variant === 'ghost' &&
            'text-foreground hover:bg-black/5',
          variant === 'destructive' &&
            'bg-red-50 text-red-700 ring-1 ring-red-100 hover:bg-red-100',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2.5 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
