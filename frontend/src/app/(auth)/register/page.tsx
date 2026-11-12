'use client';

import { Suspense } from 'react';
import { RegisterForm } from './RegisterForm';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-[440px] mx-auto">
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
