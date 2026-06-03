'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Chiều rộng panel — mặc định max-w-lg */
  size?: 'md' | 'lg' | 'xl';
  /** id cho aria-labelledby */
  labelledBy?: string;
  className?: string;
}

const sizeClass = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  children,
  size = 'md',
  labelledBy,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          'relative z-10 flex w-full max-h-[min(calc(100dvh-2rem),40rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card-solid shadow-xl',
          sizeClass[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalHeader({
  title,
  description,
  onClose,
  icon,
  titleId,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  icon?: React.ReactNode;
  titleId?: string;
}) {
  return (
    <div className="relative flex shrink-0 items-start gap-3 border-b border-border px-5 py-4">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1 pr-8">
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-2 text-muted transition-colors hover:bg-black/5 hover:text-foreground"
        aria-label="Đóng"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm', className)}>
      {children}
    </div>
  );
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'shrink-0 border-t border-border px-5 py-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
