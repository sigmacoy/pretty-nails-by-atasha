'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { StudioMark } from '@/components/layout/Header';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      login(response.data.token, response.data.user);
      toast.success('Account created successfully');
      router.push(redirectTo);
      router.refresh();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Registration failed. Please try again.';

      if (message.includes('Email already registered')) {
        setError('email', { type: 'manual', message });
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="flex justify-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-150"
          aria-label="Pretty Nails Home"
        >
          <StudioMark size="lg" />
        </Link>
      </div>

      <Card className="border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-card rounded-xl">
        <CardHeader className="p-6 sm:p-8 pb-0 space-y-1 text-center">
          <CardTitle className="text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            Create your account
          </CardTitle>
          <CardDescription className="text-sm text-stone-500 dark:text-stone-400 font-normal">
            Join Pretty Nails to manage your appointments and loyalty rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Maria Santos"
              autoComplete="name"
              {...register('name')}
              error={errors.name?.message}
              disabled={isSubmitting}
            />

            <Input
              label="Email address"
              type="email"
              placeholder="maria@example.com"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />

            <Input
              label="Phone number"
              type="tel"
              placeholder="+63 9XX XXX XXXX"
              autoComplete="tel"
              helperText="Optional"
              {...register('phone')}
              error={errors.phone?.message}
              disabled={isSubmitting}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                {...register('password')}
                error={errors.password?.message}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-2.5 top-[26px] h-7 w-7 inline-flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-primary"
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
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-2.5 top-[26px] h-7 w-7 inline-flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-primary"
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

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Create account
            </Button>

            <p className="text-center text-sm text-stone-500 dark:text-stone-400 font-normal pt-2">
              Already have an account?{' '}
              <Link
                href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-primary hover:text-primary/90 underline-offset-4 hover:underline font-medium transition-colors duration-150"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-stone-400 dark:text-stone-500 font-normal leading-relaxed">
        By creating an account, you agree to our{' '}
        <Link
          href="#"
          className="underline underline-offset-4 hover:text-stone-600 dark:hover:text-stone-300 transition-colors duration-150"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href="#"
          className="underline underline-offset-4 hover:text-stone-600 dark:hover:text-stone-300 transition-colors duration-150"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
