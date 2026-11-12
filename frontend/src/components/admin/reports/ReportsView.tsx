'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { AdminReportsDto } from '@/types';
import {
  DollarSign,
  Users,
  Calendar,
  Download,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Award,
  Sparkles,
} from 'lucide-react';

export type ReportPeriod = 'today' | 'this-week' | 'this-month' | 'last-month' | 'this-year';

export interface ReportsViewProps {
  reports: AdminReportsDto | null;
  isLoading: boolean;
  period: string;
  onPeriodChange?: (period: ReportPeriod) => void;
  onRefresh?: () => void;
}

const PERIOD_OPTIONS: { value: ReportPeriod; label: string; periodPhrase: string }[] = [
  { value: 'today', label: 'Today', periodPhrase: 'today' },
  { value: 'this-week', label: 'This week', periodPhrase: 'this week' },
  { value: 'this-month', label: 'This month', periodPhrase: 'this month' },
  { value: 'last-month', label: 'Last month', periodPhrase: 'last month' },
  { value: 'this-year', label: 'This year', periodPhrase: 'this year' },
];

// Quiet stone steps for secondary series (single leading accent for rank 0)
const SECONDARY_STONE_STEPS = [
  '#78716c', // stone-500
  '#a8a29e', // stone-400
  '#c7c2be', // stone-350
  '#d6d3d1', // stone-300
  '#e7e5e4', // stone-200
];

