'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Chrome, Facebook } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { StudioMark } from '@/components/layout/Header';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const OAUTH_GOOGLE_URL = `${process.env.NEXT_PUBLIC_API_BASE || '/api/backend'}/oauth2/authorization/google`;
const OAUTH_FACEBOOK_URL = `${process.env.NEXT_PUBLIC_API_BASE || '/api/backend'}/oauth2/authorization/facebook`;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setTokenError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    setIsSubmitting(true);
    setTokenError(null);
    try {
      await authApi.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Password has been reset successfully. You can now sign in.');
      router.push('/login');
      router.refresh();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Unable to reset password. Please try again.';

      if (message.includes('Invalid') || message.includes('expired') || message.includes('token')) {
        setTokenError('This reset link is invalid or has expired. Please request a new one.');
      } else if (message.includes('Password')) {
        setError('password', { type: 'manual', message });
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = (providerUrl: string) => {
    window.location.href = providerUrl;
  };

  if (!token) {
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
            Reset Password
          </h1>
        </div>
        <div className="rounded-3xl bg-white/95 dark:bg-stone-900/95 border border-rose-200/80 dark:border-rose-950/60 p-7 sm:p-9 shadow-card backdrop-blur-sm">
          <div className="text-center py-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
              This password reset link is missing the required token. Please request a new password reset link.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
            >
              Request New Link
            </Link>
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
          Create New Password
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans max-w-sm">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      {/* Warm Editorial Salon Sheet */}
      <div className="rounded-3xl bg-white/95 dark:bg-stone-900/95 border border-rose-200/80 dark:border-rose-950/60 p-7 sm:p-9 shadow-card backdrop-blur-sm">
        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthLogin(OAUTH_GOOGLE_URL)}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-200 font-medium text-sm hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Continue with Google"
          >
            <Chrome className="h-5 w-5" />
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin(OAUTH_FACEBOOK_URL)}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-200 font-medium text-sm hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Continue with Facebook"
          >
            <Facebook className="h-5 w-5" />
            <span>Facebook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-rose-200/80 dark:border-rose-950/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white/95 dark:bg-stone-900/95 px-4 text-stone-500 dark:text-stone-400">Or set password with email</span>
          </div>
        </div>

        {tokenError && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
            <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">{tokenError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-sans">
          <div className="relative">
            <Input
              label="New password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pr-10 rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
              {...register('password')}
              error={errors.password?.message}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-[32px] p-1 rounded-md text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm new password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pr-10 rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-[32px] p-1 rounded-md text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          <p className="text-center text-xs text-stone-500 dark:text-stone-400 pt-2 font-sans">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-rose-800 dark:text-rose-300 hover:underline font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordForm;