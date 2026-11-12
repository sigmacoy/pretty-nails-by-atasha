'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, bookingsApi } from '@/lib/api';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { RecentBookings } from '@/components/admin/RecentBookings';
import { AdminStatsDto, AdminReportsDto, AdminBookingPage } from '@/types';
import {
  Calendar,
  Clock,
  Scissors,
  Users,
  BarChart2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [reports, setReports] = useState<AdminReportsDto | null>(null);
  const [recentBookings, setRecentBookings] = useState<AdminBookingPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, reportsRes, bookingsRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getReports('this-month'),
          bookingsApi.getAdminBookings({ page: 0, limit: 5, sort: 'desc' }),
        ]);

        setStats(statsRes.data);
        setReports(reportsRes.data);
        setRecentBookings(bookingsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Daily revenue data for current week (in centavos)
  const dailyRevenueData = [
    { date: 'Mon', revenue: 120000 },
    { date: 'Tue', revenue: 150000 },
    { date: 'Wed', revenue: 98000 },
    { date: 'Thu', revenue: 175000 },
    { date: 'Fri', revenue: 210000 },
    { date: 'Sat', revenue: 280000 },
    { date: 'Sun', revenue: 190000, isCurrentPeriod: true },
  ];

  const quickActions = [
    {
      href: '/admin/bookings',
      title: 'Manage queue',
      description: 'Review and confirm appointments',
      icon: Clock,
    },
    {
      href: '/admin/services',
      title: 'Service catalog',
      description: 'Update prices, durations, and tiers',
      icon: Scissors,
    },
    {
      href: '/admin/customers',
      title: 'Client directory',
      description: 'View customer history and notes',
      icon: Users,
    },
    {
      href: '/admin/reports',
      title: 'Revenue & analytics',
      description: 'Performance insights and trends',
      icon: BarChart2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
              Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm border border-stone-200/80 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-800/40 text-[11px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Live overview
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your salon&apos;s appointments, revenue, and client activity
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-200/80 dark:border-stone-800/80 bg-card text-xs font-medium text-foreground hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors shadow-card"
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            View schedule
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards in a row */}
      <DashboardStats stats={stats} reports={reports} isLoading={isLoading} />

      {/* Middle Grid: Wide Revenue Chart (2 cols) + Quick Actions (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart
            data={dailyRevenueData}
            isLoading={isLoading}
            title="Revenue this week"
            description="Daily salon earnings across current week"
            action={
              <Link
                href="/admin/reports"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                Full report
                <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-foreground transition-colors" />
              </Link>
            }
          />
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 shadow-card h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-base font-medium text-foreground tracking-tight">
                  Quick actions
                </h3>
                <span className="text-xs font-mono text-muted-foreground">Shortcuts</span>
              </div>

              <div className="space-y-2.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="p-3 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30 hover:bg-stone-100/70 dark:hover:bg-stone-800/50 transition-colors duration-150 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-card border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                          <Icon className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {action.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-foreground transition-colors flex-shrink-0 ml-2" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>Admin studio panel</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Queue */}
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 shadow-card">
        <RecentBookings
          bookings={recentBookings?.content || null}
          isLoading={isLoading}
          totalElements={recentBookings?.totalElements || 0}
        />
      </div>
    </div>
  );
}
