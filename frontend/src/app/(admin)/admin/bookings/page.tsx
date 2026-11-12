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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Bookings queue</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and view all salon appointments.</p>
          </div>
        </div>
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="py-12 text-center">
            <div className="text-destructive max-w-md mx-auto">
              <AlertCircle className="h-9 w-9 mx-auto mb-2 text-destructive stroke-[1.5]" />
              <p className="font-semibold text-base text-foreground">Failed to load bookings</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {error?.message || 'Unable to retrieve booking records from server.'}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="h-9 rounded-md gap-2 text-xs">
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Bookings queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor appointments, verify deposits, and manage salon queue order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 rounded-md gap-1.5 text-xs font-medium"
            title="Refresh bookings data"
          >
            <RefreshCw className={cn('h-4 w-4 stroke-[1.5]', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 rounded-md gap-1.5 text-xs font-medium"
          >
            <Download className="h-4 w-4 stroke-[1.5]" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
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
                'flex items-center gap-2 h-9 px-3.5 text-xs font-medium rounded-md transition-colors shrink-0 select-none border',
                isActive
                  ? 'bg-foreground text-background border-foreground dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-sm text-[10px] font-medium tabular-nums',
                  isActive
                    ? 'bg-background/20 text-background dark:bg-stone-900/20 dark:text-stone-900'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed Filters Card */}
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary stroke-[1.5]" />
              Advanced filters and search
            </CardTitle>
            {hasActiveFilters && (
              <span className="text-xs text-primary font-medium">Filters active</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6 pb-4">
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
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Appointments queue</span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                ({totalCount} {totalCount === 1 ? 'record' : 'records'})
              </span>
            </CardTitle>
            <div className="text-xs text-muted-foreground tabular-nums">
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
