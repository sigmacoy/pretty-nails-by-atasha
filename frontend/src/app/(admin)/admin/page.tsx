'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { bookingsApi } from '@/lib/api';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { RecentBookings } from '@/components/admin/RecentBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminStatsDto, AdminReportsDto, AdminBookingPage, BookingDto } from '@/types';
import { ArrowRight, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

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

  // Sample daily revenue data for the chart (in centavos)
  const dailyRevenueData = [
    { date: 'Mon', revenue: 120000 },
    { date: 'Tue', revenue: 150000 },
    { date: 'Wed', revenue: 98000 },
    { date: 'Thu', revenue: 175000 },
    { date: 'Fri', revenue: 210000 },
    { date: 'Sat', revenue: 280000 },
    { date: 'Sun', revenue: 190000 },
  ];

  const statsLoading = isLoading;
  const bookingsLoading = isLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your salon&apos;s performance and recent activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            This month
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} isLoading={statsLoading} />

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue This Week</CardTitle>
          <Link
            href="/admin/reports"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View Report
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <RevenueChart data={dailyRevenueData} isLoading={false} />
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardContent className="p-6 pt-0">
          <RecentBookings
            bookings={recentBookings?.content || null}
            isLoading={bookingsLoading}
            totalElements={recentBookings?.totalElements || 0}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/bookings"
              className="p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <ShoppingBag className="h-6 w-6 text-primary mb-2" />
              <h4 className="font-medium">Manage Bookings</h4>
              <p className="text-sm text-muted-foreground mt-1">
                View and update appointments
              </p>
            </Link>
            <Link
              href="/admin/services"
              className="p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <h4 className="font-medium">Manage Services</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Add or edit nail services
              </p>
            </Link>
            <Link
              href="/admin/customers"
              className="p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <h4 className="font-medium">View Customers</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Manage customer profiles
              </p>
            </Link>
            <Link
              href="/admin/reports"
              className="p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <TrendingUp className="h-6 w-6 text-primary mb-2" />
              <h4 className="font-medium">View Reports</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Detailed analytics & insights
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}