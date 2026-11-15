'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-transparent',
      secondary:
        'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-200/70 dark:hover:bg-stone-700/70 border border-stone-200/80 dark:border-stone-700/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
      outline:
        'border border-stone-200 dark:border-stone-700 bg-transparent text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100',
      ghost:
        'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
    };

    const sizes = {
      sm: 'h-8 rounded-md px-3 text-xs gap-1.5',
      md: 'h-9 rounded-md px-4 py-2 text-sm gap-2',
      lg: 'h-10 rounded-lg px-6 text-sm gap-2',
      xl: 'h-11 rounded-lg px-7 text-base gap-2.5',
      icon: 'h-9 w-9 rounded-md p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-3.5 w-3.5 animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
