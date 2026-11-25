'use client';

/**
 * Pretty Nails by Atasha · Cebu City
 * Admin Reports & Analytics (Editorial Newsreader font-serif styling)
 */

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { ReportsView, ReportPeriod } from '@/components/admin/reports/ReportsView';
import { useAdminErrors } from '@/components/admin/AdminErrorBanner';

export default function AdminReportsPage() {
  const { addError, clearErrors } = useAdminErrors();
  const [period, setPeriod] = useState<ReportPeriod>('this-month');

  const { data: reportsData, isLoading, refetch } = useQuery(
    () => adminApi.getReports(period),
    {
      enabled: true,
      onError: (err) => {
        addError(err.message || 'Failed to load reports. Please try again.');
      },
      onSuccess: () => {
        clearErrors();
      },
    }
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
