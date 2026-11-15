'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default:
        'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/15 dark:border-primary/30',
      secondary:
        'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80',
      destructive:
        'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
      outline:
        'text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 bg-transparent',
      success:
        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
      warning:
        'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
      info:
        'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-normal transition-colors select-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
export { Badge };
