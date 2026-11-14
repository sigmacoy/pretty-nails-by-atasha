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
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-3">
            Atelier Schedule · Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-stone-900 dark:text-rose-50 leading-[1.08]">
            Private Atelier Appointment Availability
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
            Appointments at Pretty Nails by Atasha are exclusive, private 1-on-1 sessions. Select an available date to view 30-minute booking windows. Downpayment verification via GCash or Maya guarantees your reservation.
          </p>
        </div>

        {/* Notice Banner */}
        <div className="mb-8 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-5 sm:p-6 shadow-card flex items-start sm:items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <Calendar className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            <span className="font-semibold text-stone-900 dark:text-rose-50 block sm:inline mr-1">
              Private 1-on-1 Studio Sanctuary:
            </span>
            Appointments open from tomorrow up to 30 days ahead. GCash and Maya reservation deposits are manually reviewed and confirmed by Atasha. Free rescheduling is permitted up to 24 hours prior to your slot.
          </div>
        </div>

        {/* Side-by-Side View: Calendar on left, Available slots on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Month Calendar */}
          <Card className="lg:col-span-7 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 shadow-card">
            <CardContent className="p-6 sm:p-8">
              {/* Month Stepper */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-rose-100 dark:border-rose-950/60">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  aria-label="Previous month"
                  className="h-10 w-10 rounded-full border-rose-200/80 dark:border-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-200"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </Button>
                <h2 className="text-lg sm:text-xl font-serif font-medium text-stone-900 dark:text-rose-50 tabular-nums">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  aria-label="Next month"
                  className="h-10 w-10 rounded-full border-rose-200/80 dark:border-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-200"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-[11px] font-medium uppercase tracking-wider text-rose-800/80 dark:text-rose-300/80 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1.5 min-h-[300px]">
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
                      type="button"
                      onClick={() => !past && handleDateClick(day)}
                      disabled={past || !isCurrentMonthDay}
                      className={cn(
                        'h-12 sm:h-14 w-full rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm relative transition-all duration-150 select-none border',
                        !isCurrentMonthDay && 'text-stone-300/30 dark:text-stone-700/30 border-transparent pointer-events-none',
                        isCurrentMonthDay && past && 'text-stone-300 dark:text-stone-700 opacity-40 border-transparent cursor-not-allowed pointer-events-none',
                        isCurrentMonthDay && !past && !isSelected && available && 'border-rose-200/70 dark:border-rose-950/60 text-stone-900 dark:text-rose-50 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium hover:border-rose-300',
                        isCurrentMonthDay && !past && !isSelected && !available && hasData && 'border-stone-100 dark:border-stone-800/40 text-stone-400 dark:text-stone-600 bg-stone-50/40 dark:bg-stone-900/20 cursor-not-allowed',
                        isCurrentMonthDay && !past && !isSelected && !hasData && 'border-rose-100/60 dark:border-rose-950/30 text-stone-600 dark:text-stone-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer',
                        today && !isSelected && 'ring-1 ring-rose-500/60 font-semibold',
                        isSelected && 'bg-rose-900 border-rose-900 text-white font-semibold shadow-xs'
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
                            isSelected ? 'bg-white' : available ? 'bg-rose-700 dark:bg-rose-400' : 'bg-stone-300 dark:bg-stone-700'
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-5 border-t border-rose-100 dark:border-rose-950/60 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 dark:text-stone-300">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-700 dark:bg-rose-400" />
                  <span>Available Date</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-stone-300 dark:bg-stone-700" />
                  <span>Fully Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm ring-1 ring-rose-500" />
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Available Time Slots */}
          <Card className="lg:col-span-5 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 shadow-card">
            <CardContent className="p-6 sm:p-8">
              {selectedDate ? (
                <div>
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-rose-100 dark:border-rose-950/60">
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 block">
                        Selected Date
                      </span>
                      <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-rose-50 tabular-nums mt-0.5">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h3>
                    </div>
                    {isPast(format(selectedDate, 'yyyy-MM-dd')) && (
                      <Badge variant="destructive" className="shrink-0">Past date</Badge>
                    )}
                  </div>

                  {timeSlots.length === 0 ? (
                    <div className="text-center py-14 px-4">
                      <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center mx-auto mb-3 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                        <Clock className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <h4 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50 mb-1">
                        No slots open
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xs mx-auto leading-relaxed font-normal">
                        {isPast(format(selectedDate, 'yyyy-MM-dd'))
                          ? 'This date has passed. Please choose a future appointment date from the calendar.'
                          : 'No 30-minute studio windows are open for this date. Please choose another date.'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <div className="text-xs text-stone-500 dark:text-stone-400 mb-3 flex items-center justify-between">
                        <span className="font-medium text-stone-700 dark:text-stone-300">Available appointment windows</span>
                        <span className="tabular-nums font-mono text-rose-800 dark:text-rose-300 text-xs">
                          {timeSlots.length} {timeSlots.length === 1 ? 'window' : 'windows'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                        {timeSlots.map((slot) => (
                          <Link
                            key={`${slot.startTime}-${slot.endTime}`}
                            href={`/booking?date=${format(selectedDate, 'yyyy-MM-dd')}&time=${slot.startTime}`}
                            className="block group"
                          >
                            <div
                              className={cn(
                                'w-full h-12 px-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 flex items-center justify-between transition-all duration-150',
                                slot.available
                                  ? 'bg-white dark:bg-stone-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 text-stone-900 dark:text-rose-100 cursor-pointer shadow-2xs'
                                  : 'bg-stone-50/50 dark:bg-stone-900/20 text-stone-400 cursor-not-allowed opacity-60'
                              )}
                            >
                              <span className="tabular-nums text-xs sm:text-sm font-medium group-hover:text-rose-900 dark:group-hover:text-rose-200 transition-colors">
                                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                              </span>
                              <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-rose-800 dark:group-hover:text-rose-200 transition-colors shrink-0" strokeWidth={1.5} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 px-4">
                  <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center mx-auto mb-3 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                    <Calendar className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50 mb-1">
                    Select an appointment date
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xs mx-auto leading-relaxed font-normal">
                    Choose an active day from the calendar to inspect open private 1-on-1 atelier time slots.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA Bottom Banner */}
        <div className="mt-14 sm:mt-16 text-center p-8 sm:p-12 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-gradient-to-br from-white via-rose-50/50 to-pink-50/30 dark:from-stone-900 dark:via-rose-950/20 dark:to-stone-900 shadow-card max-w-3xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Private 1-on-1 Atelier Booking
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900 dark:text-rose-50 tracking-tight">
            Ready to reserve your appointment?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed font-normal">
            Choose your service tier and preferred timing. Reservation deposit via GCash or Maya guarantees your exclusive slot.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/booking">
              <button
                type="button"
                className="inline-flex items-center justify-center h-14 sm:h-16 px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base sm:text-lg tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01] gap-2"
              >
                <Calendar className="h-5 w-5" strokeWidth={1.5} />
                <span>Reserve Appointment</span>
              </button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-rose-800/70 dark:text-rose-300/70 font-normal tracking-wide">
            Pretty Nails by Atasha · Cebu City · Deposit manually reviewed before confirmation
          </p>
        </div>
      </div>
    </div>
  );
}
