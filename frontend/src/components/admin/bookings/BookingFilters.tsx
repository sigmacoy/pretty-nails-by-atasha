'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, FilterX } from 'lucide-react';
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

const statusOptions: SelectOption[] = BOOKING_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
}));

const sortOptions: SelectOption[] = [
  { value: 'appointmentDate,desc', label: 'Date (Newest)' },
  { value: 'appointmentDate,asc', label: 'Date (Oldest)' },
  { value: 'createdAt,desc', label: 'Created (Newest)' },
  { value: 'createdAt,asc', label: 'Created (Oldest)' },
  { value: 'totalPrice,desc', label: 'Price (High to Low)' },
  { value: 'totalPrice,asc', label: 'Price (Low to High)' },
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
  const [statusSearch, setStatusSearch] = useState('');

  // We need to handle multi-select manually since native select doesn't support it well
  // For simplicity, we'll use a multi-select approach with checkboxes in a dropdown
  // But here we'll use a simpler approach with multiple select

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
      {/* Search and Date Range Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by customer name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Search bookings"
          />
        </div>
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Start Date
          </label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full"
            aria-label="Filter by start date"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            End Date
          </label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full"
            aria-label="Filter by end date"
          />
        </div>
      </div>

      {/* Status and Sort Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Status
          </label>
          <div className="relative">
            <select
              id="status-filter"
              multiple
              value={statuses}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                onStatusesChange(selected);
              }}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'min-h-[100px]'
              )}
              aria-label="Filter by status"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Sort By
          </label>
          <Select
            id="sort-by"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            options={sortOptions}
            placeholder="Sort by..."
            aria-label="Sort bookings"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <FilterX className="h-4 w-4" aria-hidden="true" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}