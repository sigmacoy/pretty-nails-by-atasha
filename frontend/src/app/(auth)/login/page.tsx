'use client';

import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full max-w-[400px] mx-auto min-h-[420px] rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 sm:p-8 animate-pulse"
          aria-hidden="true"
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
