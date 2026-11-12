'use client';

import { useEffect, useState } from 'react';
import { Mail, Shield, Calendar, User, Phone, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { UserDto } from '@/types';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await authApi.me();
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-5xl mx-auto container-padding section-padding flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-5xl mx-auto container-padding section-padding text-center py-16">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
          <User className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h2 className="text-base font-medium text-stone-900 dark:text-stone-100">
          Unable to load profile
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Please refresh the page or sign in again
        </p>
      </div>
    );
  }

  const isStaff = userData.role === 'ADMIN';
  const roleLabel = isStaff ? 'Administrator' : 'Customer';
  const roleBadgeClass = isStaff
    ? 'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/15 dark:text-primary-foreground'
    : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80';

  return (
    <div className="max-w-5xl mx-auto container-padding section-padding">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100 tracking-tight">
          Profile details
        </h1>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Manage your personal details, contact information, and account security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Account Summary / Avatar Card */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="p-1 rounded-full ring-1 ring-stone-200/80 dark:ring-stone-800/80 bg-stone-50 dark:bg-stone-900">
                    <Avatar
                      name={userData.name}
                      size="xl"
                      src={userData.image}
                      alt={userData.name}
                      className="ring-2 ring-primary/25"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg truncate">{userData.name}</CardTitle>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate mb-2">
                    {userData.email}
                  </p>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', roleBadgeClass)}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {/* Account Details Stack with 16px field gap rhythm */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 dark:bg-stone-800 shrink-0 text-stone-600 dark:text-stone-300">
                    <Mail className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Email address</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 dark:bg-stone-800 shrink-0 text-stone-600 dark:text-stone-300">
                    <Phone className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Phone number</p>
                    <p className={cn('text-sm tabular-nums', userData.phone ? 'font-medium text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500 font-normal')}>
                      {userData.phone || 'Not set'}
                    </p>
                  </div>
                </div>

                {userData.nickname && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 dark:bg-stone-800 shrink-0 text-stone-600 dark:text-stone-300">
                      <Shield className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Nickname</p>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{userData.nickname}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 dark:bg-stone-800 shrink-0 text-stone-600 dark:text-stone-300">
                    <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Member since</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 tabular-nums">{formatDate(userData.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile and Password Forms */}
        <div className="lg:col-span-7 space-y-6">
          <ProfileForm />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
