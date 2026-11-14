'use client';

import { DollarSign, Calendar, Users, Award, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
import { AdminStatsDto, AdminReportsDto } from '@/types';

export interface DashboardStatsProps {
  stats: AdminStatsDto | null;
  isLoading: boolean;
  reports?: AdminReportsDto | null;
}

interface StatItem {
  id: string;
  label: string;
  value: string;
  meta: string;
  icon: LucideIcon;
}

export function DashboardStats({ stats, isLoading, reports }: DashboardStatsProps) {
  const statCards: StatItem[] = [
    {
      id: 'revenue',
      label: 'Monthly revenue',
      value: stats ? formatPrice(stats.totalRevenue) : '₱0.00',
      meta: 'All-time atelier revenue recorded',
      icon: DollarSign,
    },
    {
      id: 'appointments',
      label: "Today's queue",
      value: stats ? stats.pendingBookings.toString() : '0',
      meta: stats ? `${stats.completedThisMonth} completed this month` : '0 completed this month',
      icon: Calendar,
    },
    {
      id: 'clients',
      label: 'Atelier clients',
      value: stats ? stats.totalCustomers.toLocaleString() : '0',
      meta: stats ? `${stats.totalBookings} total bookings recorded` : '0 bookings recorded',
      icon: Users,
    },
    {
      id: 'stamps',
      label: 'Stamps issued',
      value: reports?.loyaltyStats?.issued != null
        ? reports.loyaltyStats.issued.toLocaleString()
        : stats ? stats.loyaltyActive.toLocaleString() : '0',
      meta: stats ? `${stats.loyaltyActive} active loyalty cards` : '0 active loyalty cards',
      icon: Award,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {statCards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-5 sm:p-6 shadow-[0_4px_24px_rgba(26,14,21,0.04)] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.18em] text-rose-800/80 dark:text-rose-300/80 font-semibold truncate">
                {card.label}
              </span>
              <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
                <Icon className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-3">
              {isLoading ? (
                <Skeleton variant="text" width={110} height={32} className="my-0.5" />
              ) : (
                <p className="text-3xl font-serif tracking-tight text-stone-900 dark:text-rose-50 tabular-nums leading-none">
                  {card.value}
                </p>
              )}
            </div>

            <div className="mt-3 text-xs text-stone-500 dark:text-stone-400 font-sans truncate">
              {isLoading ? (
                <Skeleton variant="text" width={130} height={14} />
              ) : (
                <span>{card.meta}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
