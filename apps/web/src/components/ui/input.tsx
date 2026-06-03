import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-border bg-card-solid/90 px-4 py-2.5 text-sm shadow-sm outline-none transition-all placeholder:text-muted/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/10',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
