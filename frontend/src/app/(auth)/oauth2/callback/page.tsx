'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

function OAuth2CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('OAuth2 authentication failed. Please try again.');
        router.push('/login');
        return;
      }

      if (!token) {
        toast.error('No authentication token received. Please try again.');
        router.push('/login');
        return;
      }

      try {
        // Fetch user info using the token
        const response = await authApi.me();
        login(token, response.data);

        // Get redirect URL from sessionStorage or default to home
        // Redirect admins to admin dashboard
        const redirectTo = response.data?.role === 'ADMIN'
          ? '/admin'
          : (sessionStorage.getItem('oauth_redirect') || '/');
        sessionStorage.removeItem('oauth_redirect');

        toast.success('Signed in successfully with OAuth2.');
        router.push(redirectTo);
        router.refresh();
      } catch (err) {
        console.error('OAuth2 callback error:', err);
        toast.error('Failed to complete authentication. Please try again.');
        router.push('/login');
      }
    };

    handleCallback();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3] dark:bg-[#160D12] px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-rose-800 dark:text-rose-300" />
        <p className="text-stone-600 dark:text-stone-300 font-sans">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3] dark:bg-[#160D12] px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-rose-800 dark:text-rose-300" />
          <p className="text-stone-600 dark:text-stone-300 font-sans">
            Loading...
          </p>
        </div>
      </div>
    }>
      <OAuth2CallbackContent />
    </Suspense>
  );
}