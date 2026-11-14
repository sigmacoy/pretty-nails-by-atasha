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
import { formatPrice, cn } from '@/lib/utils';
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

const ROSE_PALETTE_STEPS = [
  '#881337', // rose-900 (lead item)
  '#9f1239', // rose-800
  '#be123c', // rose-700
  '#e11d48', // rose-600
  '#f43f5e', // rose-500
  '#fb7185', // rose-400
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
      ['Pretty Nails by Atasha - Atelier Business Report', ''],
      ['Period', periodLabel],
      ['Generated date', nowStr],
      [''],
      ['Revenue & Attendance Summary Table', 'Volume', 'Value (PHP)', 'Share of Revenue'],
      ['Gross Treatment Bookings', reports.bookingsCount, (reports.revenue / 100).toFixed(2), '100.0%'],
      ['Stamps issued', reports.loyaltyStats.issued, '—', '—'],
      ['Rewards redeemed', reports.loyaltyStats.redeemed, '—', `${redemptionRate}%`],
      ['Active stamp balance', reports.loyaltyStats.issued - reports.loyaltyStats.redeemed, '—', '—'],
      [''],
      ['Top Treatments Attendance Table', 'Rank', 'Appointment Count', 'Estimated Revenue (PHP)', 'Volume Share'],
    ];

    reports.topServices.forEach((s, idx) => {
      const share =
        reports.bookingsCount > 0 ? ((s.count / reports.bookingsCount) * 100).toFixed(1) : '0.0';
      const estRev =
        reports.bookingsCount > 0
          ? ((s.count / reports.bookingsCount) * (reports.revenue / 100)).toFixed(2)
          : '0.00';
      rows.push([s.serviceName, idx + 1, s.count, estRev, `${share}%`]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pretty-nails-atelier-report-${period}-${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mapped chart data
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
    <div className="space-y-8 bg-[#FFF0F3] dark:bg-[#160D12] text-foreground min-h-screen p-6 sm:p-8 lg:p-10 transition-colors selection:bg-rose-200 selection:text-rose-950">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Atelier Revenue & Attendance Reports
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Comprehensive earnings reports, service attendance breakdown, and loyalty program retention metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Period Selector */}
          {onPeriodChange ? (
            <div
              role="tablist"
              aria-label="Report period selection"
              className="inline-flex items-center p-1.5 rounded-full bg-white/90 dark:bg-stone-900/90 border border-rose-200/80 dark:border-rose-950/60 shadow-sm"
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
                    className={cn(
                      'px-4 py-2 text-xs font-medium rounded-full transition-all duration-150 select-none whitespace-nowrap',
                      isActive
                        ? 'bg-rose-900 text-white shadow-xs'
                        : 'text-stone-600 dark:text-rose-200 hover:text-stone-950 dark:hover:text-white'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-mono text-xs border border-rose-200/80 dark:border-rose-900/60">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-rose-700 dark:text-rose-400" strokeWidth={1.5} />
              {activePeriodMeta.label}
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                aria-label="Refresh report data"
                className="h-12 w-12 rounded-full border-rose-200/80 dark:border-rose-800/60 p-0 text-stone-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
                  strokeWidth={1.5}
                />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isLoading || !reports}
              className="h-12 px-6 rounded-full border border-rose-300/80 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-medium gap-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-rose-800 dark:text-rose-300" strokeWidth={1.5} />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Period Earnings */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
                Period earnings
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={110} className="h-8 mt-1" />
              ) : (
                <p className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-stone-900 dark:text-rose-50 tabular-nums">
                  {reports ? formatPrice(reports.revenue) : '—'}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
              <DollarSign className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 font-normal">
            Gross atelier booking revenue
          </p>
        </Card>

        {/* Card 2: Completed Appointments */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
                Client appointments
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={80} className="h-8 mt-1" />
              ) : (
                <p className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-stone-900 dark:text-rose-50 tabular-nums">
                  {reports ? reports.bookingsCount.toLocaleString() : '—'}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
              <Users className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 font-normal">
            Completed private 1-on-1 treatments
          </p>
        </Card>

        {/* Card 3: Top Discipline */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 pr-2">
              <p className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
                Lead discipline
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={120} className="h-8 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-rose-50 truncate">
                  {reports?.topServices[0]?.serviceName || 'No records'}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
              <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 font-normal">
            {reports?.topServices[0] ? (
              <span className="font-mono tabular-nums">
                {reports.topServices[0].count} bookings this period
              </span>
            ) : (
              'Most requested atelier treatment'
            )}
          </p>
        </Card>

        {/* Card 4: Loyalty Program Activity */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
                Loyalty circulation
              </p>
              {isLoading ? (
                <Skeleton variant="text" width={90} className="h-8 mt-1" />
              ) : (
                <p className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-stone-900 dark:text-rose-50 tabular-nums">
                  {reports ? `${loyaltyMetrics.issued} / ${loyaltyMetrics.redeemed}` : '—'}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
              <Award className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 font-normal">
            {reports ? (
              <span className="font-mono tabular-nums">
                {loyaltyMetrics.redemptionRate}% redemption conversion
              </span>
            ) : (
              'Stamps issued / redeemed'
            )}
          </p>
        </Card>
      </div>

      {/* Main Revenue Chart: Muted Rose/Burgundy Fills and Rose Hairline Axes */}
      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="font-serif text-xl text-stone-900 dark:text-rose-50">
              Treatment revenue distribution
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Service booking distribution and estimated treatment earnings for {activePeriodMeta.periodPhrase}
            </CardDescription>
          </div>

          {/* Metric Toggle */}
          <div
            role="group"
            aria-label="Chart metric toggle"
            className="inline-flex items-center p-1.5 rounded-full bg-rose-50/70 dark:bg-stone-900/60 border border-rose-200/80 dark:border-rose-900/60 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setMetricView('bookings')}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-150',
                metricView === 'bookings'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-stone-600 dark:text-rose-200 hover:text-stone-900'
              )}
            >
              Bookings volume
            </button>
            <button
              type="button"
              onClick={() => setMetricView('revenue')}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-150',
                metricView === 'revenue'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-stone-600 dark:text-rose-200 hover:text-stone-900'
              )}
            >
              Estimated revenue
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          {isLoading ? (
            <div className="h-72 w-full flex flex-col justify-end gap-2 pb-6">
              <Skeleton variant="rectangular" className="h-full w-full rounded-xl" />
            </div>
          ) : !reports || chartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/60">
              <BarChart3 className="w-8 h-8 text-rose-400 dark:text-rose-600 mb-2" strokeWidth={1.5} />
              <p className="text-sm font-serif font-medium text-stone-800 dark:text-rose-200">
                No booking records recorded
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
                    stroke="rgba(244, 114, 182, 0.2)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortName"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(244, 114, 182, 0.3)' }}
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
                      metricView === 'revenue' ? `PHP ${(val / 100).toLocaleString()}` : `${val}`
                    }
                    width={metricView === 'revenue' ? 84 : 40}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(244, 114, 182, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as typeof chartData[0];
                      return (
                        <div className="rounded-2xl border border-rose-200/90 dark:border-rose-950/90 bg-white/95 dark:bg-[#1A0E15]/95 backdrop-blur-sm p-4 shadow-lg text-xs space-y-2 min-w-[200px]">
                          <p className="font-serif font-medium text-stone-900 dark:text-rose-50 truncate text-sm">
                            {data.name}
                          </p>
                          <div className="flex items-center justify-between gap-4 text-stone-600 dark:text-stone-300">
                            <span>Bookings</span>
                            <span className="font-mono font-medium text-stone-900 dark:text-rose-50 tabular-nums">
                              {data.bookings}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-stone-600 dark:text-stone-300">
                            <span>Est. revenue</span>
                            <span className="font-mono font-medium text-stone-900 dark:text-rose-50 tabular-nums">
                              {formatPrice(data.revenue)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-stone-600 dark:text-stone-300 border-t border-rose-200/60 dark:border-rose-950/60 pt-2">
                            <span>Volume share</span>
                            <span className="font-mono text-rose-900 dark:text-rose-300 font-semibold tabular-nums">
                              {data.share}%
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey={metricView}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {chartData.map((entry, index) => {
                      const fillColor = ROSE_PALETTE_STEPS[Math.min(index, ROSE_PALETTE_STEPS.length - 1)];
                      return <Cell key={`cell-${entry.name}-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart Sub-legend */}
          {reports && chartData.length > 0 && (
            <div className="flex flex-wrap items-center justify-between border-t border-rose-200/60 dark:border-rose-950/60 pt-4 mt-2 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-900 inline-block" />
                  <span>Lead atelier treatment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                  <span>Secondary disciplines</span>
                </div>
              </div>
              <p className="font-mono text-[11px] tabular-nums mt-1 sm:mt-0">
                {reports.bookingsCount} total appointments · {formatPrice(reports.revenue)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabular Section 1: Revenue & Attendance Summary Table */}
      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 overflow-hidden bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="font-serif text-xl text-stone-900 dark:text-rose-50">
            Revenue & Attendance Summary Table
          </CardTitle>
          <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Aggregated period metrics, appointment attendance volume, and gross billing valuation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-y border-rose-200/80 dark:border-rose-950/60 bg-rose-50/70 dark:bg-[#20111A]/90 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                  <th className="py-3 px-5">Period Metric</th>
                  <th className="py-3 px-5 text-right">Total Volume</th>
                  <th className="py-3 px-5 text-right">Value PHP</th>
                  <th className="py-3 px-5 text-right">Share of Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200/60 dark:divide-rose-950/60">
                <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-stone-900 dark:text-rose-50">
                    Gross Treatment Bookings
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                    {reports?.bookingsCount ?? 0}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums font-semibold text-rose-950 dark:text-rose-100">
                    {reports ? formatPrice(reports.revenue) : '—'}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-rose-900 dark:text-rose-300">
                    100.0%
                  </td>
                </tr>
                <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-stone-900 dark:text-rose-50">
                    Average Value per Appointment
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                    1 treatment
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                    {reports ? formatPrice(loyaltyMetrics.avgPerBooking) : '—'}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-400">
                    —
                  </td>
                </tr>
                <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-stone-900 dark:text-rose-50">
                    Complimentary Reward Treatments Claimed
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                    {loyaltyMetrics.redeemed}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                    {formatPrice(loyaltyMetrics.redeemed * (loyaltyMetrics.avgPerBooking || 150000))}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-400">
                    —
                  </td>
                </tr>
                <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-stone-900 dark:text-rose-50">
                    Active Client Loyalty Stamps in Circulation
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                    {loyaltyMetrics.active} stamps
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                    —
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums text-stone-400">
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Breakdown Row: Top Treatments Attendance Table & Loyalty Health Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabular Section 2: Top Treatments Attendance Table */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 overflow-hidden bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-xl text-stone-900 dark:text-rose-50">
                  Top Treatments Attendance Table
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Ranked treatment frequency and appointment contribution
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs tabular-nums rounded-full px-3 py-1 border-rose-200/80 dark:border-rose-800/60">
                {reports?.topServices.length || 0} treatments
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rectangular" className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : !reports || reports.topServices.length === 0 ? (
              <div className="py-14 text-center text-xs text-stone-500 dark:text-stone-400">
                No treatment records found for this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-y border-rose-200/80 dark:border-rose-950/60 bg-rose-50/70 dark:bg-[#20111A]/90 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Treatment Name</th>
                      <th className="py-3 px-4 text-right">Appointment Count</th>
                      <th className="py-3 px-4 text-right">Estimated Revenue</th>
                      <th className="py-3 px-4 text-right">Volume Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-200/60 dark:divide-rose-950/60">
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
                        <tr
                          key={service.serviceName}
                          className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold tabular-nums text-xs text-rose-900 dark:text-rose-300">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-rose-50">
                            {service.serviceName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                            {service.count}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                            {formatPrice(estRev)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right tabular-nums font-semibold text-rose-900 dark:text-rose-300">
                            {share}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabular Section 3: Loyalty Circulation & Redemption Health Table */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 overflow-hidden bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="font-serif text-xl text-stone-900 dark:text-rose-50">
              Loyalty Circulation & Redemption Health Table
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Stamp card circulation, rewards claimed, and member retention benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-y border-rose-200/80 dark:border-rose-950/60 bg-rose-50/70 dark:bg-[#20111A]/90 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                    <th className="py-3 px-4">Program Metric</th>
                    <th className="py-3 px-4 text-right">Volume</th>
                    <th className="py-3 px-4 text-right">Rate</th>
                    <th className="py-3 px-4 text-right">Benchmark Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-200/60 dark:divide-rose-950/60">
                  <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-rose-50">
                      Total Stamps Issued
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                      {loyaltyMetrics.issued}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-600 dark:text-stone-400">
                      100.0%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-xs text-stone-700 dark:text-stone-300">
                      Active issuance
                    </td>
                  </tr>
                  <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-rose-50">
                      Free Treatments Redeemed
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                      {loyaltyMetrics.redeemed}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums font-semibold text-rose-900 dark:text-rose-300">
                      {loyaltyMetrics.redemptionRate}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-xs text-emerald-700 dark:text-emerald-400">
                      Reward healthy
                    </td>
                  </tr>
                  <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-rose-50">
                      Active Stamp Balance
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                      {loyaltyMetrics.active}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-600 dark:text-stone-400">
                      {loyaltyMetrics.issued > 0 ? (100 - loyaltyMetrics.redemptionRate).toFixed(0) : 0}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-xs text-stone-700 dark:text-stone-300">
                      In circulation
                    </td>
                  </tr>
                  <tr className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-rose-50">
                      Average Ticket Value
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-800 dark:text-stone-200">
                      {formatPrice(loyaltyMetrics.avgPerBooking)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-stone-400">
                      —
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-xs text-stone-700 dark:text-stone-300">
                      Private atelier standard
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
