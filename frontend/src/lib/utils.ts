import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

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
    const parts = timeString.split(':');
    if (parts.length !== 2) return timeString;
    const hour = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hour) || !minutes) return timeString;
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
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  return crypto.randomUUID();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): { (...args: Parameters<T>): void; cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
  };
  return debounced;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isToday(dateString: string): boolean {
  const today = new Date();
  const manilaToday = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const date = parseISO(dateString);
  if (!isValid(date)) return false;
  return date.toDateString() === manilaToday.toDateString();
}

export function isPast(dateString: string): boolean {
  const today = new Date();
  const manilaToday = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  manilaToday.setHours(0, 0, 0, 0);
  const date = parseISO(dateString);
  if (!isValid(date)) return false;
  return date < manilaToday;
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
 * Parses a Manila date/time string into a UTC Date object.
 * Manila is UTC+8 with no DST.
 * Handles both "YYYY-MM-DD" and ISO UTC timestamp formats for appointmentDate.
 * @param appointmentDate - Date string in Manila time (e.g., "2025-12-25") or ISO string
 * @param startTime - Time string in HH:mm format (e.g., "10:00") in Manila time
 * @returns UTC Date object representing the appointment instant
 * @throws Error if inputs are invalid
 */
function parseManilaDateTime(appointmentDate: string, startTime: string): Date {
  const timeParts = startTime.split(':').map(Number);
  if (timeParts.length !== 2 || timeParts.some(isNaN)) {
    throw new Error(`Invalid startTime format: ${startTime}`);
  }
  const [hours, minutes] = timeParts;

  // Handle both "YYYY-MM-DD" and ISO timestamp formats
  let datePart = appointmentDate;
  if (appointmentDate.includes('T')) {
    // ISO timestamp - extract date part in Manila timezone
    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid appointmentDate format: ${appointmentDate}`);
    }
    // Convert to Manila timezone for date parts
    const manilaDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const year = manilaDate.getFullYear();
    const month = manilaDate.getMonth() + 1;
    const day = manilaDate.getDate();
    datePart = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  const dateParts = datePart.split('-').map(Number);
  if (dateParts.length !== 3 || dateParts.some(isNaN)) {
    throw new Error(`Invalid appointmentDate format: ${appointmentDate}`);
  }
  const [year, month, day] = dateParts;

  // Manila time = UTC+8, so UTC time = Manila time - 8 hours
  return new Date(Date.UTC(year, month - 1, day, hours - 8, minutes, 0, 0));
}

/**
 * Checks if a booking appointment is within 24 hours from now in Manila timezone (UTC+8).
 * Manila does not observe DST, so offset is always +8 hours.
 * @param appointmentDate - Date string in Manila time (e.g., "2025-12-25") or ISO string
 * @param startTime - Time string in HH:mm format (e.g., "10:00") in Manila time
 * @returns true if the appointment is within 24 hours (excluding past appointments)
 */
export function isWithin24HoursManila(appointmentDate: string, startTime: string): boolean {
  try {
    const appointmentDateObj = parseManilaDateTime(appointmentDate, startTime);
    const now = new Date();
    const diffMs = appointmentDateObj.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  } catch {
    return false;
  }
}

/**
 * Checks if a booking appointment is in the past in Manila timezone.
 * @param appointmentDate - Date string in Manila time (e.g., "2025-12-25") or ISO string
 * @param startTime - Time string in HH:mm format (e.g., "10:00") in Manila time
 */
export function isPastManila(appointmentDate: string, startTime: string): boolean {
  try {
    const appointmentDateObj = parseManilaDateTime(appointmentDate, startTime);
    const now = new Date();
    return appointmentDateObj < now;
  } catch {
    return false;
  }
}

/**
 * Computes today's date string in Manila timezone (YYYY-MM-DD).
 */
export function getManilaTodayString(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

/**
 * Computes a max date string in Manila timezone (YYYY-MM-DD) for booking limits.
 */
export function getManilaMaxDateString(daysAhead: number = 90): string {
  const now = new Date();
  const manilaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  manilaNow.setDate(manilaNow.getDate() + daysAhead);
  return manilaNow.toISOString().split('T')[0];
}

/**
 * Calculates end time from start time and duration in minutes.
 * Does NOT wrap around midnight (returns time that may exceed 23:59 to indicate next day).
 * @param startTime - Time string in HH:mm format
 * @param durationMinutes - Duration in minutes
 * @returns End time string in HH:mm format (hours may exceed 23)
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return startTime;
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMins = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

/**
 * Validates that a redirect URL is safe (same-origin, no protocol, no backslashes).
 * Prevents open redirect vulnerabilities.
 * @param redirectTo - The redirect URL to validate
 * @returns true if the redirect is safe, false otherwise
 */
export function isSafeRedirect(redirectTo: string): boolean {
  return redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.startsWith('/\\');
}

/**
 * Validates that an image URL is safe for rendering.
 * Only allows https URLs and data URLs (for previews).
 * @param url - The URL to validate
 * @returns true if the URL is safe for image rendering
 */
export function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'data:';
  } catch {
    return false;
  }
}

/**
 * Validates that an external URL is safe for navigation.
 * Only allows https URLs.
 * @param url - The URL to validate
 * @returns true if the URL is safe for external navigation
 */
export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}