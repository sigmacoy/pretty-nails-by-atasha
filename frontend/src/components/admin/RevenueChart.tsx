'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';

interface RevenueChartProps {
  data: { date: string; revenue: number }[] | null;
  isLoading: boolean;
  title?: string;
}

export function RevenueChart({ data, isLoading, title = 'Revenue Overview' }: RevenueChartProps) {
  const chartData = data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Skeleton variant="rectangular" className="h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No revenue data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max revenue for domain
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 0);
  const tickFormatter = (value: number) => formatPrice(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                type="number"
                tickFormatter={tickFormatter}
                tickCount={5}
                domain={[0, maxRevenue * 1.2 || 'auto']}
              />
              <YAxis
                type="category"
                dataKey="date"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Revenue']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}