'use client';

import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { formatDateShort, formatTime, formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils';
import { BookingDto } from '@/types';

interface RecentBookingsProps {
  bookings: BookingDto[] | null;
  isLoading: boolean;
  totalElements: number;
}

export function RecentBookings({ bookings, isLoading, totalElements }: RecentBookingsProps) {
  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row: BookingDto) => (
        <div className="py-0.5">
          <p className="font-medium text-xs text-stone-900 dark:text-rose-100">
            {row.services[0]?.service?.name || 'Atelier Treatment'}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums mt-0.5">
            Client #{row.userId.slice(-6)}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row: BookingDto) => (
        <span className="text-xs text-stone-700 dark:text-stone-300 tabular-nums">
          {formatDateShort(row.appointmentDate)}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (row: BookingDto) => (
        <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums font-mono">
          {formatTime(row.startTime)}
        </span>
      ),
    },
    {
      key: 'services',
      header: 'Services',
      render: (row: BookingDto) => (
        <div className="flex flex-wrap gap-1 py-0.5">
          {row.services.map((s, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[11px] py-0 px-2 font-normal rounded-full bg-white/70 dark:bg-stone-900/60 border-rose-200/70 dark:border-rose-900/60 text-stone-800 dark:text-rose-200"
            >
              {s.service?.name || s.serviceId} ({s.variantId || 'Standard'})
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: BookingDto) => (
        <Badge className={`${getStatusColor(row.status)} rounded-full text-[11px] font-medium py-0.5 px-2.5`}>
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: BookingDto) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-stone-900 dark:text-rose-100">
          {formatPrice(row.totalPrice)}
        </span>
      ),
    },
  ];

  const renderRowActions = (row: BookingDto) => (
    <Link
      href={`/admin/bookings`}
      className="h-8 px-3 rounded-full text-xs font-medium border border-rose-200/80 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 transition-colors inline-flex items-center justify-center"
    >
      Review
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/70 dark:border-rose-950/60">
        <div>
          <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
            Recent Appointments Queue
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Active reservations requiring manual deposit audit or appointment check-in.
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="h-9 px-4 rounded-full border border-rose-200/80 dark:border-rose-800/60 text-stone-800 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 text-xs font-medium transition-colors inline-flex items-center justify-center self-start sm:self-auto"
        >
          View queue ({totalElements})
        </Link>
      </div>
      <Table
        columns={columns}
        data={bookings || []}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No recent bookings"
        renderRowActions={renderRowActions}
        striped
        hoverable
      />
    </div>
  );
}
