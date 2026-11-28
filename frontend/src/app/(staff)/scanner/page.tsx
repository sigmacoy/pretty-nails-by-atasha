'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/components/staff/QRScanner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function StaffScannerPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wakeLockRequestedRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/staff/scanner');
      } else if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthorized) return;

    // Prevent screen sleep on mobile devices during scanning
    const wakeLock = 'wakeLock' in navigator ? (navigator as any).wakeLock : null;

    const requestWakeLock = async () => {
      if (wakeLock && !wakeLockRequestedRef.current) {
        wakeLockRequestedRef.current = true;
        try {
          const lock = await wakeLock.request('screen');
          wakeLockRef.current = lock;
          // Handle wake lock release event
          lock.addEventListener('release', () => {
            wakeLockRef.current = null;
            wakeLockRequestedRef.current = false;
          });
        } catch (err) {
          console.warn('Wake Lock API not supported:', err);
          wakeLockRequestedRef.current = false;
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        wakeLockRequestedRef.current = false;
      }
    };
  }, [isAuthorized]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
            <Loader2 className="h-6 w-6 text-rose-800 dark:text-rose-300 animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-900 dark:text-rose-50">Staff Scanner</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">Verifying access...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="bg-white/95 dark:bg-stone-900/95 border-b border-rose-200/80 dark:border-rose-950/60 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <Loader2 className="h-6 w-6 text-rose-800 dark:text-rose-300 animate-spin" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-stone-900 dark:text-rose-50">Staff Scanner</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">Loyalty Card QR Scanner</p>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Scanner Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <QRScanner />
        </div>

        {/* Instructions */}
        <div className="mt-6 w-full max-w-md px-4">
          <div className="bg-white/90 dark:bg-stone-900/90 border border-rose-200/80 dark:border-rose-950/60 rounded-xl p-4">
            <h3 className="font-medium text-stone-900 dark:text-rose-50 mb-3 flex items-center gap-2">
              <span className="text-rose-800 dark:text-rose-300">📋</span>
              How to Use
            </h3>
            <ol className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-center">1</span>
                Point camera at customer's loyalty card QR code
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-center">2</span>
                Hold steady until scan completes (green flash)
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-center">3</span>
                Stamp is automatically added to customer's card
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-center">4</span>
                Show success message to customer
              </li>
            </ol>
          </div>

          {/* Offline Notice - removed false claim */}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/95 dark:bg-stone-900/95 border-t border-rose-200/80 dark:border-rose-950/60 px-4 py-3">
        <p className="text-center text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
          Pretty Nails by Atasha · Staff Loyalty Scanner
        </p>
      </footer>
    </div>
  );
}