'use client';

import { useState } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { useQuery, useMutation } from '@/hooks/useApi';
import { availabilityApi } from '@/lib/api';
import { AvailabilityDto, AvailabilityRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Clock,
  Lock,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from 'lucide-react';

interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  name: string;
  shortName: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  maxSlots: number;
}

const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, name: 'Monday', shortName: 'Mon', isOpen: true, startTime: '09:00', endTime: '18:00', maxSlots: 4 },
  { dayOfWeek: 2, name: 'Tuesday', shortName: 'Tue', isOpen: true, startTime: '09:00', endTime: '18:00', maxSlots: 4 },
  { dayOfWeek: 3, name: 'Wednesday', shortName: 'Wed', isOpen: true, startTime: '09:00', endTime: '18:00', maxSlots: 4 },
  { dayOfWeek: 4, name: 'Thursday', shortName: 'Thu', isOpen: true, startTime: '09:00', endTime: '18:00', maxSlots: 4 },
  { dayOfWeek: 5, name: 'Friday', shortName: 'Fri', isOpen: true, startTime: '09:00', endTime: '18:00', maxSlots: 4 },
  { dayOfWeek: 6, name: 'Saturday', shortName: 'Sat', isOpen: true, startTime: '09:00', endTime: '18:00', maxSlots: 4 },
  { dayOfWeek: 0, name: 'Sunday', shortName: 'Sun', isOpen: false, startTime: '10:00', endTime: '16:00', maxSlots: 2 },
];

