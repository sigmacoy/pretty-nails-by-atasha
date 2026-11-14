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
  ShieldCheck,
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
      title: 'Appointments queue',
      description: 'Review and verify manual deposits',
      icon: Clock,
    },
    {
      href: '/admin/services',
      title: 'Treatment catalog',
      description: 'BIAB overlays, soft gels, and tiers',
      icon: Scissors,
    },
    {
      href: '/admin/customers',
      title: 'Client directory',
      description: 'Client records, notes, and visit history',
      icon: Users,
    },
    {
      href: '/admin/reports',
      title: 'Revenue & analytics',
      description: 'Tabular earnings and treatment volume',
      icon: BarChart2,
    },
  ];

  return (
    <div className="space-y-8 -m-4 sm:-m-6 lg:-m-8 p-6 sm:p-8 lg:p-10 min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950 transition-colors">
      {/* Standard Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Atelier Command Hub
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Real-time studio oversight across private 1-on-1 bookings, manual deposit reviews, service catalog rates, and loyalty cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-white/80 dark:bg-[#1A0E15]/80 text-xs font-medium text-rose-900 dark:text-rose-200 shadow-xs">
            Private Atelier Active
          </span>
          <Link
            href="/admin/bookings"
            className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] transition-all inline-flex items-center gap-2"
          >
            <Calendar className="h-4 w-4 stroke-[1.5]" />
            <span>Manage Queue</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards in a row */}
      <DashboardStats stats={stats} reports={reports} isLoading={isLoading} />

      {/* Middle Grid: Revenue Visualization + Atelier Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 sm:p-7 shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
            <RevenueChart
              data={dailyRevenueData}
              isLoading={isLoading}
              title="Revenue this week"
              description="Daily salon earnings across current week in tabular figures"
              action={
                <Link
                  href="/admin/reports"
                  className="h-9 px-4 rounded-full border border-rose-200/80 dark:border-rose-800/60 text-stone-800 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 text-xs font-medium transition-colors inline-flex items-center"
                >
                  Full report
                </Link>
              }
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 sm:p-7 shadow-[0_4px_24px_rgba(26,14,21,0.04)] h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-rose-200/60 dark:border-rose-950/50 mb-4">
                <h3 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50 tracking-tight">
                  Atelier Actions
                </h3>
                <span className="text-[11px] uppercase tracking-[0.16em] text-rose-800/80 dark:text-rose-300/80 font-semibold">
                  Shortcuts
                </span>
              </div>

              <div className="space-y-2.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-950/50 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-stone-900 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 group-hover:bg-rose-900 group-hover:text-white transition-colors flex-shrink-0">
                          <Icon className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 dark:text-rose-100 group-hover:text-rose-900 dark:group-hover:text-rose-200 transition-colors truncate">
                            {action.title}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-rose-200/60 dark:border-rose-950/50 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
              <span>Admin studio panel</span>
              <span className="flex items-center gap-1.5 text-stone-600 dark:text-rose-300 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-800 dark:text-rose-400 stroke-[1.5]" />
                Hospital-grade autoclave sterilization verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Queue */}
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 sm:p-8 shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
        <RecentBookings
          bookings={recentBookings?.content || null}
          isLoading={isLoading}
          totalElements={recentBookings?.totalElements || 0}
        />
      </div>
    </div>
  );
}
