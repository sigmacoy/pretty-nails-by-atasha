'use client';

import { forwardRef, InputHTMLAttributes, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
}

/**
 * PhoneInput - Only accepts digits, auto-formats as Philippine mobile number (09XX XXX XXXX)
 * Strips non-digits on input, formats on blur/display
 */
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, label, error, helperText, id, value: controlledValue, onChange, defaultValue, disabled, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);

    const isControlled = controlledValue !== undefined;
    const rawValue = isControlled ? controlledValue : uncontrolledValue;

    // Strip non-digits
    const digitsOnly = rawValue.replace(/\D/g, '');

    // Format as 09XX XXX XXXX for display (when not focused)
    const formatForDisplay = useCallback((digits: string): string => {
      if (digits.length <= 4) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
    }, []);

    const displayValue = isFocused ? digitsOnly : formatForDisplay(digitsOnly);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const digits = input.replace(/\D/g, '').slice(0, 11); // Max 11 digits for PH mobile
      const formatted = formatForDisplay(digits);

      if (!isControlled) {
        setUncontrolledValue(formatted);
      }
      onChange?.(digits); // Always pass digits-only to parent
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // On blur, ensure we store the formatted version
      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
      const formatted = formatForDisplay(digits);
      if (!isControlled) {
        setUncontrolledValue(formatted);
      }
      onChange?.(digits);
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    // Prevent non-digit keys (except control keys)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Control', 'Alt', 'Shift', 'Meta'
      ];
      // Allow Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
      const isShortcut = (e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase());

      if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key) && !isShortcut) {
        e.preventDefault();
      }
      props.onKeyDown?.(e);
    };

    // For form submission, we want to submit the digits-only value
    const handleFormData = useCallback(() => {
      return digitsOnly;
    }, [digitsOnly]);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full rounded-md border border-stone-200 dark:border-stone-700 bg-background dark:bg-stone-900/60 px-3 py-1.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40 disabled:cursor-not-allowed disabled:opacity-50 font-mono tabular-nums',
            error && 'border-destructive focus:ring-destructive/30 focus:border-destructive/40',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-destructive font-normal font-sans" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 font-normal font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
export { PhoneInput };