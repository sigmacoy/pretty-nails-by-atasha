'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingsTable, BookingFilters, BookingDetailsDrawer } from '@/components/admin/bookings';
import { CompletionQRModal } from '@/components/admin/CompletionQRModal';
import { bookingsApi, adminApi } from '@/lib/api';
import { useQuery } from '@/hooks/useApi';
import { AdminBookingPage, BookingStatus, BookingDto, CustomerListDto } from '@/types';
import { BookingDetailsData, QuickFilterTab } from '@/components/admin/bookings/types';
import { toast } from 'sonner';
import {
  Download,
  RefreshCw,
  AlertCircle,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZE = 10;

export default function AdminBookingsPage() {
  // Quick Filter Tab state
  const [activeTab, setActiveTab] = useState<QuickFilterTab>('ALL');

  // Detailed Filter states
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('appointmentDate,desc');
  const [currentPage, setCurrentPage] = useState(0);

  // Selected booking for Details Drawer
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailsData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Completion QR Code Modal state
  const [completionQRBookingId, setCompletionQRBookingId] = useState<string | null>(null);
  const [completionQRCustomerName, setCompletionQRCustomerName] = useState<string | undefined>(undefined);
  const [completionQRServiceSummary, setCompletionQRServiceSummary] = useState<string | undefined>(undefined);
  const [isCompletionQROpen, setIsCompletionQROpen] = useState(false);

  // Today's ISO date string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Build API params
  const params = useMemo(() => {
    return {
      search: search || undefined,
      start: startDate || undefined,
      end: endDate || undefined,
      status: statuses.length > 0 ? statuses.join(',') : undefined,
      sort: sortBy,
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
    };
  }, [search, startDate, endDate, statuses, sortBy, currentPage]);

  // Fetch bookings
  const { data, isLoading, isError, error, refetch } = useQuery(
    () => bookingsApi.getAdminBookings(params),
    {
      enabled: true,
    }
  );

  // Fetch customers to map user IDs to names, phones, and emails
  const { data: customersData } = useQuery(
    () => adminApi.getCustomers(),
    {
      enabled: true,
    }
  );

  // Customer Map
  const customerMap = useMemo(() => {
    const map: Record<string, CustomerListDto> = {};
    const customers = (customersData?.data as CustomerListDto[] | undefined) || [];
    if (Array.isArray(customers)) {
      customers.forEach((c) => {
        if (c?.id) {
          map[c.id] = c;
        }
      });
    }
    return map;
  }, [customersData]);

  // Support both paginated AdminBookingPage and flat List<BookingDto> from backend
  const { bookings, totalPages, totalCount, allRawBookings } = useMemo(() => {
    const raw = data?.data;

    // Flat array response
    if (Array.isArray(raw)) {
      const all: BookingDto[] = raw;
      const count = all.length;
      const pages = Math.ceil(count / DEFAULT_PAGE_SIZE) || 1;
      const startIdx = currentPage * DEFAULT_PAGE_SIZE;
      const paged = all.slice(startIdx, startIdx + DEFAULT_PAGE_SIZE);
      return {
        bookings: paged,
        totalPages: pages,
        totalCount: count,
        allRawBookings: all,
      };
    }

    // Paginated response
    const pageObj = raw as AdminBookingPage | undefined;
    const content = pageObj?.content ?? [];
    return {
      bookings: content,
      totalPages: pageObj?.totalPages ?? 1,
      totalCount: pageObj?.totalElements ?? content.length,
      allRawBookings: content,
    };
  }, [data, currentPage]);

  // Compute counts for Quick Filter tabs
  const tabCounts = useMemo(() => {
    const counts = {
      ALL: 0,
      TODAY: 0,
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
    };

    allRawBookings.forEach((b) => {
      counts.ALL += 1;
      if (b.appointmentDate && b.appointmentDate.startsWith(todayStr)) {
        counts.TODAY += 1;
      }
      if (b.status === 'PENDING') counts.PENDING += 1;
      if (b.status === 'CONFIRMED') counts.CONFIRMED += 1;
      if (b.status === 'COMPLETED') counts.COMPLETED += 1;
    });

    return counts;
  }, [allRawBookings, todayStr]);

  // Handle Quick Filter Tab Click
  const handleTabChange = (tab: QuickFilterTab) => {
    setActiveTab(tab);
    setCurrentPage(0);

    switch (tab) {
      case 'ALL':
        setStatuses([]);
        setStartDate('');
        setEndDate('');
        break;
      case 'TODAY':
        setStatuses([]);
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'PENDING':
        setStatuses(['PENDING']);
        setStartDate('');
        setEndDate('');
        break;
      case 'CONFIRMED':
        setStatuses(['CONFIRMED']);
        setStartDate('');
        setEndDate('');
        break;
      case 'COMPLETED':
        setStatuses(['COMPLETED']);
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  // Trigger Completion QR Code Modal
  const handleTriggerCompletionQR = useCallback(
    (bookingId: string) => {
      const target =
        allRawBookings.find((b) => b.id === bookingId) ||
        (selectedBooking?.id === bookingId ? selectedBooking : null);
      const cust = target ? customerMap[target.userId] : null;
      const cName =
        cust?.name ||
        (target as unknown as { customerName?: string })?.customerName ||
        `Customer #${target?.userId?.slice(-6) || ''}`;
      const sSummary = target?.services
        ?.map((s) => s.service?.name || s.serviceId)
        .join(', ');

      setCompletionQRBookingId(bookingId);
      setCompletionQRCustomerName(cName);
      setCompletionQRServiceSummary(sSummary);
      setIsCompletionQROpen(true);
    },
    [allRawBookings, selectedBooking, customerMap]
  );

  // Handle status update
  const handleStatusChange = useCallback(
    (bookingId: string, newStatus: BookingStatus) => {
      refetch();
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      // Automatically present Completion QR Code modal upon COMPLETED transition
      if (newStatus === 'COMPLETED') {
        handleTriggerCompletionQR(bookingId);
      }
    },
    [refetch, selectedBooking, handleTriggerCompletionQR]
  );

  // Open Drawer with selected booking
  const handleViewDetails = useCallback((booking: BookingDto) => {
    setSelectedBooking(booking as BookingDetailsData);
    setIsDrawerOpen(true);
  }, []);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setStatuses([]);
    setSortBy('appointmentDate,desc');
    setCurrentPage(0);
    setActiveTab('ALL');
  };

  const hasActiveFilters = Boolean(
    search || startDate || endDate || statuses.length > 0 || activeTab !== 'ALL'
  );

  // Export Bookings to CSV
  const handleExportCSV = () => {
    if (allRawBookings.length === 0) {
      toast.info('No bookings available to export');
      return;
    }

    const headers = ['ID', 'Customer', 'Date', 'Start Time', 'End Time', 'Status', 'Total Price', 'Downpayment'];
    const rows = allRawBookings.map((b) => {
      const customer = customerMap[b.userId]?.name || `Customer #${b.userId.slice(-6)}`;
      return [
        b.id,
        `"${customer}"`,
        b.appointmentDate,
        b.startTime,
        b.endTime,
        b.status,
        (b.totalPrice / 100).toFixed(2),
        ((b.downpayment || 10000) / 100).toFixed(2),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bookings_export_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Bookings exported to CSV');
  };

  if (isError) {
    return (
      <div className="space-y-8 -m-4 sm:-m-6 lg:-m-8 p-6 sm:p-8 lg:p-10 min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950">
        <div className="pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Appointments Queue
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            Review private appointment requests, verify manual GCash and Maya reservation deposits, and monitor atelier schedule status.
          </p>
        </div>
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="text-destructive max-w-md mx-auto">
              <AlertCircle className="h-9 w-9 mx-auto mb-2 text-destructive stroke-[1.5]" />
              <p className="font-semibold text-base text-foreground">Failed to load bookings</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {error?.message || 'Unable to retrieve booking records from server.'}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="h-10 px-5 rounded-full gap-2 text-xs">
                <RefreshCw className="h-4 w-4 stroke-[1.5]" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 -m-4 sm:-m-6 lg:-m-8 p-6 sm:p-8 lg:p-10 min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950 transition-colors pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Appointments Queue
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Review private appointment requests, verify manual GCash and Maya reservation deposits, and monitor atelier schedule status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-12 px-6 rounded-full border border-rose-300/80 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 bg-white/80 dark:bg-stone-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-medium gap-2"
            title="Refresh bookings data"
          >
            <RefreshCw className={cn('h-4 w-4 stroke-[1.5]', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-12 px-6 rounded-full border border-rose-300/80 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 bg-white/80 dark:bg-stone-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-medium gap-2"
          >
            <Download className="h-4 w-4 stroke-[1.5]" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Prominent Studio Policy Banner */}
      <div className="rounded-2xl border border-rose-300/80 dark:border-rose-900/70 bg-rose-100/60 dark:bg-rose-950/40 p-4 sm:p-5 flex items-start gap-3.5 shadow-[0_2px_12px_rgba(76,5,25,0.05)]">
        <ShieldCheck className="h-5 w-5 text-rose-800 dark:text-rose-300 shrink-0 mt-0.5 stroke-[1.5]" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-rose-950 dark:text-rose-100 uppercase tracking-wide">
            Studio Reservation Policy
          </p>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
            Manual Deposit Verification: All appointments require manual staff verification of GCash or Maya transfer references. Instant automatic confirmation is never claimed.
          </p>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-rose-200/70 dark:border-rose-950/60">
        {[
          { id: 'ALL' as QuickFilterTab, label: 'All bookings', count: tabCounts.ALL },
          { id: 'TODAY' as QuickFilterTab, label: 'Today', count: tabCounts.TODAY },
          { id: 'PENDING' as QuickFilterTab, label: 'Pending confirmation', count: tabCounts.PENDING },
          { id: 'CONFIRMED' as QuickFilterTab, label: 'Confirmed', count: tabCounts.CONFIRMED },
          { id: 'COMPLETED' as QuickFilterTab, label: 'Completed', count: tabCounts.COMPLETED },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 h-12 px-6 text-xs sm:text-sm font-medium rounded-full transition-colors shrink-0 select-none border',
                isActive
                  ? 'bg-rose-900 text-white border-rose-800 shadow-sm'
                  : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-rose-200 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed Filters Card */}
      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
        <CardHeader className="pb-3 pt-5 px-6 sm:px-8">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <Filter className="h-4 w-4 stroke-[1.5]" />
              Filter Atelier Appointments
            </CardTitle>
            {hasActiveFilters && (
              <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">Filters active</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-6 sm:px-8 pb-5">
          <BookingFilters
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setCurrentPage(0);
            }}
            startDate={startDate}
            onStartDateChange={(v) => {
              setStartDate(v);
              setCurrentPage(0);
            }}
            endDate={endDate}
            onEndDateChange={(v) => {
              setEndDate(v);
              setCurrentPage(0);
            }}
            statuses={statuses}
            onStatusesChange={(v) => {
              setStatuses(v);
              setCurrentPage(0);
            }}
            sortBy={sortBy}
            onSortByChange={(v) => {
              setSortBy(v);
              setCurrentPage(0);
            }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Bookings Queue Table Card */}
      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)] overflow-hidden">
        <CardHeader className="pb-4 pt-5 px-6 sm:px-8 border-b border-rose-200/70 dark:border-rose-950/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50 flex items-center gap-2">
              <span>Appointments Queue</span>
              <span className="text-xs font-mono font-normal text-stone-500 dark:text-stone-400 tabular-nums">
                ({totalCount} {totalCount === 1 ? 'record' : 'records'})
              </span>
            </CardTitle>
            <div className="text-xs font-mono text-stone-500 dark:text-stone-400 tabular-nums">
              Page {currentPage + 1} of {Math.max(1, totalPages)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BookingsTable
            bookings={bookings}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            onStatusChange={handleStatusChange}
            onViewDetails={handleViewDetails}
            onShowCompletionQR={handleTriggerCompletionQR}
            customerMap={customerMap}
          />
        </CardContent>
      </Card>

      {/* Booking Details Drawer */}
      <BookingDetailsDrawer
        booking={selectedBooking}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusUpdated={handleStatusChange}
        onTriggerCompletionQR={handleTriggerCompletionQR}
        customer={selectedBooking ? customerMap[selectedBooking.userId] : null}
      />

      {/* Completion QR Code Modal for In-Salon Loyalty Stamping */}
      <CompletionQRModal
        isOpen={isCompletionQROpen}
        onClose={() => setIsCompletionQROpen(false)}
        bookingId={completionQRBookingId}
        customerName={completionQRCustomerName}
        serviceSummary={completionQRServiceSummary}
      />
    </div>
  );
}
