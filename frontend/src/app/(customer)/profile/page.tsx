'use client';

import { useEffect, useState } from 'react';
import { Mail, Shield, Calendar, User, Phone, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ProfileForm } from '@/components/customer/ProfileForm';
import { ChangePasswordForm } from '@/components/customer/ChangePasswordForm';
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
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-rose-800 dark:text-rose-300" strokeWidth={1.5} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-10 text-center shadow-card backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-950/60">
            <User className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-serif text-stone-900 dark:text-rose-50 font-normal">
            Unable to Load Profile
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans">
            Please refresh the page or sign in again to view your record.
          </p>
        </div>
      </div>
    );
  }

  const isStaff = userData.role === 'ADMIN';
  const roleLabel = isStaff ? 'Studio Administrator' : 'Atelier Client';
  const roleBadgeClass = isStaff
    ? 'bg-rose-100 text-rose-900 border border-rose-300/80 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800/60'
    : 'bg-rose-50 text-rose-900 border border-rose-200/80 dark:bg-stone-800 dark:text-rose-200 dark:border-rose-900/50';

  return (
    <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors selection:bg-rose-200 selection:text-rose-950">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Page Header */}
        <div>
          <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold mb-2 block">
            Client Atelier Sanctuary · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-900 dark:text-rose-50 font-normal tracking-tight">
            Client Profile Record
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl font-sans leading-relaxed">
            Manage your personal record sheet, contact details, and private atelier reservation credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Member Record Sheet */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-rose-200/80 dark:border-rose-950/60 p-6 sm:p-7 shadow-card backdrop-blur-sm">
              <div className="flex items-center gap-4 pb-5 border-b border-rose-200/70 dark:border-rose-950/60">
                <div className="relative shrink-0">
                  <div className="p-1 rounded-full ring-1 ring-rose-200 dark:ring-rose-900 bg-rose-50 dark:bg-stone-900">
                    <Avatar
                      name={userData.name}
                      size="xl"
                      src={userData.image}
                      alt={userData.name}
                      className="ring-2 ring-rose-900/20 dark:ring-rose-400/20"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-serif text-stone-900 dark:text-rose-50 font-normal truncate">
                    {userData.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate mb-2 font-sans">
                    {userData.email}
                  </p>
                  <span className={cn('inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium font-sans', roleBadgeClass)}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Account Details Stack */}
              <div className="mt-5 space-y-3 font-sans">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50 shrink-0 text-rose-800 dark:text-rose-300">
                    <Mail className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Email address</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50 shrink-0 text-rose-800 dark:text-rose-300">
                    <Phone className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Phone number</p>
                    <p className={cn('text-sm tabular-nums', userData.phone ? 'font-medium text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500 font-normal')}>
                      {userData.phone || 'Not recorded'}
                    </p>
                  </div>
                </div>

                {userData.nickname && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50 shrink-0 text-rose-800 dark:text-rose-300">
                      <Shield className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Preferred name</p>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{userData.nickname}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50 shrink-0 text-rose-800 dark:text-rose-300">
                    <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">Member since</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 tabular-nums">{formatDate(userData.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile and Password Forms */}
          <div className="lg:col-span-7 space-y-8">
            <ProfileForm />
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
