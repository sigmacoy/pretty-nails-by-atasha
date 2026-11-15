'use client';

import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full max-w-[460px] mx-auto min-h-[520px] rounded-3xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-8 animate-pulse"
          aria-hidden="true"
        />
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
