'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api';
import { profileSchema, type ProfileInput } from '@/lib/validations';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      nickname: user?.nickname || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        nickname: user.nickname || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileInput) => {
    setIsSubmitting(true);
    try {
      await authApi.updateProfile({
        name: data.name,
        phone: data.phone,
        nickname: data.nickname,
      });
      toast.success('Client profile preferences updated in atelier records.');
      await refreshUser();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Unable to update profile details. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-rose-200/80 dark:border-rose-950/60 p-6 sm:p-8 shadow-card backdrop-blur-sm">
      <div className="mb-6 pb-5 border-b border-rose-200/70 dark:border-rose-950/60">
        <span className="text-[11px] uppercase tracking-[0.22em] text-rose-800 dark:text-rose-300 font-semibold block mb-1">
          Client Information
        </span>
        <h2 className="text-xl sm:text-2xl font-serif text-stone-900 dark:text-rose-50 font-normal">
          Profile Details
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans">
          Update your contact details and atelier record preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans">
        <Input
          label="Full name"
          placeholder="Maria Santos"
          {...register('name')}
          error={errors.name?.message}
          disabled={isSubmitting}
          className="rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
        />
        <Input
          label="Phone number"
          type="tel"
          placeholder="+63 9XX XXX XXXX"
          helperText="Used for appointment reminders and deposit verification"
          className="tabular-nums rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
          {...register('phone')}
          error={errors.phone?.message}
          disabled={isSubmitting}
        />
        <Input
          label="Preferred nickname (optional)"
          placeholder="Mia"
          {...register('nickname')}
          error={errors.nickname?.message}
          disabled={isSubmitting}
          className="rounded-xl border-rose-200/80 dark:border-rose-950/60 focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
        />

        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
          >
            {isSubmitting ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileForm;
