'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  isCurrentPeriod?: boolean;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[] | null;
  isLoading: boolean;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: RevenueDataPoint;
  }>;
  label?: string;
}

function RevenueCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-md border border-stone-200/80 dark:border-stone-800/80 bg-card px-3 py-2 shadow-card text-xs">
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-1 font-mono tabular-nums text-sm font-medium text-primary">
          {formatPrice(data.value)}
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueChart({
  data,
  isLoading,
  title = 'Revenue this week',
  description = 'Daily salon earnings across current week',
  action,
}: RevenueChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = data || [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 shadow-card h-full flex flex-col justify-between">
        <div className="flex items-start justify-between pb-6">
          <div className="space-y-1">
            <Skeleton variant="text" width={140} height={20} />
            <Skeleton variant="text" width={220} height={14} />
          </div>
          {action && <Skeleton variant="rectangular" width={80} height={28} />}
        </div>
        <div className="h-64 flex items-center justify-center">
          <Skeleton variant="rectangular" className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 shadow-card h-full flex flex-col justify-between">
        <div className="flex items-start justify-between pb-6">
          <div>
            <h3 className="text-base font-medium text-foreground tracking-tight">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg text-center p-6">
          <p className="text-sm font-medium text-muted-foreground">No revenue data available</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            Data will populate as appointments are completed
          </p>
        </div>
      </div>
    );
  }

  // Calculate maximum for clean Y-axis domain
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 0);
  const yDomainMax = maxRevenue > 0 ? Math.ceil((maxRevenue * 1.15) / 50000) * 50000 : 300000;

  // Determine current period index (explicit flag or last item)
  const currentPeriodIndex = chartData.findIndex((d) => d.isCurrentPeriod) !== -1
    ? chartData.findIndex((d) => d.isCurrentPeriod)
    : chartData.length - 1;

  return (
    <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 shadow-card h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between pb-4">
        <div>
          <h3 className="text-base font-medium text-foreground tracking-tight">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="date"
                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.6 }}
                tickLine={false}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickCount={5}
                domain={[0, yDomainMax]}
                tickFormatter={(value: number) => `₱${Math.round(value / 100).toLocaleString()}`}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
                dx={-4}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                content={<RevenueCustomTooltip />}
              />
              <Bar
                dataKey="revenue"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              >
                {chartData.map((_, index) => {
                  const isCurrent = index === currentPeriodIndex;
                  return (
                    <Cell
                      key={`bar-cell-${index}`}
                      fill={isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.22)'}
                      className="transition-opacity duration-150 hover:opacity-85"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Skeleton variant="rectangular" className="w-full h-full" />
          </div>
        )}
      </div>

      {/* Legend & Meta */}
      <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-muted-foreground/25" />
            Previous days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-primary" />
            Current period
          </span>
        </div>
        <span className="tabular-nums">Peak: {formatPrice(maxRevenue)}</span>
      </div>
    </div>
  );
}
