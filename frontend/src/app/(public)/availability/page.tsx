'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@/hooks/useApi';
import { availabilityApi } from '@/lib/api';
import { AvailabilityDto } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { formatTime, isPast, cn } from '@/lib/utils';

export default function AvailabilityPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<{ startTime: string; endTime: string; available: boolean }[]>([]);

  const { data: availabilityData, isLoading } = useQuery(
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
    return availabilities.find((a) => a.date === dateStr);
  };

  const isDateAvailable = (date: Date): boolean => {
    const avail = getAvailabilityForDate(date);
    return avail?.isAvailable ?? false;
  };

  const hasAvailabilityData = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.some((a) => a.date === dateStr);
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

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="container-padding section-padding max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Availability
        </h1>
        <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl">
          Check available dates and time slots for your appointment.
        </p>
      </div>

      {/* Notice Banner */}
      <div className="mb-6 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/40 p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-primary">
          <Calendar className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
          Bookings available from tomorrow up to 1 month ahead.
        </p>
      </div>

      {/* Side-by-Side View: Calendar on left, Available slots on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Month Calendar */}
        <Card className="lg:col-span-7">
          <CardContent className="p-5 sm:p-6">
            {/* Month Stepper */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                aria-label="Previous month"
                className="h-9 w-9 rounded-md border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              <h2 className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                aria-label="Next month"
                className="h-9 w-9 rounded-md border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 py-1.5"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 min-h-[270px]">
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
                    disabled={past || !isCurrentMonthDay}
                    className={cn(
                      'h-10 sm:h-11 w-full rounded-md flex flex-col items-center justify-center text-xs sm:text-sm relative transition-colors duration-150',
                      !isCurrentMonthDay && 'text-stone-300/40 dark:text-stone-700/40 pointer-events-none',
                      isCurrentMonthDay && past && 'text-stone-300 dark:text-stone-700 opacity-40 cursor-not-allowed pointer-events-none',
                      isCurrentMonthDay && !past && !isSelected && available && 'text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/80 cursor-pointer font-medium',
                      isCurrentMonthDay && !past && !isSelected && !available && hasData && 'text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/20 cursor-not-allowed',
                      isCurrentMonthDay && !past && !isSelected && !hasData && 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/80 cursor-pointer',
                      today && !isSelected && 'ring-1 ring-primary/50 font-semibold',
                      isSelected && 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    )}
                    aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                    aria-selected={isSelected}
                    aria-disabled={past}
                  >
                    <span className="tabular-nums relative z-10">{format(day, 'd')}</span>
                    {isCurrentMonthDay && hasData && !past && (
                      <span
                        className={cn(
                          'absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                          isSelected ? 'bg-primary-foreground' : available ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-700'
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span>Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md border border-primary/50" />
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Available Time Slots */}
        <Card className="lg:col-span-5">
          <CardContent className="p-5 sm:p-6">
            {selectedDate ? (
              <div>
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800/60">
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                      Selected date
                    </p>
                    <h3 className="text-sm sm:text-base font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                  </div>
                  {isPast(format(selectedDate, 'yyyy-MM-dd')) && (
                    <Badge variant="destructive" className="shrink-0">Past date</Badge>
                  )}
                </div>

                {timeSlots.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400 dark:text-stone-500">
                      <Clock className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                      No slots available
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                      {isPast(format(selectedDate, 'yyyy-MM-dd'))
                        ? 'This date has passed. Please select a future date.'
                        : 'No time slots available for this date. Please choose another day from the calendar.'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="text-xs text-stone-500 dark:text-stone-400 mb-3 flex items-center justify-between">
                      <span>Available time slots</span>
                      <span className="tabular-nums font-mono text-stone-600 dark:text-stone-400">
                        {timeSlots.length} {timeSlots.length === 1 ? 'slot' : 'slots'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                      {timeSlots.map((slot) => (
                        <Link
                          key={`${slot.startTime}-${slot.endTime}`}
                          href={`/booking?date=${format(selectedDate, 'yyyy-MM-dd')}&time=${slot.startTime}`}
                          className="block group"
                        >
                          <Button
                            variant={slot.available ? 'outline' : 'secondary'}
                            disabled={!slot.available}
                            className="w-full justify-between h-9 px-3 rounded-md border-stone-200/80 dark:border-stone-800/80 group-hover:border-primary/60 group-hover:bg-primary/5 dark:group-hover:bg-primary/10 transition-colors duration-150 font-normal"
                          >
                            <span className="tabular-nums text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-primary transition-colors shrink-0" strokeWidth={1.5} />
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400 dark:text-stone-500">
                  <Calendar className="h-4 w-4 text-stone-500 dark:text-stone-400" strokeWidth={1.5} />
                </div>
                <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                  Select a date
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                  Select a date from the calendar to see available 30-minute appointment slots.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center p-6 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-card">
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-3">
          Ready to book your appointment?
        </p>
        <Link href="/booking">
          <Button size="md" className="gap-2">
            <span>Book appointment</span>
            <Calendar className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
