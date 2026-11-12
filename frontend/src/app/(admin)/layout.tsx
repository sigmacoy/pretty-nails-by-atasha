'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layout';

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50/50 dark:bg-[#0F0F10]">
        <div className="h-5 w-5 rounded-full border-2 border-stone-300 dark:border-stone-700 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50/50 dark:bg-[#0F0F10]">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Access denied</p>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