export function ReportsView({
  reports,
  isLoading,
  period,
  onPeriodChange,
  onRefresh,
}: ReportsViewProps) {
  const [metricView, setMetricView] = useState<'bookings' | 'revenue'>('bookings');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activePeriodMeta = useMemo(() => {
    return (
      PERIOD_OPTIONS.find((p) => p.value === period) ?? {
        value: period as ReportPeriod,
        label: period,
        periodPhrase: period,
      }
    );
  }, [period]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  const handleExportCsv = () => {
    if (!reports) return;

    const periodLabel = activePeriodMeta.label;
    const nowStr = new Date().toISOString().slice(0, 10);
    const redemptionRate =
      reports.loyaltyStats.issued > 0
        ? Math.round((reports.loyaltyStats.redeemed / reports.loyaltyStats.issued) * 100)
        : 0;

    const rows: (string | number)[][] = [
      ['Pretty Nails by Atasha - Business Report', ''],
      ['Period', periodLabel],
      ['Generated date', nowStr],
      [''],
      ['Summary KPI', 'Value'],
      ['Period earnings (PHP)', (reports.revenue / 100).toFixed(2)],
      ['Total bookings', reports.bookingsCount],
      ['Stamps issued', reports.loyaltyStats.issued],
      ['Rewards redeemed', reports.loyaltyStats.redeemed],
      ['Redemption rate (%)', `${redemptionRate}%`],
      ['Active stamp balance', reports.loyaltyStats.issued - reports.loyaltyStats.redeemed],
      [''],
      ['Top Services Breakdown', 'Bookings', 'Est. Revenue (PHP)', 'Share of Volume'],
    ];

    reports.topServices.forEach((s) => {
      const share =
        reports.bookingsCount > 0 ? ((s.count / reports.bookingsCount) * 100).toFixed(1) : '0.0';
      const estRev =
        reports.bookingsCount > 0
          ? ((s.count / reports.bookingsCount) * (reports.revenue / 100)).toFixed(2)
          : '0.00';
      rows.push([s.serviceName, s.count, estRev, `${share}%`]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pretty-nails-report-${period}-${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mapped chart data with calculated volume and estimated revenue
  const chartData = useMemo(() => {
    if (!reports || !reports.topServices.length) return [];
    const totalBookings = reports.bookingsCount || 1;
    return reports.topServices.map((service, index) => {
      const estimatedRev = Math.round((service.count / totalBookings) * reports.revenue);
      return {
        name: service.serviceName,
        shortName:
          service.serviceName.length > 16
            ? `${service.serviceName.slice(0, 14)}…`
            : service.serviceName,
        bookings: service.count,
        revenue: estimatedRev,
        share: Number(((service.count / totalBookings) * 100).toFixed(1)),
        isLeading: index === 0,
      };
    });
  }, [reports]);

  // Derived loyalty metrics
  const loyaltyMetrics = useMemo(() => {
    if (!reports) {
      return { issued: 0, redeemed: 0, active: 0, redemptionRate: 0, avgPerBooking: 0 };
    }
    const { issued, redeemed } = reports.loyaltyStats;
    const active = Math.max(0, issued - redeemed);
    const redemptionRate = issued > 0 ? Math.round((redeemed / issued) * 100) : 0;
    const avgPerBooking =
      reports.bookingsCount > 0 ? Math.round(reports.revenue / reports.bookingsCount) : 0;
    return { issued, redeemed, active, redemptionRate, avgPerBooking };
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Reports & analytics
            </h1>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-primary/70" />
            <span className="hidden sm:inline-block text-xs font-mono text-stone-500 dark:text-stone-400 tabular-nums">
              {activePeriodMeta.label.toLowerCase()}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 font-normal">
            Performance overview and business metrics for {activePeriodMeta.periodPhrase}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Segmented Period Selector */}
          {onPeriodChange ? (
            <div
              role="tablist"
              aria-label="Report period selection"
              className="inline-flex items-center p-1 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-card"
            >
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = period === opt.value;
                return (
                  <button
                    key={opt.value}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => onPeriodChange(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] select-none whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200/60 dark:border-stone-700/60'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 border border-transparent'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-60" strokeWidth={1.5} />
              {activePeriodMeta.label}
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                aria-label="Refresh report data"
                className="h-8 px-2.5 text-xs font-normal"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
                  strokeWidth={1.5}
                />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isLoading || !reports}
              className="h-8 px-3 text-xs gap-1.5 font-normal"
            >
              <Download className="w-3.5 h-3.5 opacity-70" strokeWidth={1.5} />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue / Monthly earnings */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Period earnings
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={110} className="h-7 mt-1" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                  {reports ? formatPrice(reports.revenue) : '—'}
                </p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center text-stone-600 dark:text-stone-400 shrink-0">
              <DollarSign className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-3 font-normal">
            Gross booking revenue
          </p>
        </Card>

        {/* Card 2: Total Bookings / Customer count */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Customer count
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={80} className="h-7 mt-1" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                  {reports ? reports.bookingsCount.toLocaleString() : '—'}
                </p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center text-stone-600 dark:text-stone-400 shrink-0">
              <Users className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-3 font-normal">
            Completed appointments
          </p>
        </Card>

        {/* Card 3: Top Service */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 pr-2">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Top service
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={120} className="h-7 mt-1" />
              ) : (
                <p className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                  {reports?.topServices[0]?.serviceName || 'No records'}
                </p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center text-stone-600 dark:text-stone-400 shrink-0">
              <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-3 font-normal">
            {reports?.topServices[0] ? (
              <span className="tabular-nums">
                {reports.topServices[0].count} bookings this period
              </span>
            ) : (
              'Most requested treatment'
            )}
          </p>
        </Card>

        {/* Card 4: Loyalty Program Activity */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Loyalty activity
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={90} className="h-7 mt-1" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                  {reports ? `${loyaltyMetrics.issued} / ${loyaltyMetrics.redeemed}` : '—'}
                </p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center text-stone-600 dark:text-stone-400 shrink-0">
              <Award className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-3 font-normal">
            {reports ? (
              <span className="tabular-nums">
                {loyaltyMetrics.redemptionRate}% redemption rate
              </span>
            ) : (
              'Stamps issued / redeemed'
            )}
          </p>
        </Card>
      </div>

      {/* Main Revenue Chart: Quiet Recharts Data Series */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <div>
            <CardTitle>Revenue overview</CardTitle>
            <CardDescription>
              Service booking distribution and estimated treatment earnings for {activePeriodMeta.periodPhrase}
            </CardDescription>
          </div>

          {/* Metric Toggle */}
          <div
            role="group"
            aria-label="Chart metric toggle"
            className="inline-flex items-center p-1 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setMetricView('bookings')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                metricView === 'bookings'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200/60 dark:border-stone-700/60'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-transparent'
              }`}
            >
              Bookings volume
            </button>
            <button
              type="button"
              onClick={() => setMetricView('revenue')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                metricView === 'revenue'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200/60 dark:border-stone-700/60'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-transparent'
              }`}
            >
              Estimated revenue
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          {isLoading ? (
            <div className="h-72 w-full flex flex-col justify-end gap-2 pb-6">
              <Skeleton variant="rectangular" className="h-full w-full rounded-lg" />
            </div>
          ) : !reports || chartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 rounded-lg border border-dashed border-stone-200 dark:border-stone-800">
              <BarChart3 className="w-8 h-8 text-stone-400 dark:text-stone-600 mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                No booking data available
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                There are no completed or active appointments recorded for {activePeriodMeta.periodPhrase}.
              </p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 4, bottom: 20 }}
                >
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="shortName"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.6 }}
                    interval={0}
                    dy={8}
                  />
                  <YAxis
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) =>
                      metricView === 'revenue' ? `₱${(val / 100).toLocaleString()}` : `${val}`
                    }
                    width={metricView === 'revenue' ? 68 : 36}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as typeof chartData[0];
                      return (
                        <div className="rounded-lg border border-stone-200/90 dark:border-stone-800/90 bg-card/95 backdrop-blur-sm p-3 shadow-float text-xs space-y-1.5 min-w-[180px]">
                          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                            {data.name}
                          </p>
                          <div className="flex items-center justify-between gap-4 text-stone-500 dark:text-stone-400">
                            <span>Bookings</span>
                            <span className="font-mono font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                              {data.bookings}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-stone-500 dark:text-stone-400">
                            <span>Est. revenue</span>
                            <span className="font-mono font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                              {formatPrice(data.revenue)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-stone-500 dark:text-stone-400 border-t border-stone-200/60 dark:border-stone-800/60 pt-1.5">
                            <span>Volume share</span>
                            <span className="font-mono text-primary font-medium tabular-nums">
                              {data.share}%
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey={metricView}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  >
                    {chartData.map((entry, index) => {
                      // Lead item gets single lacquer rose accent; secondary items sit in quiet stone steps
                      const fillColor =
                        index === 0
                          ? 'hsl(var(--primary))'
                          : SECONDARY_STONE_STEPS[Math.min(index - 1, SECONDARY_STONE_STEPS.length - 1)];
                      return <Cell key={`cell-${entry.name}-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart Sub-legend */}
          {reports && chartData.length > 0 && (
            <div className="flex flex-wrap items-center justify-between border-t border-stone-200/60 dark:border-stone-800/60 pt-3 mt-2 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
                  <span>#1 leading service</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-stone-400 dark:bg-stone-600 inline-block" />
                  <span>Secondary treatments</span>
                </div>
              </div>
              <p className="font-mono text-[11px] tabular-nums mt-1 sm:mt-0">
                {reports.bookingsCount} total appointments · {formatPrice(reports.revenue)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Column Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top Services Detailed Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top services</CardTitle>
                <CardDescription>
                  Ranked treatment frequency and appointment contribution
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs tabular-nums">
                {reports?.topServices.length || 0} services
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rectangular" className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : !reports || reports.topServices.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500 dark:text-stone-400">
                No booking records found for this period
              </div>
            ) : (
              <div className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
                {reports.topServices.map((service, index) => {
                  const share =
                    reports.bookingsCount > 0
                      ? ((service.count / reports.bookingsCount) * 100).toFixed(1)
                      : '0.0';
                  const estRev =
                    reports.bookingsCount > 0
                      ? Math.round((service.count / reports.bookingsCount) * reports.revenue)
                      : 0;
                  const isTopRank = index === 0;

                  return (
                    <div
                      key={service.serviceName}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-2 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`font-mono text-xs font-semibold w-5 text-right tabular-nums ${
                              isTopRank ? 'text-primary' : 'text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                            {service.serviceName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                            {formatPrice(estRev)}
                          </span>
                          <Badge
                            variant={isTopRank ? 'default' : 'secondary'}
                            className="font-mono text-xs tabular-nums"
                          >
                            {service.count} {service.count === 1 ? 'booking' : 'bookings'}
                          </Badge>
                        </div>
                      </div>

                      {/* Visual proportion hairline bar */}
                      <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isTopRank
                              ? 'bg-primary'
                              : 'bg-stone-300 dark:bg-stone-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, Number(share)))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Loyalty Program Statistics & Ratio */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Loyalty performance</CardTitle>
                <CardDescription>
                  Stamp card circulation, rewards, and retention health
                </CardDescription>
              </div>
              <Sparkles className="w-4 h-4 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" className="h-20 rounded-lg" />
                  ))}
                </div>
                <Skeleton variant="rectangular" className="h-16 rounded-lg" />
              </div>
            ) : !reports ? (
              <div className="py-12 text-center text-xs text-stone-500 dark:text-stone-400">
                No loyalty data available
              </div>
            ) : (
              <>
                {/* 3 Metric Tiles */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-center">
                    <p className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                      {loyaltyMetrics.issued.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Stamps issued
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-center">
                    <p className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                      {loyaltyMetrics.redeemed.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Redeemed
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-center">
                    <p className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                      {loyaltyMetrics.active.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Active balance
                    </p>
                  </div>
                </div>

                {/* Redemption Rate Progress */}
                <div className="p-4 rounded-lg bg-stone-50/70 dark:bg-stone-900/30 border border-stone-200/60 dark:border-stone-800/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      Redemption rate
                    </span>
                    <span className="font-mono font-semibold text-primary tabular-nums">
                      {loyaltyMetrics.redemptionRate}%
                    </span>
                  </div>

                  <div className="h-2 w-full bg-stone-200/70 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, loyaltyMetrics.redemptionRate)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                    {loyaltyMetrics.redeemed} client rewards claimed out of{' '}
                    {loyaltyMetrics.issued} total stamps issued this period.
                  </p>
                </div>

                {/* Additional Period Comparison Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-lg border border-stone-200/60 dark:border-stone-800/60">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Average per booking
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
                      {formatPrice(loyaltyMetrics.avgPerBooking)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-stone-200/60 dark:border-stone-800/60">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Bookings per service
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
                      {reports.topServices.length > 0
                        ? (reports.bookingsCount / reports.topServices.length).toFixed(1)
                        : '0.0'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
