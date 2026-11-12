'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { StudioMark } from '@/components/layout/Header';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      login(response.data.token, response.data.user);
      toast.success('Welcome back');
      router.push(redirectTo);
      router.refresh();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Invalid email or password';

      if (message.includes('Invalid') || message.includes('incorrect')) {
        setError('password', { type: 'manual', message: 'Invalid email or password' });
        setError('email', { type: 'manual', message: 'Invalid email or password' });
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Studio Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center mb-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-opacity duration-150 hover:opacity-85"
          aria-label="Pretty Nails home"
        >
          <StudioMark size="lg" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Welcome back
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          Sign in to your Pretty Nails account
        </p>
      </div>

      {/* Porcelain Card Form */}
      <Card className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="maria@example.com"
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-9"
                {...register('password')}
                error={errors.password?.message}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-2.5 top-[28px] p-1 rounded text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-primary/40"
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

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 dark:border-stone-700 text-primary accent-primary focus:ring-1.5 focus:ring-primary/30 transition-colors"
                />
                <span className="text-xs text-stone-600 dark:text-stone-400">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors duration-150"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>

            <p className="text-center text-xs text-stone-500 dark:text-stone-400 pt-1">
              Don't have an account?{' '}
              <Link
                href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-primary hover:underline font-medium transition-colors"
              >
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;
