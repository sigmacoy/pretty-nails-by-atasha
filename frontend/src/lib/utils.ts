import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid, addHours } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toFixed(2)}`;
}

export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    });
  } catch {
    return 'Invalid date';
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

export function formatTime(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

export function formatDateTime(dateString: string, timeString: string): string {
  return `${formatDateShort(dateString)} at ${formatTime(timeString)}`;
}

export function formatMemberCardId(id: string): string {
  if (!id) return '';
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `PNA-${clean.slice(0, 8)}`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'NO_SHOW':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'GEL':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200';
    case 'EXTENSION':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
    case 'PEDICURE':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
    case 'ADDON':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'NAIL_ART':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getVariantLabel(variant: string): string {
  switch (variant) {
    case 'SMALL':
      return 'Short';
    case 'MEDIUM':
      return 'Medium';
    case 'LONG':
      return 'Long';
    default:
      return variant;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isToday(dateString: string): boolean {
  const today = new Date();
  const date = parseISO(dateString);
  return date.toDateString() === today.toDateString();
}

export function isPast(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseISO(dateString);
  return date < today;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

/**
 * Checks if a booking appointment is within 24 hours from now in Manila timezone (UTC+8).
 * Manila does not observe DST, so offset is always +8 hours.
 * @param appointmentDate - ISO date string (e.g., "2025-12-25T00:00:00.000Z" or "2025-12-25")
 * @param startTime - Time string in HH:mm format (e.g., "10:00")
 * @returns true if the appointment is within 24 hours (including past appointments)
 */
export function isWithin24HoursManila(appointmentDate: string, startTime: string): boolean {
  // Parse the appointment date and time in Manila timezone
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Create a date object in Manila timezone (UTC+8)
  const appointmentDateObj = parseISO(appointmentDate);
  // Set the time components
  appointmentDateObj.setHours(hours, minutes, 0, 0);
  
  // Get current time in Manila (UTC+8)
  const now = new Date();
  // Convert to Manila time: get UTC time and add 8 hours
  const manilaNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
  
  // Calculate the difference in milliseconds
  const diffMs = appointmentDateObj.getTime() - manilaNow.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Within 24 hours means diffHours <= 24 (and not negative past appointments)
  // We consider it "within 24 hours" if the appointment is less than 24 hours away
  return diffHours <= 24 && diffHours > 0;
}

/**
 * Checks if a booking appointment is in the past in Manila timezone.
 */
export function isPastManila(appointmentDate: string, startTime: string): boolean {
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const appointmentDateObj = parseISO(appointmentDate);
  appointmentDateObj.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  const manilaNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
  
  return appointmentDateObj < manilaNow;
}