'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
      toast.success('Profile updated successfully');
      await refreshUser();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4 text-stone-500 dark:text-stone-400 shrink-0" strokeWidth={1.5} />
          <span>Profile details</span>
        </CardTitle>
        <CardDescription>Update your personal information and contact details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            placeholder="Maria Santos"
            {...register('name')}
            error={errors.name?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Phone number (optional)"
            type="tel"
            placeholder="+63 9XX XXX XXXX"
            className="tabular-nums"
            {...register('phone')}
            error={errors.phone?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Nickname (optional)"
            placeholder="Mia"
            {...register('nickname')}
            error={errors.nickname?.message}
            disabled={isSubmitting}
          />

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
