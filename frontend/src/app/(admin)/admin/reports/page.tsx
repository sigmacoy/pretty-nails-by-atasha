'use client';

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { AdminReportsDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, ShoppingBag, Heart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-year', label: 'This Year' },
] as const;

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<'today' | 'this-week' | 'this-month' | 'last-month' | 'this-year'>('this-month');

  const { data: reportsData, isLoading, refetch } = useQuery(
    () => adminApi.getReports(period),
    { enabled: true }
  );

  const reports = reportsData?.data;

  return (
    <div className="container-padding section-padding">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">View business performance and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={reports ? formatPrice(reports.revenue) : '—'}
          icon={DollarSign}
          iconColor="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
          loading={isLoading}
        />
        <StatCard
          title="Total Bookings"
          value={reports ? reports.bookingsCount.toLocaleString() : '—'}
          icon={ShoppingBag}
          iconColor="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          loading={isLoading}
        />
        <StatCard
          title="Top Service"
          value={reports?.topServices[0]?.serviceName || '—'}
          icon={Heart}
          iconColor="text-pink-600"
          bgColor="bg-pink-50 dark:bg-pink-900/20"
          loading={isLoading}
        />
        <StatCard
          title="Loyalty Stats"
          value={reports ? `${reports.loyaltyStats.issued} issued / ${reports.loyaltyStats.redeemed} redeemed` : '—'}
          icon={Calendar}
          iconColor="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
          loading={isLoading}
        />
      </div>

      {/* Revenue Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reports.topServices.map((s, i) => ({ name: s.serviceName, value: s.count, revenue: s.count * 1000 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value} bookings`, 'Bookings']}
                  labelFormatter={(name: string) => name}
                />
                <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Services Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Services</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table
              columns={[
                { key: 'serviceName', header: 'Service' },
                { key: 'count', header: 'Bookings' },
              ]}
              data={[] as { serviceName: string; count: number }[]}
              keyExtractor={(row) => row.serviceName}
              isLoading={true}
            />
          ) : reports?.topServices.length ? (
            <Table
              columns={[
                { key: 'serviceName', header: 'Service' },
                { key: 'count', header: 'Bookings', render: (row: { serviceName: string; count: number }) => row.count },
              ]}
              data={reports.topServices}
              keyExtractor={(row) => row.serviceName}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No booking data for this period</p>
          )}
        </CardContent>
      </Card>

      {/* Loyalty Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Program Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="text" className="h-8" />
              ))}
            </div>
          ) : reports ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary">{reports.loyaltyStats.issued}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stamps Issued</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{reports.loyaltyStats.redeemed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rewards Redeemed</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {reports.loyaltyStats.issued > 0 ? Math.round((reports.loyaltyStats.redeemed / reports.loyaltyStats.issued) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Redemption Rate</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-600">{reports.loyaltyStats.issued - reports.loyaltyStats.redeemed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Stamps</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No loyalty data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  loading: boolean;
}

function StatCard({ title, value, icon: Icon, iconColor, bgColor, loading }: StatCardProps) {
  return (
    <Card className={bgColor}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            {loading ? (
              <Skeleton variant="text" width="60%" className="mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bgColor.replace('bg-', 'bg-').replace('/20', '/30')} ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}