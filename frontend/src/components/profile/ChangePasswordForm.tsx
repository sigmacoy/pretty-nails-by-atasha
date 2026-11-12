'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { authApi } from '@/lib/api';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations';
import { toast } from 'sonner';

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to change password. Please try again.';

      if (message.includes('Current password is incorrect')) {
        toast.error('Current password is incorrect');
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-stone-500 dark:text-stone-400 shrink-0" strokeWidth={1.5} />
          <span>Change password</span>
        </CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Current password"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-0 top-[22px] h-9 px-3 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-stone-700 dark:focus-visible:text-stone-200"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10"
              {...register('newPassword')}
              error={errors.newPassword?.message}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-0 top-[22px] h-9 px-3 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-stone-700 dark:focus-visible:text-stone-200"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? (
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
              placeholder="••••••••"
              className="pr-10"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-0 top-[22px] h-9 px-3 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-stone-700 dark:focus-visible:text-stone-200"
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

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
