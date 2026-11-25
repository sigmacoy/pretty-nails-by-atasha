'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Chrome, Facebook } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { StudioMark } from '@/components/layout/Header';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const OAUTH_GOOGLE_URL = `${process.env.NEXT_PUBLIC_API_BASE || '/api/backend'}/oauth2/authorization/google`;
const OAUTH_FACEBOOK_URL = `${process.env.NEXT_PUBLIC_API_BASE || '/api/backend'}/oauth2/authorization/facebook`;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(data.email);
      toast.success('If the email exists, a password reset link has been sent.');
      router.push('/login');
      router.refresh();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Unable to process request. Please try again.';

      if (message.includes('Invalid') || message.includes('email')) {
        setError('email', { type: 'manual', message: 'Invalid email address. Please check and try again.' });
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
          Reset Password
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans max-w-sm">
          Enter your email address and we&apos;ll send you a link to reset your password.
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
            <span className="bg-white/95 dark:bg-stone-900/95 px-4 text-stone-500 dark:text-stone-400">Or reset with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-sans">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="maria@example.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={isSubmitting}
            className="rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordForm;