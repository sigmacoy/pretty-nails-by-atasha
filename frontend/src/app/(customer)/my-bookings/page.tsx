'use client';

import { useState } from 'react';
import { Calendar, Clock, ShoppingBag, Archive, Filter, X } from 'lucide-react';
import { useQuery } from '@/hooks/useApi';
import { bookingsApi } from '@/lib/api';
import { BookingDto, BookingStatus } from '@/types';
import { BookingCard, BookingSkeleton } from '@/components/bookings/BookingCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatPrice, getStatusColor, getStatusLabel, isPast } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_FILTERS: { value: 'all' | BookingStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
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
      <div className="container-padding section-padding">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 w-48 bg-muted rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              {STATUS_FILTERS.map((filter) => (
                <div key={filter.value} className="h-10 w-24 bg-muted rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <BookingSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-padding section-padding text-center py-16">
        <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Bookings
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Please try again later or contact support.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const hasActiveFilter = activeFilter !== 'all' || showPast;

  return (
    <div className="container-padding section-padding">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              My Bookings
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              View and manage your nail salon appointments
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Booking status filters">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    role="tab"
                    aria-selected={activeFilter === filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeFilter === filter.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Badge
                      variant="outline"
                      className={getStatusColor(filter.value as BookingStatus)}
                    >
                      {filter.label}
                    </Badge>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={showPast ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setShowPast(!showPast)}
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  {showPast ? 'Hide Past' : 'Show Past'}
                </Button>
                {hasActiveFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveFilter('all');
                      setShowPast(false);
                    }}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <section className="mb-12" aria-labelledby="upcoming-heading">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 id="upcoming-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Upcoming ({upcomingBookings.length})
            </h2>
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
        <section aria-labelledby="past-heading">
          <div className="flex items-center gap-2 mb-6">
            <Archive className="h-6 w-6 text-gray-500" />
            <h2 id="past-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Past Bookings {pastBookings.length > 0 && `(${pastBookings.length})`}
            </h2>
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
            <Card>
              <CardContent className="p-8 text-center">
                <Archive className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Past Bookings
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Your completed and cancelled bookings will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Bookings Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {activeFilter !== 'all'
                ? `No ${getStatusLabel(activeFilter).toLowerCase()} bookings found.`
                : 'You haven\'t made any bookings yet.'}
            </p>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => window.location.href = '/services'}
            >
              Browse Services
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}