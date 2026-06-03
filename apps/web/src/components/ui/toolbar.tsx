import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

/** Hàng nút / filter — căn giữa theo chiều dọc, cùng chiều cao control. */
export function Toolbar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}
