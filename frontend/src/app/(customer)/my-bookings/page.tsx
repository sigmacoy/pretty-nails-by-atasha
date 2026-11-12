'use client';

import { useState } from 'react';
import { Calendar, Archive, RotateCcw, X, ArrowRight, AlertCircle } from 'lucide-react';
import { useQuery } from '@/hooks/useApi';
import { bookingsApi } from '@/lib/api';
import { BookingStatus } from '@/types';
import { BookingCard, BookingSkeleton } from '@/components/customer/BookingCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isPast } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_FILTERS: { value: 'all' | BookingStatus; label: string }[] = [
  { value: 'all', label: 'All bookings' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

export default function MyBookingsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | BookingStatus>('all');
  const [showPast, setShowPast] = useState(false);

  const { data: bookingsData, isLoading, error, refetch } = useQuery(
    () => bookingsApi.getUserBookings(),
    { enabled: true }
  );

  const bookings = bookingsData?.data || [];

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = activeFilter === 'all' || booking.status === activeFilter;
    const isPastBooking = isPast(booking.appointmentDate);
    const matchesTimeFilter = showPast || !isPastBooking;
    return matchesFilter && matchesTimeFilter;
  });

  const upcomingBookings = filteredBookings.filter((b) => !isPast(b.appointmentDate));
  const pastBookings = filteredBookings.filter((b) => isPast(b.appointmentDate));

  const handleCancel = async (bookingId: string) => {
    try {
      await bookingsApi.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto container-padding section-padding">
        <div className="mb-8 space-y-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-stone-200/70 dark:bg-stone-800 rounded-[8px] animate-pulse" />
            <div className="h-4 w-72 bg-stone-200/50 dark:bg-stone-800/60 rounded-[6px] animate-pulse" />
          </div>
          <div className="h-11 w-full bg-stone-100 dark:bg-stone-900 rounded-[12px] animate-pulse" />
        </div>
        <BookingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto container-padding section-padding">
        <Card className="rounded-[12px] border border-stone-200/80 dark:border-stone-800/80 bg-card p-10 sm:p-14 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500/80 mx-auto mb-3 stroke-[1.5]" />
          <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1.5">
            Unable to load bookings
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-sm mx-auto">
            We could not retrieve your appointments right now. Please refresh or try again shortly.
          </p>
          <Button
            variant="outline"
            size="md"
            onClick={() => window.location.reload()}
            className="rounded-[8px] gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5 stroke-[1.5]" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const hasActiveFilter = activeFilter !== 'all' || showPast;

  return (
    <div className="max-w-5xl mx-auto container-padding section-padding">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              My bookings
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl">
              Review your salon appointments, downpayment status, and past visits
            </p>
          </div>
        </div>

        {/* Filters: 36px height tabs with 4px gap rhythm */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-1.5 bg-stone-100/80 dark:bg-stone-900/60 rounded-[12px] border border-stone-200/80 dark:border-stone-800/80">
          <div
            className="flex items-center gap-1 overflow-x-auto max-w-full p-0.5"
            role="tablist"
            aria-label="Booking status filters"
          >
            {STATUS_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`h-9 px-3.5 rounded-[8px] text-xs sm:text-sm font-medium transition-colors duration-150 inline-flex items-center whitespace-nowrap ${
                    isActive
                      ? 'bg-card text-stone-900 dark:text-stone-100 shadow-xs border border-stone-200/90 dark:border-stone-700/80'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 px-1">
            <Button
              variant={showPast ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowPast(!showPast)}
              className="h-9 rounded-[8px] text-xs gap-1.5 font-medium"
            >
              <Archive className="h-3.5 w-3.5 stroke-[1.5]" />
              {showPast ? 'Hide past' : 'Show past'}
            </Button>

            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveFilter('all');
                  setShowPast(false);
                }}
                className="h-9 rounded-[8px] text-xs gap-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
              >
                <X className="h-3.5 w-3.5 stroke-[1.5]" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <section className="mb-10" aria-labelledby="upcoming-heading">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 stroke-[1.5] text-stone-500 dark:text-stone-400" />
            <h2 id="upcoming-heading" className="text-lg font-medium text-stone-900 dark:text-stone-100">
              Upcoming appointments
            </h2>
            <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded-[6px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60 ml-1">
              {upcomingBookings.length}
            </span>
          </div>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                onPaymentSubmitted={refetch}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Bookings */}
      {(pastBookings.length > 0 || showPast) && (
        <section className="mb-10" aria-labelledby="past-heading">
          <div className="flex items-center gap-2 mb-4">
            <Archive className="h-4 w-4 stroke-[1.5] text-stone-500 dark:text-stone-400" />
            <h2 id="past-heading" className="text-lg font-medium text-stone-900 dark:text-stone-100">
              Past appointments
            </h2>
            {pastBookings.length > 0 && (
              <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded-[6px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60 ml-1">
                {pastBookings.length}
              </span>
            )}
          </div>
          {pastBookings.length > 0 ? (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancel}
                  onPaymentSubmitted={refetch}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-[12px] border border-stone-200/80 dark:border-stone-800/80 bg-card">
              <CardContent className="p-8 sm:p-10 text-center">
                <Archive className="h-8 w-8 stroke-[1.5] text-stone-400 dark:text-stone-500 mx-auto mb-3" />
                <h3 className="text-base font-medium text-stone-900 dark:text-stone-100 mb-1">
                  No past bookings
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Your completed and cancelled appointments will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Empty State when zero total filtered bookings */}
      {filteredBookings.length === 0 && !isLoading && (
        <Card className="rounded-[12px] border border-stone-200/80 dark:border-stone-800/80 bg-card">
          <CardContent className="p-10 sm:p-14 text-center">
            <Calendar className="h-10 w-10 stroke-[1.5] text-stone-400 dark:text-stone-500 mx-auto mb-3" />
            <h2 className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 mb-1.5">
              No bookings found
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-sm mx-auto">
              {activeFilter !== 'all'
                ? `No ${activeFilter.toLowerCase().replace('_', ' ')} bookings found for this filter.`
                : 'You have not scheduled any appointments yet. Choose a service from our menu to book your session.'}
            </p>
            <Button
              size="md"
              className="rounded-[8px] gap-1.5"
              onClick={() => (window.location.href = '/services')}
            >
              Explore services
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
