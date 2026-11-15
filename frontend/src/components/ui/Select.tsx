'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'flex h-10 w-full rounded-md border border-stone-200 dark:border-stone-700 bg-background dark:bg-stone-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40 disabled:cursor-not-allowed disabled:opacity-50 font-sans',
            error && 'border-destructive focus:ring-destructive/30 focus:border-destructive/40',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs text-destructive font-normal font-sans" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 font-normal font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export { Select };