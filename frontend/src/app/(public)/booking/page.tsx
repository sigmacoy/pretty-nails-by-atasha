'use client';

import { Suspense } from 'react';
import { BookingForm } from './BookingForm';

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="container-padding section-padding flex items-center justify-center min-h-[400px]" />}>
      <BookingForm />
    </Suspense>
  );
}