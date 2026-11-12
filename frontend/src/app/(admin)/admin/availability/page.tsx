'use client';

import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addDays } from 'date-fns';
import { useQuery, useMutation } from '@/hooks/useApi';
import { availabilityApi } from '@/lib/api';
import { AvailabilityDto, AvailabilityRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, ChevronLeft, ChevronRight, Trash2, Calendar, Clock, CheckCircle, XCircle, Edit } from 'lucide-react';

export default function AdminAvailabilityPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<AvailabilityDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: availData, isLoading: loading, refetch } = useQuery(
    () => availabilityApi.getAdmin(),
    { enabled: true }
  );

  const availabilities = availData?.data || [];

  const upsertMutation = useMutation(
    (data: AvailabilityRequest) => availabilityApi.upsert(data),
    {
      onSuccess: () => {
        toast.success(editingAvailability ? 'Availability updated' : 'Availability created');
        setModalOpen(false);
        setEditingAvailability(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => availabilityApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Availability deleted');
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

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
    const existing = getAvailabilityForDate(date);
    if (existing) {
      setEditingAvailability(existing);
    } else {
      setEditingAvailability(null);
      setSelectedDate(date);
    }
    setModalOpen(true);
  };

  const handleSubmit = (data: AvailabilityRequest) => {
    upsertMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this availability?')) {
      deleteMutation.mutate(id);
    }
  };

  const prevMonth = () => setCurrentMonth(addDays(currentMonth, -1));
  const nextMonth = () => setCurrentMonth(addDays(currentMonth, 1));

  return (
    <div className="container-padding section-padding">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Availability Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage available dates and time slots for bookings</p>
      </div>

      {/* Calendar */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Calendar View</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[150px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-0 border-b px-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-3">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0 p-4">
            {days.map((day) => {
              const isCurrentMonthDay = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const available = isDateAvailable(day);
              const hasData = hasAvailabilityData(day);
              const avail = getAvailabilityForDate(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square relative border rounded-lg p-2 transition-colors cursor-pointer
                    ${!isCurrentMonthDay ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-300' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}
                    ${today ? 'ring-2 ring-primary' : ''}
                    ${available && hasData ? 'bg-green-50 dark:bg-green-900/20' : ''}
                    ${!available && hasData ? 'bg-red-50 dark:bg-red-900/20' : ''}
                  `}
                >
                  <span className={!isCurrentMonthDay ? 'text-gray-400' : 'font-medium'}>
                    {format(day, 'd')}
                  </span>
                  {hasData && (
                    <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-center gap-1">
                        {available ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className={available ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                          {available ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      {avail && (
                        <div className="text-center text-gray-600 dark:text-gray-400">
                          {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700" />
              <span>Unavailable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" />
              <span>Not set</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-primary" />
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>All Availabilities</CardTitle>
          <Button onClick={() => { setEditingAvailability(null); setSelectedDate(new Date()); setModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Availability
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <Table
                columns={[
                  { key: 'date', header: 'Date' },
                  { key: 'status', header: 'Status' },
                  { key: 'time', header: 'Time' },
                  { key: 'slots', header: 'Max Slots' },
                  { key: 'actions', header: 'Actions' },
                ]}
                data={Array.from({ length: 5 }).map((_, i) => ({ id: `loading-${i}` }))}
                keyExtractor={(row) => row.id}
                isLoading={true}
              />
            </div>
          ) : availabilities.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No availabilities set</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Click on a date in the calendar or use the button above to add availability.</p>
              <Button onClick={() => { setEditingAvailability(null); setSelectedDate(new Date()); setModalOpen(true); }}>
                Add First Availability
              </Button>
            </div>
          ) : (
            <Table
              columns={[
                { key: 'date', header: 'Date', render: (row: AvailabilityDto) => formatDate(row.date) },
                { key: 'status', header: 'Status', render: (row: AvailabilityDto) => (
                  <Badge variant={row.isAvailable ? 'success' : 'destructive'}>
                    {row.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                )},
                { key: 'time', header: 'Hours', render: (row: AvailabilityDto) =>
                  `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`
                },
                { key: 'slots', header: 'Max Slots', render: (row: AvailabilityDto) => row.maxSlots },
                { key: 'note', header: 'Note', render: (row: AvailabilityDto) => row.note || '—' },
              ]}
              data={availabilities.sort((a, b) => a.date.localeCompare(b.date))}
              keyExtractor={(row) => row.id}
              renderRowActions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingAvailability(row); setModalOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAvailability(null); setSelectedDate(null); }}
        title={editingAvailability ? 'Edit Availability' : 'Add Availability'}
        size="lg"
      >
        <AvailabilityForm
          initialData={editingAvailability}
          defaultDate={selectedDate}
          onSubmit={handleSubmit}
          onClose={() => { setModalOpen(false); setEditingAvailability(null); setSelectedDate(null); }}
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
    date: initialData?.date || (defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    isAvailable: initialData?.isAvailable ?? true,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium">Available for booking</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Start Time" type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} required />
        <Input label="End Time" type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} required />
      </div>

      <Input label="Max Slots" type="number" value={formData.maxSlots} onChange={(e) => setFormData({...formData, maxSlots: parseInt(e.target.value) || 1})} min={1} max={20} required />

      <Input label="Note (Optional)" placeholder="Reason for closure, special hours, etc." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
