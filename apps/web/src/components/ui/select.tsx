'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlFieldClass, controlFocusClass } from '@/lib/control-styles';

export interface SelectOption {
  value: string;
  label: string;
}

export function toSelectOptions(
  items: Array<string | { value: string; label: string }>,
): SelectOption[] {
  return items.map((item) =>
    typeof item === 'string' ? { value: item, label: item } : item,
  );
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  className,
  disabled,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const triggerId = id ?? autoId;

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          controlFieldClass,
          controlFocusClass,
          'flex w-full items-center justify-between gap-2 text-left',
          disabled && 'cursor-not-allowed opacity-50',
          open && 'border-primary/40 ring-4 ring-primary/10',
        )}
      >
        <span className={cn('min-w-0 truncate', !selected && 'text-muted/60')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card-solid py-1 shadow-lg ring-1 ring-black/5"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-foreground hover:bg-slate-50',
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isSelected ? <Check className="h-4 w-4" /> : null}
                  </span>
                  <span className="min-w-0 truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
