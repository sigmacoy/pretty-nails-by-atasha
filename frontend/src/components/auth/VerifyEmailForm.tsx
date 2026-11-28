'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Chrome, Facebook, AlertCircle } from 'lucide-react';
import { StudioMark } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const OAUTH_GOOGLE_URL = `${process.env.NEXT_PUBLIC_API_BASE || '/api/backend'}/oauth2/authorization/google`;
const OAUTH_FACEBOOK_URL = `${process.env.NEXT_PUBLIC_API_BASE || '/api/backend'}/oauth2/authorization/facebook`;

type VerifyStatus = 'verifying' | 'success' | 'error' | 'missing-token';

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const verifyAttemptedRef = useRef(false);

  useEffect(() => {
    // StrictMode double-invoke guard
    if (verifyAttemptedRef.current) return;
    verifyAttemptedRef.current = true;

    const verify = async () => {
      if (!token) {
        setStatus('missing-token');
        setMessage('Verification token is missing. Please check the link in your email or request a new verification email.');
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully. You can now sign in to your account.');
        toast.success('Email verified successfully!');
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const errorMessage = axiosError.response?.data?.message || 'Verification failed. Please try again.';

        if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('token')) {
          setStatus('error');
          setMessage('This verification link is invalid or has expired. Please request a new verification email.');
        } else if (errorMessage.includes('already verified')) {
          setStatus('success');
          setMessage('Your email is already verified. You can now sign in.');
          toast.success('Email already verified!');
        } else {
          setStatus('error');
          setMessage(errorMessage);
        }
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    try {
      await authApi.resendVerification(resendEmail);
      toast.success('If the email exists, a new verification link has been sent.');
      setResendEmail('');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Unable to send verification email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOAuthLogin = (providerUrl: string) => {
    window.location.href = providerUrl;
  };

  if (status === 'missing-token') {
    return (
      <div className="w-full max-w-[440px] mx-auto">
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center mb-5 rounded-full focus-visible:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40 transition-transform duration-200 hover:scale-[1.03]"
            aria-label="Pretty Nails by Atasha home"
          >
            <StudioMark size="lg" />
          </Link>
          <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 dark:text-rose-50 font-normal tracking-tight">
            Verify Email
          </h1>
        </div>
        <div className="rounded-3xl bg-white/95 dark:bg-stone-900/95 border border-rose-200/80 dark:border-rose-950/60 p-7 sm:p-9 shadow-card backdrop-blur-sm">
          <div className="text-center py-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">Missing Verification Token</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">{message}</p>
            <form onSubmit={handleResend} className="space-y-3">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="maria@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
                disabled={isResending}
              />
              <button
                type="submit"
                disabled={isResending || !resendEmail.trim()}
                className="w-full inline-flex items-center justify-center h-12 px-6 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </form>
            <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
              <Link href="/login" className="text-rose-800 dark:text-rose-300 hover:underline font-medium">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Studio Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center mb-5 rounded-full focus-visible:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40 transition-transform duration-200 hover:scale-[1.03]"
          aria-label="Pretty Nails by Atasha home"
        >
          <StudioMark size="lg" />
        </Link>
        <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold mb-2">
          Pretty Nails by Atasha · Cebu City
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 dark:text-rose-50 font-normal tracking-tight">
          Verify Email
        </h1>
      </div>

      {/* Warm Editorial Salon Sheet */}
      <div className="rounded-3xl bg-white/95 dark:bg-stone-900/95 border border-rose-200/80 dark:border-rose-950/60 p-7 sm:p-9 shadow-card backdrop-blur-sm">
        <div className="text-center py-8">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-rose-600 dark:text-rose-400 animate-spin" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">Verifying Your Email</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">Email Verified Successfully</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
              >
                Sign In to Studio
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">Verification Failed</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">{message}</p>
              <form onSubmit={handleResend} className="space-y-3 mb-4">
                <p className="text-xs text-stone-500 dark:text-stone-400">Request a new verification link:</p>
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="maria@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
                  disabled={isResending}
                />
                <button
                  type="submit"
                  disabled={isResending || !resendEmail.trim()}
                  className="w-full inline-flex items-center justify-center h-12 px-6 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </form>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <Link href="/login" className="text-rose-800 dark:text-rose-300 hover:underline font-medium">
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailForm;