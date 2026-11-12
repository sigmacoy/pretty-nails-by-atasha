'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { AdminReportsDto } from '@/types';
import { DollarSign, ShoppingBag, Trophy, Heart, TrendingUp } from 'lucide-react';

interface ReportsViewProps {
  reports: AdminReportsDto | null;
  isLoading: boolean;
  period: string;
}

const PERIOD_LABELS: Record<string, string> = {
  'today': 'Today',
  'this-week': 'This Week',
  'this-month': 'This Month',
  'this-year': 'This Year',
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(142, 76%, 36%)',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(346, 87%, 43%)',
  'hsl(199, 89%, 48%)',
];

export function ReportsView({ reports, isLoading, period }: ReportsViewProps) {
  const periodLabel = PERIOD_LABELS[period] || period;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Analytics and insights for {periodLabel.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stat</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton variant="text" width={80} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Skeleton variant="rectangular" className="h-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Skeleton variant="rectangular" className="h-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Analytics and insights for {periodLabel.toLowerCase()}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No reports data available for this period.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { revenue, bookingsCount, topServices, loyaltyStats } = reports;

  const topServicesData = topServices.map((service, index) => ({
    name: service.serviceName,
    value: service.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const { issued, redeemed } = loyaltyStats;
  const activeCards = issued - redeemed;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for {periodLabel.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            {periodLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {periodLabel} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <div className="bg-purple/10 dark:bg-purple/20 p-2 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-purple-500" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {periodLabel} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loyalty Cards Issued</CardTitle>
            <div className="bg-orange/10 dark:bg-orange/20 p-2 rounded-lg">
              <Heart className="h-4 w-4 text-orange-500" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issued.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {periodLabel} cards issued
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stamps Redeemed</CardTitle>
            <div className="bg-emerald/10 dark:bg-emerald/20 p-2 rounded-lg">
              <Trophy className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redeemed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {periodLabel} rewards redeemed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No service data available for this period</p>
              </div>
            ) : (
              <>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topServicesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {topServicesData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value.toLocaleString(), 'Bookings']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {topServices.map((service, index) => (
                    <div
                      key={service.serviceName}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{service.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {service.count} bookings
                        </Badge>
                        <span className="text-muted-foreground">
                          {bookingsCount > 0 ? ((service.count / bookingsCount) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-3">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                  <div className="text-3xl font-bold text-orange-500">{issued.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Issued</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                  <div className="text-3xl font-bold text-emerald-500">{redeemed.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Redeemed</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                  <div className="text-3xl font-bold text-primary">{activeCards.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Active Cards</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Redemption Rate</span>
                  <span className="text-sm font-semibold text-primary">
                    {issued > 0 ? ((redeemed / issued) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: issued > 0 ? `${(redeemed / issued) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {redeemed} out of {issued} cards have been redeemed for free services
                </p>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Avg. Revenue per Booking</div>
                  <div className="text-2xl font-bold mt-1">
                    {bookingsCount > 0 ? formatPrice(Math.round(revenue / bookingsCount)) : formatPrice(0)}
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Avg. Bookings per Service</div>
                  <div className="text-2xl font-bold mt-1">
                    {topServices.length > 0
                      ? (bookingsCount / topServices.length).toFixed(1)
                      : '0'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend ({periodLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">
                Daily revenue breakdown would be displayed here with period-specific data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
