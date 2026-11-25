'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function EmailVerifyContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      window.location.href = `/verify-email?token=${encodeURIComponent(token)}`;
    } else {
      window.location.href = '/verify-email';
    }
  }, [searchParams]);

  return null;
}

export default function EmailVerifyPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerifyContent />
    </Suspense>
  );
}