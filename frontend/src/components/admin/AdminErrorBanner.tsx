'use client';

import { useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminError, useAdminErrors } from '@/lib/auth';

// Re-export useAdminErrors for admin pages to import from here
export { useAdminErrors } from '@/lib/auth';

interface AdminErrorBannerProps {
  autoDismissDelay?: number;
}

const DEFAULT_AUTO_DISMISS_DELAY = 10000; // 10 seconds

export function AdminErrorBanner({ autoDismissDelay = DEFAULT_AUTO_DISMISS_DELAY }: AdminErrorBannerProps) {
  const { errors, dismissError, dismissAllErrors } = useAdminErrors();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-dismiss individual errors after delay
  useEffect(() => {
    // Clear previous timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    errors.forEach((error) => {
      const elapsed = Date.now() - error.timestamp;
      const remaining = Math.max(0, autoDismissDelay - elapsed);
      const timeout = setTimeout(() => {
        dismissError(error.id);
      }, remaining);
      timeoutsRef.current.push(timeout);
    });

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [errors, dismissError, autoDismissDelay]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pointer-events-none',
        'lg:ml-60 lg:max-w-7xl lg:mx-auto'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="pointer-events-auto max-w-7xl mx-auto space-y-2">
        {errors.map((error) => (
          <div
            key={error.id}
            className={cn(
              'relative flex items-start gap-3 rounded-xl border bg-rose-600/95 text-white shadow-[0_8px_24px_-4px_rgba(225,29,72,0.3)] backdrop-blur-sm',
              'animate-in slide-in-from-top-2 duration-300 ease-studio',
              'dark:bg-rose-700/95'
            )}
          >
            <div className="flex-shrink-0 mt-0.5 flex items-center justify-center pl-3.5 py-3.5">
              <AlertCircle className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 py-3.5">
              <p className="text-sm font-medium leading-relaxed">{error.message}</p>
            </div>
            <div className="flex items-center gap-2 pr-3 py-3.5">
              {errors.length > 1 && (
                <button
                  type="button"
                  onClick={dismissAllErrors}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full',
                    'bg-white/20 hover:bg-white/30 text-white transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50'
                  )}
                  aria-label="Dismiss all errors"
                >
                  <X className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
                  Dismiss all
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissError(error.id)}
                className={cn(
                  'flex items-center justify-center h-9 w-9 rounded-full',
                  'bg-white/15 hover:bg-white/25 text-white transition-colors',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50'
                )}
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}