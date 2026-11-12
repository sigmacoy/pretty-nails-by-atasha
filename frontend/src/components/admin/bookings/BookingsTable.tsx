'use client';

import { useMemo } from 'react';
import { Table, Pagination, Column } from '@/components/ui/Table';
import { StatusAction } from './StatusAction';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  formatPrice,
  formatDateShort,
  formatTime,
  getInitials,
  getStatusColor,
  getStatusLabel,
  cn,
} from '@/lib/utils';
import { BookingDto, BookingStatus, CustomerListDto } from '@/types';
import { BookingDetailsData } from './types';
import { Eye, Image as ImageIcon, Sparkles, CreditCard, Clock, QrCode } from 'lucide-react';

interface BookingsTableProps {
  bookings: BookingDto[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
  onViewDetails?: (booking: BookingDto) => void;
  onShowCompletionQR?: (bookingId: string) => void;
  customerMap?: Record<string, CustomerListDto>;
}

export function BookingsTable({
  bookings,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onStatusChange,
  onViewDetails,
  onShowCompletionQR,
  customerMap = {},
}: BookingsTableProps) {
  // Render customer column
  const renderCustomer = (row: BookingDto) => {
    const extRow = row as BookingDetailsData;
    const customer = customerMap[row.userId];
    const customerName =
      customer?.name ||
      extRow.customerName ||
      extRow.user?.name ||
      `Customer #${row.userId.slice(-6)}`;
    const customerEmail =
      customer?.email ||
      extRow.customerEmail ||
      extRow.user?.email ||
      row.userId;

    return (
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onViewDetails?.(row)}
      >
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
          {getInitials(customerName)}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {customerName}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {customerEmail}
          </p>
        </div>
      </div>
    );
  };

  // Render Date & Time column
  const renderDate = (row: BookingDto) => (
    <div className="cursor-pointer" onClick={() => onViewDetails?.(row)}>
      <p className="font-medium text-foreground">{formatDateShort(row.appointmentDate)}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3 inline text-muted-foreground/70" />
        {formatTime(row.startTime)} - {formatTime(row.endTime)}
      </p>
    </div>
  );

  // Render Services column with variant and inspiration indicator
  const renderServices = (row: BookingDto) => {
    const extRow = row as BookingDetailsData;
    const hasInspiration = Boolean(extRow.inspirationImg || extRow.inspirationImage);

    if (!row.services || row.services.length === 0) {
      return <span className="text-xs text-muted-foreground">No services</span>;
    }

    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-1 items-center">
          {row.services.map((service, index) => (
            <Badge
              key={service.id || index}
              variant="outline"
              className="text-[11px] py-0 px-1.5 font-normal bg-card"
            >
              {service.service?.name || service.serviceId}
              {service.variantId && ` (${service.variantId})`}
              {service.quantity > 1 && ` ×${service.quantity}`}
            </Badge>
          ))}
          {hasInspiration && (
            <Badge
              variant="secondary"
              className="text-[10px] py-0 px-1.5 gap-1 bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200"
              title="Customer attached an inspiration photo"
            >
              <Sparkles className="h-3 w-3" />
              Photo
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Render Price column
  const renderPrice = (row: BookingDto) => {
    const extRow = row as BookingDetailsData;
    const payment = extRow.payment;
    const paymentStatus = payment?.status || (extRow.paymentReference ? 'PENDING' : null);

    return (
      <div className="text-right cursor-pointer" onClick={() => onViewDetails?.(row)}>
        <p className="font-semibold text-foreground">{formatPrice(row.totalPrice)}</p>
        <p className="text-[11px] text-muted-foreground">
          DP: {formatPrice(row.downpayment || 10000)}
        </p>
      </div>
    );
  };

  // Render Status Badge column
  const renderStatus = (row: BookingDto) => (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium py-0.5 px-2 select-none', getStatusColor(row.status))}
    >
      {getStatusLabel(row.status)}
    </Badge>
  );

  // Render Actions column
  const renderActions = (row: BookingDto) => (
    <div className="flex items-center justify-end gap-1.5">
      {row.status === 'COMPLETED' && onShowCompletionQR && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShowCompletionQR(row.id)}
          className="h-8 px-2 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
          title="Show customer completion QR code for loyalty stamp"
        >
          <QrCode className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">QR Stamp</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetails?.(row)}
        className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
        title="View complete booking details"
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Details</span>
      </Button>

      <StatusAction
        bookingId={row.id}
        currentStatus={row.status}
        onStatusChange={onStatusChange}
      />
    </div>
  );

  const columns: Column<BookingDto>[] = [
    {
      key: 'customer',
      header: 'Customer',
      render: renderCustomer,
      className: 'min-w-[190px]',
    },
    {
      key: 'date',
      header: 'Date & Time',
      render: renderDate,
      className: 'min-w-[160px]',
    },
    {
      key: 'services',
      header: 'Services',
      render: renderServices,
      className: 'min-w-[200px]',
    },
    {
      key: 'price',
      header: 'Total Price',
      render: renderPrice,
      className: 'min-w-[110px] text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'status',
      header: 'Status',
      render: renderStatus,
      className: 'min-w-[120px]',
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        columns={columns}
        data={bookings}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No bookings found matching current filters"
        renderRowActions={renderActions}
        striped
        hoverable
      />
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
export default BookingsTable;
