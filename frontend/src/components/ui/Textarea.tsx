'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-stone-200 dark:border-stone-700 bg-background dark:bg-stone-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40 disabled:cursor-not-allowed disabled:opacity-50 font-sans',
            error && 'border-destructive focus:ring-destructive/30 focus:border-destructive/40',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-destructive font-normal font-sans" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 font-normal font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export { Textarea };