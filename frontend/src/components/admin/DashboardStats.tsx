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
      meta: 'All-time salon revenue',
      icon: DollarSign,
    },
    {
      id: 'appointments',
      label: "Today's appointments",
      value: stats ? stats.pendingBookings.toString() : '0',
      meta: stats ? `${stats.completedThisMonth} completed this month` : '0 completed this month',
      icon: Calendar,
    },
    {
      id: 'clients',
      label: 'Active clients',
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-5 shadow-card transition-colors duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <div className="w-8 h-8 rounded-lg bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200/40 dark:border-stone-700/40 flex items-center justify-center text-muted-foreground">
                <Icon className="h-4 w-4 stroke-[1.5] text-muted-foreground" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-2.5">
              {isLoading ? (
                <Skeleton variant="text" width={110} height={28} className="my-0.5" />
              ) : (
                <p className="text-[28px] font-medium tracking-tight text-foreground tabular-nums leading-none">
                  {card.value}
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              {isLoading ? (
                <Skeleton variant="text" width={130} height={14} />
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600 flex-shrink-0" />
                  <span className="truncate">{card.meta}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
