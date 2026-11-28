'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LogoutPage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const doLogout = async () => {
      // Clear localStorage token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('prettynails_token');
      }
      // Call backend logout to clear httpOnly cookie
      try {
        await fetch('/api/backend/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // Ignore errors
      }
      setCleared(true);
      router.push('/');
      router.refresh();
    };
    doLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3] dark:bg-[#160D12] text-foreground px-4 py-8">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-5 rounded-full bg-rose-100 dark:bg-rose-950/40 p-4">
          <svg className="h-12 w-12 text-rose-700 dark:text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif text-stone-900 dark:text-rose-50">Logging out…</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {cleared ? 'Session cleared. Redirecting…' : 'Clearing your session and redirecting to home.'}
        </p>
        <Link href="/" className="mt-6 inline-block text-rose-800 dark:text-rose-300 hover:underline">
          Or click here to go home now
        </Link>
      </div>
    </div>
  );
}