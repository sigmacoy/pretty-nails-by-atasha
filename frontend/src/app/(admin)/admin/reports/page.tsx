'use client';

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { ReportsView, ReportPeriod } from '@/components/admin/reports/ReportsView';

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('this-month');

  const { data: reportsData, isLoading, refetch } = useQuery(
    () => adminApi.getReports(period),
    { enabled: true }
  );

  return (
    <ReportsView
      reports={reportsData?.data ?? null}
      isLoading={isLoading}
      period={period}
      onPeriodChange={setPeriod}
      onRefresh={refetch}
    />
  );
}
