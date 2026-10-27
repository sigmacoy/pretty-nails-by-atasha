import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function generateTimeSlots(startTime: string, endTime: string, intervalMinutes = 30): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
    currentMinutes += intervalMinutes;
  }

  return slots;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

export function getNextWeekendDates(count: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = new Date(today);
  // Move to next Saturday
  while (current.getDay() !== 6) {
    current.setDate(current.getDate() + 1);
  }

  while (dates.length < count * 2) { // *2 for Sat + Sun
    if (current >= today) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function getAvailableDates(availabilities: { date: Date; isAvailable: boolean }[], maxDays: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableDates: Date[] = [];
  const availabilityMap = new Map(
    availabilities.map(a => [a.date.toISOString().split('T')[0], a.isAvailable])
  );

  let current = new Date(today);
  current.setDate(current.getDate() + 1); // Start from tomorrow

  while (availableDates.length < maxDays && availableDates.length < 30) {
    if (isWeekend(current)) {
      const dateKey = current.toISOString().split('T')[0];
      if (availabilityMap.get(dateKey) !== false) {
        availableDates.push(new Date(current));
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return availableDates;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

export function getStampProgress(stamps: number, required: number = 9): number {
  return Math.min((stamps / required) * 100, 100);
}

export function getStampsNeeded(stamps: number, required: number = 9): number {
  return Math.max(required - stamps, 0);
}