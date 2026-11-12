'use client';

import { Suspense } from 'react';
import { BookingForm } from './BookingForm';

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="container-padding section-padding max-w-7xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-stone-100 dark:bg-stone-800 rounded-[4px] animate-pulse" />
            <div className="h-8 w-64 bg-stone-100 dark:bg-stone-800 rounded-[6px] animate-pulse" />
          </div>
          <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-[12px] animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-96 bg-stone-100 dark:bg-stone-800 rounded-[12px] animate-pulse" />
            <div className="lg:col-span-4 h-80 bg-stone-100 dark:bg-stone-800 rounded-[12px] animate-pulse" />
          </div>
        </div>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
