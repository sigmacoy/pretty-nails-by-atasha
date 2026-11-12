'use client';

import { Search, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { BOOKING_STATUSES } from '@/types';

interface BookingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  statuses: string[];
  onStatusesChange: (value: string[]) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const statusOptions: { value: string; label: string }[] = BOOKING_STATUSES.map((status) => ({
  value: status,
  label: status === 'NO_SHOW' ? 'No show' : status.charAt(0) + status.slice(1).toLowerCase(),
}));

const sortOptions: SelectOption[] = [
  { value: 'appointmentDate,desc', label: 'Appointment date (newest first)' },
  { value: 'appointmentDate,asc', label: 'Appointment date (oldest first)' },
  { value: 'createdAt,desc', label: 'Created date (newest first)' },
  { value: 'createdAt,asc', label: 'Created date (oldest first)' },
  { value: 'totalPrice,desc', label: 'Total price (high to low)' },
  { value: 'totalPrice,asc', label: 'Total price (low to high)' },
];

export function BookingFilters({
  search,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  statuses,
  onStatusesChange,
  sortBy,
  onSortByChange,
  hasActiveFilters,
  onClearFilters,
}: BookingFiltersProps) {
  const toggleStatus = (statusValue: string) => {
    if (statuses.includes(statusValue)) {
      onStatusesChange(statuses.filter((s) => s !== statusValue));
    } else {
      onStatusesChange([...statuses, statusValue]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search and Date Range Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground stroke-[1.5]"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by client name, email, or booking ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-xs rounded-md border-border bg-background"
            aria-label="Search bookings"
          />
        </div>

        <div>
          <label htmlFor="start-date" className="sr-only">
            Start date
          </label>
          <div className="relative">
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-9 text-xs rounded-md border-border bg-background tabular-nums w-full"
              aria-label="Filter by start date"
              placeholder="Start date"
            />
          </div>
        </div>

        <div>
          <label htmlFor="end-date" className="sr-only">
            End date
          </label>
          <div className="relative">
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-9 text-xs rounded-md border-border bg-background tabular-nums w-full"
              aria-label="Filter by end date"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Status Chips and Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Status Multi-Select Toggle Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
          {statusOptions.map((option) => {
            const isSelected = statuses.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleStatus(option.value)}
                className={cn(
                  'h-7 px-2.5 text-[11px] font-medium rounded-sm border transition-colors select-none',
                  isSelected
                    ? 'bg-foreground text-background border-foreground dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            );
          })}
          {statuses.length > 0 && (
            <button
              type="button"
              onClick={() => onStatusesChange([])}
              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Reset status
            </button>
          )}
        </div>

        {/* Sort and Clear Row */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="w-48 sm:w-56">
            <Select
              id="sort-by"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              options={sortOptions}
              aria-label="Sort bookings"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-md"
              title="Reset all active filters"
            >
              <FilterX className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
