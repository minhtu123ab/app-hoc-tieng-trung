import { cn } from '@/lib/utils';
import { controlFieldClass, controlFocusClass } from '@/lib/control-styles';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        controlFieldClass,
        controlFocusClass,
        'w-full placeholder:text-muted/60',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
