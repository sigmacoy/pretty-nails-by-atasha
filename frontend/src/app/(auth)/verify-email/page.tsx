'use client';

import { Suspense } from 'react';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full max-w-[440px] mx-auto min-h-[480px] rounded-3xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-8 animate-pulse"
          aria-hidden="true"
        />
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}