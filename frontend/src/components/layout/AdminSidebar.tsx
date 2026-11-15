'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scissors, Image, Calendar, Settings, Users, BarChart2, Award, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudioMark } from './Header';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: Clock },
  { name: 'Services', href: '/admin/services', icon: Scissors },
  { name: 'Gallery', href: '/admin/gallery', icon: Image },
  { name: 'Loyalty', href: '/admin/loyalty', icon: Award },
  { name: 'Availability', href: '/admin/availability', icon: Calendar },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Reports', href: '/admin/reports', icon: BarChart2 },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-stone-50 dark:bg-[#0F0F10] border-r border-stone-200/80 dark:border-stone-800/80 flex flex-col">
      <div className="flex h-16 items-center px-5 border-b border-stone-200/80 dark:border-stone-800/80">
        <Link href="/admin" className="flex items-center gap-2.5 group" onClick={onClose}>
          <StudioMark size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-sm tracking-tight text-stone-900 dark:text-stone-100 leading-tight group-hover:text-primary transition-colors">
              Pretty Nails
            </span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
              Studio admin
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label="Admin navigation">
        {navigation.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 h-9 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-stone-200/70 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-200'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('h-4 w-4 stroke-[1.5] shrink-0', isActive ? 'text-primary' : 'text-stone-500 dark:text-stone-400')} aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
