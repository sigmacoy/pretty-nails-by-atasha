'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Scissors, Image, Heart, Calendar, Settings, Users, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin/admin', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/admin/bookings', icon: ShoppingBag },
  { name: 'Services', href: '/admin/admin/services', icon: Scissors },
  { name: 'Gallery', href: '/admin/admin/gallery', icon: Image },
  { name: 'Loyalty', href: '/admin/admin/loyalty', icon: Heart },
  { name: 'Availability', href: '/admin/admin/availability', icon: Calendar },
  { name: 'Settings', href: '/admin/admin/settings', icon: Settings },
  { name: 'Customers', href: '/admin/admin/customers', icon: Users },
  { name: 'Reports', href: '/admin/admin/reports', icon: BarChart2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/admin/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-gray-100">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label="Admin navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}