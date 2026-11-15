'use client';

import { Suspense } from 'react';
import { BookingForm } from './BookingForm';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-4 w-48 bg-rose-200/50 dark:bg-rose-950/40 rounded-full" />
              <Skeleton className="h-10 w-96 bg-rose-200/50 dark:bg-rose-950/40 rounded-lg" />
              <Skeleton className="h-4 w-full max-w-xl bg-rose-200/40 dark:bg-rose-950/30 rounded-md" />
            </div>
            <div className="h-24 bg-white/90 dark:bg-stone-900/90 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-6 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 h-96 bg-white/90 dark:bg-stone-900/90 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-6 animate-pulse" />
              <div className="lg:col-span-4 h-80 bg-white/90 dark:bg-stone-900/90 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-6 animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
