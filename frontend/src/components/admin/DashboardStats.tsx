'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, ShoppingBag, DollarSign, Clock, CheckCircle, Award } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { AdminStatsDto } from '@/types';

interface DashboardStatsProps {
  stats: AdminStatsDto | null;
  isLoading: boolean;
}

const statCards = [
  {
    key: 'totalCustomers',
    label: 'Total Customers',
    icon: Users,
    color: 'bg-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    format: 'number' as const,
  },
  {
    key: 'totalBookings',
    label: 'Total Bookings',
    icon: ShoppingBag,
    color: 'bg-purple-500',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    format: 'number' as const,
  },
  {
    key: 'totalRevenue',
    label: 'Total Revenue',
    icon: DollarSign,
    color: 'bg-green-500',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    format: 'price' as const,
  },
  {
    key: 'pendingBookings',
    label: 'Pending Bookings',
    icon: Clock,
    color: 'bg-yellow-500',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    format: 'number' as const,
  },
  {
    key: 'completedThisMonth',
    label: 'Completed This Month',
    icon: CheckCircle,
    color: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    format: 'number' as const,
  },
  {
    key: 'loyaltyActive',
    label: 'Active Loyalty Cards',
    icon: Award,
    color: 'bg-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    format: 'number' as const,
  },
] as const;

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {statCards.map((card) => {
        const value = stats ? stats[card.key as keyof AdminStatsDto] : 0;
        const Icon = card.icon;

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={card.iconBg + ' p-2 rounded-lg'}>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton variant="text" width={card.format === 'price' ? 80 : 60} />
                ) : card.format === 'price' ? (
                  formatPrice(value as number)
                ) : (
                  (value as number).toLocaleString()
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}