'use client';

import { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-3xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className={cn(
            'relative w-full rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card text-card-foreground shadow-float my-8',
            sizeClasses[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {(title || showClose) && (
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-stone-200/60 dark:border-stone-800/60">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal">
                    {description}
                  </p>
                )}
              </div>
              {showClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-md shrink-0 ml-4"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4 stroke-[1.5]" />
                </Button>
              )}
            </div>
          )}
          <div className="p-5 sm:p-6">{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
