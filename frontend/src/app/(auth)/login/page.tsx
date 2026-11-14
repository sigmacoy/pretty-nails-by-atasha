'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950 px-4 py-12 transition-colors">
      <Suspense
        fallback={
          <div
            className="w-full max-w-[440px] mx-auto min-h-[480px] rounded-3xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-8 animate-pulse"
            aria-hidden="true"
          />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
