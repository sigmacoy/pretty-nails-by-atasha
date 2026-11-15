'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-8 sm:p-12 bg-white/90 dark:bg-stone-900/90 shadow-card text-center max-w-md w-full">
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900 dark:text-rose-50 mb-2">
          Studio service interruption
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-6 font-sans leading-relaxed">
          The studio interface encountered an unexpected interruption. You can retry the operation or return to the main salon directory.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="h-14 px-8 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-sans font-medium text-xs sm:text-sm gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            className="h-14 px-8 rounded-full border-rose-200/80 dark:border-rose-800/60 font-sans font-medium text-xs sm:text-sm"
            onClick={() => window.location.href = '/'}
          >
            Return to Studio
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left p-4 bg-rose-50/50 dark:bg-stone-800/60 border border-rose-200/60 dark:border-rose-950/40 rounded-xl text-xs font-mono">
            <summary className="font-medium font-sans text-stone-700 dark:text-stone-300 cursor-pointer mb-2">Diagnostic Details</summary>
            <pre className="whitespace-pre-wrap text-rose-800 dark:text-rose-300">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