function formatHourRange(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '—';
  const formatSlot = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const hourPadded = hour12 < 10 ? `0${hour12}` : `${hour12}`;
      return `${hourPadded}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };
  return `${formatSlot(startTime)} – ${formatSlot(endTime)}`;
}

export default function AdminAvailabilityPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<AvailabilityDto | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'blackout' | 'open'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Weekly working hours state
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pretty_nails_working_hours');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_WEEKLY_SCHEDULE;
  });

  const { data: availData, isLoading: loading, refetch } = useQuery(
    () => availabilityApi.getAdmin(),
    { enabled: true }
  );

  const availabilities = availData?.data || [];

  const upsertMutation = useMutation(
    (data: AvailabilityRequest) => availabilityApi.upsert(data),
    {
      onSuccess: () => {
        toast.success(editingAvailability ? 'Availability updated' : 'Availability saved');
        setModalOpen(false);
        setEditingAvailability(null);
        setSelectedDate(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to save availability');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => availabilityApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Override removed');
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to remove override');
      },
    }
  );

  // Calendar day calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAvailabilityForDate = (date: Date): AvailabilityDto | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.find((a) => a.date === dateStr);
  };

  const handleDateClick = (date: Date) => {
    const existing = getAvailabilityForDate(date);
    if (existing) {
      setEditingAvailability(existing);
      setSelectedDate(date);
    } else {
      setEditingAvailability(null);
      setSelectedDate(date);
    }
    setModalOpen(true);
  };

  const handleOpenAddBlackout = () => {
    setEditingAvailability(null);
    setSelectedDate(new Date());
    setModalOpen(true);
  };

  const handleSubmit = (data: AvailabilityRequest) => {
    upsertMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this date override?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setWeeklySchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  const handleUpdateTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklySchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveWeeklySchedule = () => {
    try {
      localStorage.setItem('pretty_nails_working_hours', JSON.stringify(weeklySchedule));
      toast.success('Working hours saved');
    } catch {
      toast.error('Failed to save working hours');
    }
  };

  // Batch sync weekly schedule to current month days
  const handleApplyScheduleToMonth = async () => {
    try {
      setIsSyncing(true);
      const daysInCurrentMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      let appliedCount = 0;

      for (const day of daysInCurrentMonth) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const existing = availabilities.find((a) => a.date === dateStr);
        if (existing && !existing.isAvailable) continue;

        const scheduleForDay = weeklySchedule.find((s) => s.dayOfWeek === day.getDay());
        if (scheduleForDay) {
          await availabilityApi.upsert({
            date: dateStr,
            isAvailable: scheduleForDay.isOpen,
            startTime: scheduleForDay.startTime,
            endTime: scheduleForDay.endTime,
            maxSlots: scheduleForDay.maxSlots,
            note: scheduleForDay.isOpen ? undefined : 'Closed (standard schedule)',
          });
          appliedCount++;
        }
      }

      toast.success(`Schedule synced to ${appliedCount} days in ${format(currentMonth, 'MMMM')}`);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sync schedule';
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Filtered overrides list
  const filteredAvailabilities = availabilities
    .filter((item) => {
      if (filterType === 'blackout') return !item.isAvailable;
      if (filterType === 'open') return item.isAvailable;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const blackoutCount = availabilities.filter((a) => !a.isAvailable).length;
  const openCount = availabilities.filter((a) => a.isAvailable).length;

  return (
    <div className="space-y-8 bg-[#FFF0F3] dark:bg-[#160D12] text-foreground min-h-screen p-6 sm:p-8 lg:p-10 transition-colors selection:bg-rose-200 selection:text-rose-950">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Private Atelier Availability Schedule
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Manage weekly operating hours, private 1-on-1 appointment buffer intervals, and holiday blackout periods.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenAddBlackout}
            className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] flex items-center gap-2.5 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            <span>Add blackout date</span>
          </Button>
        </div>
      </div>

      {/* Explicit Private 1-on-1 Atelier Scheduling Context Banner */}
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-6 shadow-sm">
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.22em] text-rose-800 dark:text-rose-300 font-semibold block">
            Studio Operating Protocol
          </span>
          <p className="text-sm font-serif text-stone-900 dark:text-rose-50 leading-relaxed max-w-3xl">
            Private 1-on-1 Atelier: Every slot accommodates one client exclusively. Hospital-grade dry autoclave sterilization intervals are maintained between treatments.
          </p>
        </div>
      </div>

      {/* Split Layout: Weekly Working Hours (Left) vs Holiday & Blackout Manager (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Weekly Working Hours Schedule */}
        <Card className="xl:col-span-5 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-lg text-stone-900 dark:text-rose-50">
                  Working hours
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Default weekly operating schedule for appointment bookings
                </CardDescription>
              </div>
              <div className="h-9 w-9 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-4">
            <div className="flex flex-col gap-2.5">
              {weeklySchedule.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="h-12 px-4 flex items-center justify-between rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-white/60 dark:bg-stone-900/40 text-xs sm:text-sm"
                >
                  {/* Left: Day & Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-medium text-stone-800 dark:text-rose-200">
                      {day.shortName}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={day.isOpen}
                      onClick={() => handleToggleDay(day.dayOfWeek)}
                      aria-label={`Toggle ${day.name}`}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-rose-800',
                        day.isOpen ? 'bg-rose-900' : 'bg-stone-200 dark:bg-stone-700'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-150',
                          day.isOpen ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <span
                      className={cn(
                        'text-xs font-normal',
                        day.isOpen
                          ? 'text-stone-700 dark:text-stone-300'
                          : 'text-stone-400 dark:text-stone-500'
                      )}
                    >
                      {day.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {/* Right: Time inputs or closed chip */}
                  <div className="flex items-center gap-1.5">
                    {day.isOpen ? (
                      <div className="flex items-center gap-1.5 tabular-nums font-mono">
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleUpdateTime(day.dayOfWeek, 'startTime', e.target.value)}
                          className="h-8 w-22 rounded-lg border border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90 px-1.5 text-xs text-stone-900 dark:text-rose-100 focus:outline-none focus:ring-1.5 focus:ring-rose-800"
                        />
                        <span className="text-stone-400">–</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleUpdateTime(day.dayOfWeek, 'endTime', e.target.value)}
                          className="h-8 w-22 rounded-lg border border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90 px-1.5 text-xs text-stone-900 dark:text-rose-100 focus:outline-none focus:ring-1.5 focus:ring-rose-800"
                        />
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono text-stone-500 dark:text-stone-400 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Save and sync buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyScheduleToMonth}
                disabled={isSyncing}
                className="text-xs h-12 px-6 rounded-full border-rose-200/80 dark:border-rose-800/60 text-stone-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-medium"
              >
                <span>{isSyncing ? 'Syncing...' : 'Sync with calendar'}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSaveWeeklySchedule}
                className="gap-2 bg-rose-900 hover:bg-rose-950 text-white text-xs h-12 px-6 rounded-full font-medium transition-colors border border-rose-800/80 shadow-xs"
              >
                <Check className="h-4 w-4" strokeWidth={1.5} />
                <span>Save working hours</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Holiday and Blackout Slots Calendar */}
        <Card className="xl:col-span-7 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-lg text-stone-900 dark:text-rose-50">
                Holiday and blackout slots
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Calendar overrides, holiday closures, and blocked time slots
              </CardDescription>
            </div>

            {/* Month Stepper */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                aria-label="Previous month"
                className="h-10 w-10 rounded-full border-rose-200/80 dark:border-rose-800/60 text-stone-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              <span className="text-sm font-serif font-medium min-w-[140px] text-center text-stone-900 dark:text-rose-50 tabular-nums">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                aria-label="Next month"
                className="h-10 w-10 rounded-full border-rose-200/80 dark:border-rose-800/60 text-stone-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 border-b border-rose-200/60 dark:border-rose-950/60 pb-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5 min-h-[320px]">
              {days.map((day) => {
                const isCurrentMonthDay = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const avail = getAvailabilityForDate(day);
                const hasOverride = !!avail;
                const isOverrideBlackout = hasOverride && !avail.isAvailable;
                const isOverrideOpen = hasOverride && avail.isAvailable;

                const weeklyDay = weeklySchedule.find((s) => s.dayOfWeek === day.getDay());
                const defaultClosed = !hasOverride && weeklyDay && !weeklyDay.isOpen;

                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'min-h-[58px] sm:min-h-[66px] p-2 rounded-xl border flex flex-col justify-between text-left transition-colors duration-150 relative group',
                      !isCurrentMonthDay
                        ? 'border-transparent text-stone-300 dark:text-stone-700 bg-white/20 dark:bg-stone-900/10'
                        : 'border-rose-200/60 dark:border-rose-950/60 bg-white/70 dark:bg-stone-900/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/30',
                      today && 'ring-1.5 ring-rose-800',
                      isSelected && 'ring-2 ring-rose-900',
                      isOverrideBlackout &&
                        'bg-rose-100/70 dark:bg-rose-950/40 border-rose-300/80 dark:border-rose-900/70',
                      isOverrideOpen &&
                        'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300/70 dark:border-emerald-800/60',
                      defaultClosed && !hasOverride && isCurrentMonthDay && 'bg-stone-50/40 dark:bg-stone-900/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'tabular-nums text-xs font-mono font-medium',
                          !isCurrentMonthDay
                            ? 'text-stone-300 dark:text-stone-700'
                            : 'text-stone-800 dark:text-rose-100'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {isOverrideBlackout && (
                        <Lock className="h-3 w-3 text-rose-800 dark:text-rose-300 shrink-0" strokeWidth={1.5} />
                      )}
                    </div>

                    {/* Status badge */}
                    {isCurrentMonthDay && (
                      <div className="mt-1">
                        {isOverrideBlackout ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-200/80 dark:bg-rose-900/60 text-rose-950 dark:text-rose-100">
                            Blackout
                          </span>
                        ) : isOverrideOpen ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200">
                              Open
                            </span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 tabular-nums font-mono truncate mt-0.5">
                              {avail.startTime}
                            </span>
                          </div>
                        ) : defaultClosed ? (
                          <span className="inline-block text-[10px] text-stone-400 dark:text-stone-500 font-normal">
                            Closed
                          </span>
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-rose-200/60 dark:border-rose-950/60 flex flex-wrap items-center justify-center gap-5 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700" />
                <span>Open slot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-200 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700" />
                <span>Blackout date</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-stone-100 dark:bg-stone-800 border border-rose-200/60 dark:border-stone-700" />
                <span>Default weekly</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-rose-900" />
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Date Overrides Table Card */}
      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
        <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-lg text-stone-900 dark:text-rose-50">
              Scheduled date overrides
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Review all active holiday closures, blackout slots, and custom date adjustments
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-colors border',
                filterType === 'all'
                  ? 'bg-rose-900 text-white border-rose-800'
                  : 'border-rose-200/80 dark:border-rose-900/60 text-stone-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50'
              )}
            >
              All ({availabilities.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('blackout')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-colors border',
                filterType === 'blackout'
                  ? 'bg-rose-900 text-white border-rose-800'
                  : 'border-rose-200/80 dark:border-rose-900/60 text-stone-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50'
              )}
            >
              Blackout dates ({blackoutCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('open')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-colors border',
                filterType === 'open'
                  ? 'bg-rose-900 text-white border-rose-800'
                  : 'border-rose-200/80 dark:border-rose-900/60 text-stone-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50'
              )}
            >
              Open overrides ({openCount})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredAvailabilities.length === 0 ? (
            <div className="p-14 text-center">
              <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center mx-auto mb-3 text-rose-800 dark:text-rose-300">
                <Lock className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50 mb-1">
                No date overrides scheduled
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto mb-5 leading-relaxed">
                Add holidays or studio closures to prevent customer bookings on specific dates.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddBlackout}
                className="h-10 px-5 rounded-full border-rose-200/80 dark:border-rose-800/60 text-xs font-medium gap-2"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                <span>Add blackout date</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-y border-rose-200/80 dark:border-rose-950/60 bg-rose-50/70 dark:bg-[#20111A]/90 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Working hours</th>
                    <th className="py-3 px-5">Max slots</th>
                    <th className="py-3 px-5">Reason or note</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-200/60 dark:divide-rose-950/60">
                  {filteredAvailabilities.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-5 font-mono font-medium text-stone-900 dark:text-rose-50 tabular-nums">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-3.5 px-5">
                        {row.isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                            <Check className="h-3 w-3" strokeWidth={1.5} />
                            <span>Open</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium bg-rose-100/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
                            <Lock className="h-3 w-3" strokeWidth={1.5} />
                            <span>Blackout</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 tabular-nums font-mono text-stone-700 dark:text-stone-300">
                        {row.isAvailable ? formatHourRange(row.startTime, row.endTime) : '—'}
                      </td>
                      <td className="py-3.5 px-5 tabular-nums font-mono text-stone-700 dark:text-stone-300">
                        {row.isAvailable ? row.maxSlots : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-stone-600 dark:text-stone-400 max-w-xs truncate">
                        {row.note || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingAvailability(row);
                              setSelectedDate(parseISO(row.date));
                              setModalOpen(true);
                            }}
                            aria-label={`Edit availability for ${row.date}`}
                            className="h-9 w-9 rounded-full text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white hover:bg-rose-100/60 dark:hover:bg-rose-950/50"
                          >
                            <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(row.id)}
                            aria-label={`Delete override for ${row.date}`}
                            className="h-9 w-9 rounded-full text-rose-700 hover:text-rose-950 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for Adding / Editing Blackout Date or Override */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAvailability(null);
          setSelectedDate(null);
        }}
        title={
          editingAvailability
            ? editingAvailability.isAvailable
              ? 'Edit open slot override'
              : 'Edit blackout slot'
            : 'Add date slot or blackout'
        }
        description="Set working hours or block customer bookings for this date in the atelier calendar"
        size="md"
      >
        <AvailabilityForm
          initialData={editingAvailability}
          defaultDate={selectedDate}
          onSubmit={handleSubmit}
          onClose={() => {
            setModalOpen(false);
            setEditingAvailability(null);
            setSelectedDate(null);
          }}
          isLoading={upsertMutation.isPending}
        />
      </Modal>
    </div>
  );
}

interface AvailabilityFormProps {
  initialData: AvailabilityDto | null;
  defaultDate: Date | null;
  onSubmit: (data: AvailabilityRequest) => void;
  onClose: () => void;
  isLoading: boolean;
}

function AvailabilityForm({ initialData, defaultDate, onSubmit, onClose, isLoading }: AvailabilityFormProps) {
  const [formData, setFormData] = useState<AvailabilityRequest>({
    date:
      initialData?.date ||
      (defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    isAvailable: initialData?.isAvailable ?? false,
    startTime: initialData?.startTime || '09:00',
    endTime: initialData?.endTime || '18:00',
    maxSlots: initialData?.maxSlots || 4,
    note: initialData?.note || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      {/* Date input */}
      <Input
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
        className="tabular-nums rounded-xl border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90 font-mono"
      />

      {/* Mode Selector Toggle: Blackout vs Open */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
          Availability status
        </label>
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-stone-900/40">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isAvailable: false })}
            className={cn(
              'h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors',
              !formData.isAvailable
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-rose-100'
            )}
          >
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Blackout date</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isAvailable: true })}
            className={cn(
              'h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors',
              formData.isAvailable
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-rose-100'
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Open for bookings</span>
          </button>
        </div>
      </div>

      {/* When Blackout is selected */}
      {!formData.isAvailable ? (
        <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-3">
          <Lock className="h-4 w-4 text-rose-800 dark:text-rose-300 shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            All appointment bookings will be blocked for this entire date in the atelier booking calendar.
          </p>
        </div>
      ) : (
        /* When Open is selected */
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              className="tabular-nums font-mono rounded-xl border-rose-200/80 dark:border-rose-900/60"
            />
            <Input
              label="End time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
              className="tabular-nums font-mono rounded-xl border-rose-200/80 dark:border-rose-900/60"
            />
          </div>

          <Input
            label="Max concurrent slots"
            type="number"
            value={formData.maxSlots}
            onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) || 1 })}
            min={1}
            max={20}
            required
            className="tabular-nums font-mono rounded-xl border-rose-200/80 dark:border-rose-900/60"
          />
        </div>
      )}

      {/* Note / Reason */}
      <Input
        label="Reason or administrative note"
        placeholder="e.g. Atelier staff sterilization maintenance or holiday closure"
        value={formData.note || ''}
        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        helperText="Visible internally to atelier management only."
        className="rounded-xl border-rose-200/80 dark:border-rose-900/60"
      />

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-rose-200/60 dark:border-rose-950/60">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
          className="h-10 px-5 rounded-full text-xs font-medium border-rose-200/80 dark:border-rose-800/60"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          isLoading={isLoading}
          className="h-10 px-6 rounded-full text-xs font-medium bg-rose-900 hover:bg-rose-950 text-white border border-rose-800/80 shadow-xs"
        >
          {initialData ? 'Save changes' : formData.isAvailable ? 'Save open date' : 'Add blackout date'}
        </Button>
      </div>
    </form>
  );
}
