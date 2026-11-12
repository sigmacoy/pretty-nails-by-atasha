'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Clock,
  Calendar,
  Lock,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  AlertCircle,
  Filter,
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
        // Do not overwrite explicit blackout dates unless user edits them
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
    <div className="container-padding section-padding max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            Availability
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Configure weekly operating hours and manage holiday blackout dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAddBlackout}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md text-sm font-medium transition-colors duration-150 ease-studio"
          >
            <Plus className="h-4 w-4 stroke-[1.5]" />
            <span>Add blackout date</span>
          </Button>
        </div>
      </div>

      {/* Split Layout: Weekly Working Hours (Left) vs Holiday & Blackout Manager (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Weekly Working Hours Schedule */}
        <Card className="xl:col-span-5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-card">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium text-stone-900 dark:text-stone-100">
                  Working hours
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Default weekly operating schedule for appointment bookings
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400">
                <Clock className="h-4 w-4 stroke-[1.5]" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-4">
            {/* Day rows on 4px grid: 40px height with 8px gap */}
            <div className="flex flex-col gap-2">
              {weeklySchedule.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="h-10 px-3 flex items-center justify-between rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/40 dark:bg-stone-900/20 text-xs sm:text-sm"
                >
                  {/* Left: Day & Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-medium text-stone-800 dark:text-stone-200">
                      {day.shortName}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={day.isOpen}
                      onClick={() => handleToggleDay(day.dayOfWeek)}
                      aria-label={`Toggle ${day.name}`}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-150 ease-studio focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-primary',
                        day.isOpen ? 'bg-primary' : 'bg-stone-200 dark:bg-stone-700'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-150 ease-studio',
                          day.isOpen ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <span
                      className={cn(
                        'text-xs font-normal',
                        day.isOpen
                          ? 'text-stone-600 dark:text-stone-300'
                          : 'text-stone-400 dark:text-stone-500'
                      )}
                    >
                      {day.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {/* Right: Time inputs or closed chip */}
                  <div className="flex items-center gap-1.5">
                    {day.isOpen ? (
                      <div className="flex items-center gap-1 tabular-nums font-mono">
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleUpdateTime(day.dayOfWeek, 'startTime', e.target.value)}
                          className="h-7 w-20 rounded-md border border-stone-200 dark:border-stone-700 bg-background dark:bg-stone-900/60 px-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1.5 focus:ring-primary"
                        />
                        <span className="text-stone-400">–</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleUpdateTime(day.dayOfWeek, 'endTime', e.target.value)}
                          className="h-7 w-20 rounded-md border border-stone-200 dark:border-stone-700 bg-background dark:bg-stone-900/60 px-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1.5 focus:ring-primary"
                        />
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-normal text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60">
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Save and sync buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyScheduleToMonth}
                disabled={isSyncing}
                className="text-xs h-9 rounded-md border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <span>{isSyncing ? 'Syncing...' : 'Sync with calendar'}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSaveWeeklySchedule}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 px-4 rounded-md font-medium transition-colors duration-150 ease-studio"
              >
                <Check className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>Save working hours</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Holiday and Blackout Slots Calendar */}
        <Card className="xl:col-span-7 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-card">
          <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-medium text-stone-900 dark:text-stone-100">
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
                className="h-8 w-8 rounded-md border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
              </Button>
              <span className="text-sm font-medium min-w-[130px] text-center text-stone-900 dark:text-stone-100 tabular-nums">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                aria-label="Next month"
                className="h-8 w-8 rounded-md border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <ChevronRight className="h-4 w-4 stroke-[1.5]" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 border-b border-stone-200/60 dark:border-stone-800/60 pb-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 min-h-[300px]">
              {days.map((day) => {
                const isCurrentMonthDay = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const avail = getAvailabilityForDate(day);
                const hasOverride = !!avail;
                const isOverrideBlackout = hasOverride && !avail.isAvailable;
                const isOverrideOpen = hasOverride && avail.isAvailable;

                // Check default weekly fallback when no override exists
                const weeklyDay = weeklySchedule.find((s) => s.dayOfWeek === day.getDay());
                const defaultClosed = !hasOverride && weeklyDay && !weeklyDay.isOpen;

                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'min-h-[52px] sm:min-h-[60px] p-1.5 rounded-md border flex flex-col justify-between text-left transition-colors duration-150 ease-studio relative group',
                      !isCurrentMonthDay
                        ? 'border-transparent text-stone-300 dark:text-stone-700 bg-stone-50/30 dark:bg-stone-900/10'
                        : 'border-stone-200/60 dark:border-stone-800/60 bg-card hover:bg-stone-50 dark:hover:bg-stone-900/50',
                      today && 'ring-1 ring-primary/50',
                      isSelected && 'ring-1.5 ring-primary',
                      isOverrideBlackout &&
                        'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50',
                      isOverrideOpen &&
                        'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/50',
                      defaultClosed && !hasOverride && isCurrentMonthDay && 'bg-stone-50/40 dark:bg-stone-900/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'tabular-nums text-xs font-medium',
                          !isCurrentMonthDay
                            ? 'text-stone-300 dark:text-stone-700'
                            : 'text-stone-800 dark:text-stone-200'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {isOverrideBlackout && (
                        <Lock className="h-3 w-3 text-amber-700 dark:text-amber-400 shrink-0 stroke-[1.5]" />
                      )}
                    </div>

                    {/* Status badge / chip */}
                    {isCurrentMonthDay && (
                      <div className="mt-1">
                        {isOverrideBlackout ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            Blackout
                          </span>
                        ) : isOverrideOpen ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
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

            {/* Quiet Legend */}
            <div className="mt-4 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex flex-wrap items-center justify-center gap-5 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700" />
                <span>Open slot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700" />
                <span>Blackout date</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700" />
                <span>Default weekly</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-primary" />
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Date Overrides Table Card */}
      <Card className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-card">
        <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-medium text-stone-900 dark:text-stone-100">
              Scheduled date overrides
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Review all active holiday closures, blackout slots, and custom date adjustments
            </CardDescription>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 ease-studio',
                filterType === 'all'
                  ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              All ({availabilities.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('blackout')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 ease-studio',
                filterType === 'blackout'
                  ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              Blackout dates ({blackoutCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('open')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 ease-studio',
                filterType === 'open'
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
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
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : filteredAvailabilities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400 dark:text-stone-500">
                <Lock className="h-4 w-4 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                No date overrides scheduled
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4 leading-relaxed">
                Add holidays or studio closures to prevent customer bookings on specific dates.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddBlackout}
                className="gap-1.5 text-xs h-8 rounded-md"
              >
                <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>Add blackout date</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-y border-stone-200/80 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/40 text-stone-500 dark:text-stone-400">
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Working hours</th>
                    <th className="py-2.5 px-4 font-medium">Max slots</th>
                    <th className="py-2.5 px-4 font-medium">Reason or note</th>
                    <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
                  {filteredAvailabilities.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors duration-150 ease-studio"
                    >
                      <td className="py-3 px-4 font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-3 px-4">
                        {row.isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                            <Check className="h-3 w-3 stroke-[1.5]" />
                            <span>Open</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                            <Lock className="h-3 w-3 stroke-[1.5]" />
                            <span>Blackout</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 tabular-nums font-mono text-stone-700 dark:text-stone-300">
                        {row.isAvailable ? formatHourRange(row.startTime, row.endTime) : '—'}
                      </td>
                      <td className="py-3 px-4 tabular-nums font-mono text-stone-600 dark:text-stone-400">
                        {row.isAvailable ? row.maxSlots : '—'}
                      </td>
                      <td className="py-3 px-4 text-stone-600 dark:text-stone-400 max-w-xs truncate">
                        {row.note || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingAvailability(row);
                              setSelectedDate(parseISO(row.date));
                              setModalOpen(true);
                            }}
                            aria-label={`Edit availability for ${row.date}`}
                            className="h-8 w-8 rounded-md text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            <Edit2 className="h-3.5 w-3.5 stroke-[1.5]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(row.id)}
                            aria-label={`Delete override for ${row.date}`}
                            className="h-8 w-8 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
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
        description="Set working hours or block customer bookings for this date"
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
    isAvailable: initialData?.isAvailable ?? false, // default to false (blackout) when adding from button
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
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* Date input */}
      <Input
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
        className="tabular-nums"
      />

      {/* Mode Selector Toggle: Blackout vs Open */}
      <div>
        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
          Availability status
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/40">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isAvailable: false })}
            className={cn(
              'h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 ease-studio',
              !formData.isAvailable
                ? 'bg-card text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200/80 dark:border-stone-800/80'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 stroke-[1.5]" />
            <span>Blackout date</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isAvailable: true })}
            className={cn(
              'h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 ease-studio',
              formData.isAvailable
                ? 'bg-card text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200/80 dark:border-stone-800/80'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
            <span>Open for bookings</span>
          </button>
        </div>
      </div>

      {/* When Blackout is selected: Info message */}
      {!formData.isAvailable ? (
        <div className="p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 stroke-[1.5]" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            All appointment bookings will be blocked for this entire date.
          </p>
        </div>
      ) : (
        /* When Open is selected: Show time inputs & slots */
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              className="tabular-nums font-mono"
            />
            <Input
              label="End time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
              className="tabular-nums font-mono"
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
            className="tabular-nums"
          />
        </div>
      )}

      {/* Note / Reason */}
      <Input
        label="Reason or note"
        placeholder="e.g. National Heroes Day, Salon renovation, Staff training"
        value={formData.note || ''}
        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        helperText="Visible internally to management"
      />

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
          className="h-9 px-4 rounded-md text-xs border-stone-200/80 dark:border-stone-800/80"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          isLoading={isLoading}
          className="h-9 px-4 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 ease-studio"
        >
          {initialData ? 'Save changes' : formData.isAvailable ? 'Save open date' : 'Add blackout date'}
        </Button>
      </div>
    </form>
  );
}
