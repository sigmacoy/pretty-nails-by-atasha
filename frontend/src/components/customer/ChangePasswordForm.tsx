'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
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
      toast.success('Studio account password updated successfully.');
      reset();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Unable to update password. Please check your credentials.';

      if (message.includes('Current password is incorrect') || message.includes('does not match studio records') || message.includes('does not match atelier records')) {
        toast.error('Current password does not match studio records.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-rose-200/80 dark:border-rose-950/60 p-6 sm:p-8 shadow-card backdrop-blur-sm">
      <div className="mb-6 pb-5 border-b border-rose-200/70 dark:border-rose-950/60">
        <h2 className="text-xl sm:text-2xl font-serif text-stone-900 dark:text-rose-50 font-normal">
          Account Security
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans">
          Update your password to safeguard your studio reservations and records.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans">
        <div className="relative">
          <Input
            label="Current password"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pr-10 rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
            {...register('currentPassword')}
            error={errors.currentPassword?.message}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-3 top-[32px] p-1 rounded-md text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
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
            className="pr-10 rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
            {...register('newPassword')}
            error={errors.newPassword?.message}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-3 top-[32px] p-1 rounded-md text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-150 focus-visible:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
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

        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
          >
            {isSubmitting ? 'Updating password...' : 'Update Account Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePasswordForm;
