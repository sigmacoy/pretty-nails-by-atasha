import { BookingDto, BookingStatus, CustomerListDto, PaymentDto } from '@/types';
import api from '@/lib/api';

export type PaymentInfo = PaymentDto;

export interface BookingDetailsData extends BookingDto {
  paymentReference?: string;
  inspirationImage?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
  };
}

export type QuickFilterTab = 'ALL' | 'TODAY' | 'PENDING' | 'CONFIRMED' | 'COMPLETED';

/**
 * Executes a status transition using the dedicated admin endpoints or the fallback status endpoint
 */
export async function transitionBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  reason?: string
): Promise<BookingDto> {
  // Use dedicated admin endpoints when available
  if (newStatus === 'CONFIRMED') {
    try {
      const res = await api.put<BookingDto>(`/admin/bookings/${bookingId}/confirm`);
      return res.data;
    } catch {
      const res = await api.put<BookingDto>(`/bookings/${bookingId}/status`, { status: 'CONFIRMED' });
      return res.data;
    }
  }

  if (newStatus === 'COMPLETED') {
    try {
      const res = await api.put<BookingDto>(`/admin/bookings/${bookingId}/complete`);
      return res.data;
    } catch {
      const res = await api.put<BookingDto>(`/bookings/${bookingId}/status`, { status: 'COMPLETED' });
      return res.data;
    }
  }

  if (newStatus === 'CANCELLED') {
    try {
      const res = await api.put<BookingDto>(`/admin/bookings/${bookingId}/cancel`);
      return res.data;
    } catch {
      const res = await api.put<BookingDto>(`/bookings/${bookingId}/status`, {
        status: 'CANCELLED',
        reason: reason || undefined,
      });
      return res.data;
    }
  }

  // Generic status or NO_SHOW
  try {
    const res = await api.put<BookingDto>(`/admin/bookings/${bookingId}/status`, {
      status: newStatus,
      reason: reason || undefined,
    });
    return res.data;
  } catch {
    const res = await api.put<BookingDto>(`/bookings/${bookingId}/status`, {
      status: newStatus,
      reason: reason || undefined,
    });
    return res.data;
  }
}
