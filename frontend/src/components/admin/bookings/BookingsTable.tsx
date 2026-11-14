'use client';

import { Table, Pagination, Column } from '@/components/ui/Table';
import { StatusAction } from './StatusAction';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  formatPrice,
  formatDateShort,
  formatTime,
  getInitials,
  cn,
} from '@/lib/utils';
import { BookingDto, BookingStatus, CustomerListDto } from '@/types';
import { BookingDetailsData } from './types';
import { Eye, Clock, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';

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

// Restrained status badge styles adhering to atelier design tokens
function getRestrainedStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
    case 'COMPLETED':
      return 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-850 dark:text-stone-300 dark:border-stone-700/60';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
    case 'NO_SHOW':
      return 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-850 dark:text-stone-400 dark:border-stone-800';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

function getSentenceStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No show';
    default:
      return status;
  }
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
  // 1. Render Queue Order column
  const renderQueueOrder = (_row: BookingDto, index: number) => {
    const queueNum = currentPage * 10 + index + 1;
    return (
      <div className="flex items-center gap-1.5 py-0.5">
        <span className="font-mono text-xs font-semibold text-rose-900 dark:text-rose-300 tabular-nums">
          #{queueNum.toString().padStart(2, '0')}
        </span>
      </div>
    );
  };

  // 2. Render Client Name column
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
        className="flex items-center gap-2.5 cursor-pointer group py-0.5"
        onClick={() => onViewDetails?.(row)}
      >
        <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-center font-medium text-xs shrink-0 group-hover:bg-rose-900 group-hover:text-white transition-colors">
          {getInitials(customerName)}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">
            {customerName}
          </p>
          <p className="text-[11px] text-muted-foreground truncate max-w-[170px] tabular-nums font-mono">
            {customerEmail}
          </p>
        </div>
      </div>
    );
  };

  // 3. Render Appointment Time column
  const renderDateTime = (row: BookingDto) => (
    <div className="cursor-pointer py-0.5" onClick={() => onViewDetails?.(row)}>
      <p className="text-xs font-medium text-foreground tabular-nums">
        {formatDateShort(row.appointmentDate)}
      </p>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1 tabular-nums mt-0.5 font-mono">
        <Clock className="h-3 w-3 stroke-[1.5] text-muted-foreground/70" />
        {formatTime(row.startTime)} – {formatTime(row.endTime)}
      </p>
    </div>
  );

  // 4. Render Service column
  const renderServices = (row: BookingDto) => {
    const extRow = row as BookingDetailsData;
    const hasInspiration = Boolean(extRow.inspirationImg || extRow.inspirationImage);

    if (!row.services || row.services.length === 0) {
      return <span className="text-xs text-muted-foreground">No services</span>;
    }

    return (
      <div className="space-y-1 py-0.5">
        <div className="flex flex-wrap gap-1.5 items-center">
          {row.services.map((service, index) => (
            <Badge
              key={service.id || index}
              variant="outline"
              className="text-[11px] py-0.5 px-2 font-normal rounded-full bg-white/80 dark:bg-stone-900/80 border-rose-200/70 dark:border-rose-900/60 text-stone-800 dark:text-rose-200"
            >
              {service.service?.name || service.serviceId}
              {service.variantId && ` (${service.variantId})`}
              {service.quantity > 1 && ` ×${service.quantity}`}
            </Badge>
          ))}
          {hasInspiration && (
            <Badge
              variant="outline"
              className="text-[10px] py-0.5 px-2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 font-medium"
              title="Customer attached an inspiration photo"
            >
              Client Inspo
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // 5. Render Deposit Proof column
  const renderDepositProof = (row: BookingDto) => {
    const extRow = row as BookingDetailsData;
    const payment = extRow.payment;
    const paymentStatus = payment?.status || (extRow.paymentReference ? 'PENDING' : 'UNPAID');
    const depositAmount = row.downpayment || payment?.amount || 10000;

    return (
      <div className="cursor-pointer py-0.5" onClick={() => onViewDetails?.(row)}>
        {paymentStatus === 'PAID' ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 tabular-nums font-mono">
            <CheckCircle2 className="h-3 w-3 stroke-[1.5] text-emerald-600 dark:text-emerald-400" />
            <span>Verified {formatPrice(depositAmount)}</span>
          </div>
        ) : paymentStatus === 'PENDING' || extRow.paymentReference ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 tabular-nums font-mono">
            <Clock className="h-3 w-3 stroke-[1.5] text-amber-600 dark:text-amber-400" />
            <span>Verify {formatPrice(depositAmount)}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200 dark:bg-stone-850 dark:text-stone-400 dark:border-stone-800 tabular-nums font-mono">
            <AlertCircle className="h-3 w-3 stroke-[1.5] text-stone-500" />
            <span>Unpaid ({formatPrice(depositAmount)})</span>
          </span>
        )}
      </div>
    );
  };

  // 6. Render Total Price column
  const renderPrice = (row: BookingDto) => {
    return (
      <div className="text-right cursor-pointer py-0.5" onClick={() => onViewDetails?.(row)}>
        <p className="text-xs font-semibold text-foreground tabular-nums font-mono">
          {formatPrice(row.totalPrice)}
        </p>
      </div>
    );
  };

  // 7. Render Status column
  const renderStatus = (row: BookingDto) => (
    <div className="py-0.5">
      <Badge
        variant="outline"
        className={cn(
          'text-[11px] font-medium py-0.5 px-2.5 rounded-full select-none border',
          getRestrainedStatusBadge(row.status)
        )}
      >
        {getSentenceStatusLabel(row.status)}
      </Badge>
    </div>
  );

  // 8. Render Actions column
  const renderActions = (row: BookingDto) => (
    <div className="flex items-center justify-end gap-1.5 py-0.5">
      {row.status === 'COMPLETED' && onShowCompletionQR && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShowCompletionQR(row.id)}
          className="h-9 px-3 text-xs gap-1.5 rounded-full border-rose-200/80 dark:border-rose-800/60 text-stone-800 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50"
          title="Show completion QR code for loyalty stamp"
        >
          <QrCode className="h-3.5 w-3.5 stroke-[1.5]" />
          <span className="hidden sm:inline">QR stamp</span>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewDetails?.(row)}
        className="h-9 px-3 text-xs gap-1.5 rounded-full border-rose-200/80 dark:border-rose-800/60 text-stone-800 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50"
        title="View booking details"
      >
        <Eye className="h-3.5 w-3.5 stroke-[1.5]" />
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
      key: 'queue',
      header: 'Queue order',
      render: renderQueueOrder,
      className: 'w-16 min-w-[64px]',
    },
    {
      key: 'customer',
      header: 'Client name',
      render: renderCustomer,
      className: 'min-w-[180px]',
    },
    {
      key: 'datetime',
      header: 'Appointment time',
      render: renderDateTime,
      className: 'min-w-[150px]',
    },
    {
      key: 'services',
      header: 'Service',
      render: renderServices,
      className: 'min-w-[200px]',
    },
    {
      key: 'deposit',
      header: 'Deposit proof',
      render: renderDepositProof,
      className: 'min-w-[140px]',
    },
    {
      key: 'price',
      header: 'Total price',
      render: renderPrice,
      className: 'min-w-[90px] text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'status',
      header: 'Status',
      render: renderStatus,
      className: 'min-w-[110px]',
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        columns={columns}
        data={bookings}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No bookings in queue matching current filters"
        renderRowActions={renderActions}
        striped
        hoverable
      />
      {totalPages > 1 && (
        <div className="px-4 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default BookingsTable;
