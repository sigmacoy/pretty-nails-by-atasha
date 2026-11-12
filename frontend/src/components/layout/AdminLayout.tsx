'use client';

import { ReactNode } from 'react';
import { Layout } from './Layout';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}