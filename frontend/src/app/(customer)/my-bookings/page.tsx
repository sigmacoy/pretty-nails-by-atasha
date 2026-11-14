'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Archive, RotateCcw, X, AlertCircle } from 'lucide-react';
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
  { value: 'PENDING', label: 'Pending Studio Review' },
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
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-3">
            <div className="h-4 w-44 bg-rose-200/60 dark:bg-rose-950/60 rounded-full animate-pulse" />
            <div className="h-9 w-64 bg-stone-200/70 dark:bg-stone-800 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-stone-200/50 dark:bg-stone-800/60 rounded-md animate-pulse" />
          </div>
          <div className="h-14 w-full bg-white/70 dark:bg-stone-900/60 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 animate-pulse" />
          <BookingSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-10 sm:p-14 text-center shadow-card backdrop-blur-sm">
            <AlertCircle className="h-10 w-10 text-rose-600 dark:text-rose-400 mx-auto mb-4 stroke-[1.5]" />
            <h2 className="text-xl sm:text-2xl font-serif text-stone-900 dark:text-rose-50 font-normal mb-2">
              Unable to Retrieve Appointments
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-6 max-w-sm mx-auto font-sans leading-relaxed">
              We could not load your appointment records right now. Please refresh the page or try again shortly.
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.location.reload()}
              className="rounded-full px-6 gap-2 border-rose-200/80 dark:border-rose-950/60"
            >
              <RotateCcw className="h-4 w-4 stroke-[1.5]" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilter = activeFilter !== 'all' || showPast;

  return (
    <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors selection:bg-rose-200 selection:text-rose-950">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Editorial Page Header */}
        <div>
          <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold mb-2 block">
            Private Atelier Sanctuary · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-900 dark:text-rose-50 font-normal tracking-tight">
            My Appointments
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl font-sans leading-relaxed">
            Review your scheduled private sessions, GCash and Maya deposit verification statuses, and past visits.
          </p>
        </div>

        {/* Filters Bar: 4px rhythm, clean pill styling */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-2 bg-white/85 dark:bg-stone-900/85 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 shadow-xs backdrop-blur-sm">
          <div
            className="flex items-center gap-1.5 overflow-x-auto max-w-full p-0.5 font-sans"
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
                  className={`h-9 px-4 rounded-full text-xs sm:text-sm font-medium transition-colors duration-150 inline-flex items-center whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-rose-50/70 dark:hover:bg-rose-950/30'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 px-1 font-sans">
            <button
              type="button"
              onClick={() => setShowPast(!showPast)}
              className={`h-9 px-4 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors border ${
                showPast
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 border-rose-300/80 dark:border-rose-800/80'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-rose-200/80 dark:border-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Archive className="h-3.5 w-3.5 stroke-[1.5]" />
              {showPast ? 'Hide Past Visits' : 'Show Past Visits'}
            </button>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setShowPast(false);
                }}
                className="h-9 px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                <X className="h-3.5 w-3.5 stroke-[1.5]" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Appointments Section */}
        {upcomingBookings.length > 0 && (
          <section aria-labelledby="upcoming-heading" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300" />
              <h2 id="upcoming-heading" className="text-xl sm:text-2xl font-serif text-stone-900 dark:text-rose-50 font-normal">
                Upcoming Appointments
              </h2>
              <span className="text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-rose-100/70 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-950/60 ml-1">
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

        {/* Past Appointments Section */}
        {(pastBookings.length > 0 || showPast) && (
          <section aria-labelledby="past-heading" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Archive className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300" />
              <h2 id="past-heading" className="text-xl sm:text-2xl font-serif text-stone-900 dark:text-rose-50 font-normal">
                Past Atelier Visits
              </h2>
              {pastBookings.length > 0 && (
                <span className="text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-rose-100/70 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-950/60 ml-1">
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
              <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 shadow-card">
                <CardContent className="p-8 sm:p-10 text-center font-sans">
                  <Archive className="h-8 w-8 stroke-[1.5] text-stone-400 dark:text-stone-500 mx-auto mb-3" />
                  <h3 className="text-base font-serif text-stone-900 dark:text-rose-50 font-normal mb-1">
                    No past visits recorded
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                    Your completed appointments and cancelled reservations will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Empty State when zero total filtered appointments */}
        {filteredBookings.length === 0 && !isLoading && (
          <div className="rounded-3xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 shadow-card p-10 sm:p-14 text-center backdrop-blur-sm">
            <Calendar className="h-12 w-12 stroke-[1.5] text-rose-800/80 dark:text-rose-300/80 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 dark:text-rose-50 font-normal mb-2">
              No Appointments Found
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-8 max-w-md mx-auto font-sans leading-relaxed">
              {activeFilter !== 'all'
                ? `No ${activeFilter.toLowerCase().replace('_', ' ')} appointments found matching your selected filter.`
                : 'You have not scheduled any private atelier sessions yet. Select a service from our menu to begin your reservation.'}
            </p>
            <div className="flex justify-center">
              <Link href="/services">
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
                >
                  Explore Service Catalog
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
