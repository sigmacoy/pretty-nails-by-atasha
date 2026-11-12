'use client';

import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { formatDateShort, formatTime, formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils';
import { BookingDto } from '@/types';
import { ChevronRight } from 'lucide-react';

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
        <div>
          <p className="font-medium">{row.services[0]?.service?.name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">{row.userId}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row: BookingDto) => formatDateShort(row.appointmentDate),
    },
    {
      key: 'time',
      header: 'Time',
      render: (row: BookingDto) => formatTime(row.startTime),
    },
    {
      key: 'services',
      header: 'Services',
      render: (row: BookingDto) => (
        <div className="flex flex-wrap gap-1">
          {row.services.map((s, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {s.service.name} ({s.variantId || 'Standard'})
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: BookingDto) => (
        <Badge className={getStatusColor(row.status)}>
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: BookingDto) => formatPrice(row.totalPrice),
    },
  ];

  const renderRowActions = (row: BookingDto) => (
    <Link href={`/admin/bookings/${row.id}`} className="text-primary hover:underline text-sm flex items-center gap-1">
      View
      <ChevronRight className="h-3 w-3" />
    </Link>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Bookings</h3>
        <Link href="/admin/bookings" className="text-primary hover:underline text-sm flex items-center gap-1">
          View All ({totalElements})
          <ChevronRight className="h-3 w-3" />
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