'use client';

import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-stone-50/50 dark:bg-[#0F0F10]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
