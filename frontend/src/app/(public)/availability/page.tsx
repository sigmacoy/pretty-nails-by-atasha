'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, isBefore } from 'date-fns';
import { Calendar, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@/hooks/useApi';
import { availabilityApi } from '@/lib/api';
import { AvailabilityDto } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatTime, isPast } from '@/lib/utils';

export default function AvailabilityPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<{ startTime: string; endTime: string; available: boolean }[]>([]);

  const { data: availabilityData, isLoading, refetch } = useQuery(
    () => availabilityApi.getAvailable(),
    { enabled: true }
  );

  const availabilities = availabilityData?.data || [];

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAvailabilityForDate = (date: Date): AvailabilityDto | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.find(a => a.date === dateStr);
  };

  const isDateAvailable = (date: Date): boolean => {
    const avail = getAvailabilityForDate(date);
    return avail?.isAvailable ?? false;
  };

  const hasAvailabilityData = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.some(a => a.date === dateStr);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isPast(dateStr)) return;

    const avail = getAvailabilityForDate(date);
    if (!avail || !avail.isAvailable) {
      setSelectedDate(date);
      setTimeSlots([]);
      return;
    }

    setSelectedDate(date);

    // Generate 30-minute slots
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    const [startHour, startMin] = avail.startTime.split(':').map(Number);
    const [endHour, endMin] = avail.endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      let nextHour = currentHour;
      let nextMin = currentMin + 30;
      if (nextMin >= 60) {
        nextMin -= 60;
        nextHour += 1;
      }
      const slotEnd = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`;

      if (nextHour < endHour || (nextHour === endHour && nextMin <= endMin)) {
        slots.push({ startTime: slotStart, endTime: slotEnd, available: true });
      }

      currentHour = nextHour;
      currentMin = nextMin;
    }

    setTimeSlots(slots);
  };

  const prevMonth = () => setCurrentMonth(addDays(currentMonth, -1));
  const nextMonth = () => setCurrentMonth(addDays(currentMonth, 1));

  return (
    <div className="container-padding section-padding">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Availability
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Check available dates and time slots for your appointment.
        </p>
      </div>

      {/* Calendar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCurrentMonthDay = isSameMonth(day, currentMonth);
              const isSelected = !!(selectedDate && isSameDay(day, selectedDate));
              const today = isToday(day);
              const dateStr = format(day, 'yyyy-MM-dd');
              const past = isPast(dateStr);
              const available = isDateAvailable(day);
              const hasData = hasAvailabilityData(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !past && handleDateClick(day)}
                  disabled={past}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all
                    ${!isCurrentMonthDay ? 'text-gray-300 dark:text-gray-600' : ''}
                    ${past ? 'opacity-40 cursor-not-allowed' : ''}
                    ${today && !isSelected ? 'ring-2 ring-primary' : ''}
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                    ${available && !isSelected && !past ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800' : ''}
                    ${!available && hasData && !isSelected && !past ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                    ${!hasData && !past && !isSelected ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                    ${!hasData && !past ? 'cursor-pointer' : ''}
                  `}
                  aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                  aria-selected={isSelected}
                  aria-disabled={past}
                >
                  <span className="relative z-10">{format(day, 'd')}</span>
                  {hasData && !past && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {available ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700" />
              <span>Unavailable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" />
              <span>No data</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border-2 border-primary" />
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardContent className="p-6">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isPast(format(selectedDate!, 'yyyy-MM-dd'))
                    ? 'Past Date - No Slots Available'
                    : `Available Slots for ${format(selectedDate!, 'EEEE, MMMM d, yyyy')}`}
                </h3>
                {isPast(format(selectedDate!, 'yyyy-MM-dd')) && (
                  <Badge variant="destructive">Past Date</Badge>
                )}
              </div>

              {timeSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {isPast(format(selectedDate!, 'yyyy-MM-dd'))
                      ? 'This date has passed. Please select a future date.'
                      : 'No time slots available for this date.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {timeSlots.map((slot) => (
                    <Link
                      key={`${slot.startTime}-${slot.endTime}`}
                      href={`/booking?date=${format(selectedDate!, 'yyyy-MM-dd')}&time=${slot.startTime}`}
                      className="block"
                    >
                      <Button
                        variant={slot.available ? 'outline' : 'secondary'}
                        disabled={!slot.available}
                        className="w-full justify-between"
                      >
                        <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                        {slot.available ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Select a date from the calendar to see available time slots.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ready to book your appointment?
        </p>
        <Link href="/booking">
          <Button size="lg" className="gap-2">
            Book Appointment
            <Calendar className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}