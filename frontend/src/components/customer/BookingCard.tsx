'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  XCircle,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  FileText,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Receipt,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { BookingDto, BookingStatus, AvailabilitySlotDto } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PaymentQRCode } from '@/components/booking/PaymentQRCode';
import { formatDate, formatTime, formatPrice, isPast, isWithin24HoursManila, isPastManila } from '@/lib/utils';
import { useMutation } from '@/hooks/useApi';
import { bookingsApi, paymentsApi, availabilityApi } from '@/lib/api';
import { toast } from 'sonner';

export interface BookingCardProps {
  booking: BookingDto;
  onCancel: (bookingId: string) => Promise<void>;
  onPaymentSubmitted?: () => void;
}

export type DownpaymentStatus = 'PAID' | 'PENDING_VERIFICATION' | 'UNPAID';

export function getDownpaymentStatus(booking: BookingDto): DownpaymentStatus {
  if (booking.payment?.status === 'PAID') {
    return 'PAID';
  }
  if (booking.payment?.status === 'PENDING_VERIFICATION') {
    return 'PENDING_VERIFICATION';
  }
  if (booking.payment?.reference && booking.payment.reference.trim() !== '') {
    return 'PENDING_VERIFICATION';
  }
  return 'UNPAID';
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge variant="success" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3">
          <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
          Confirmed
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="warning" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
          <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
          Pending Studio Review
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="secondary" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80">
          <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
          Completed
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3">
          <XCircle className="h-3.5 w-3.5 stroke-[1.5]" />
          Cancelled
        </Badge>
      );
    case 'NO_SHOW':
    default:
      return (
        <Badge variant="secondary" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3 text-stone-600 dark:text-stone-400">
          <AlertCircle className="h-3.5 w-3.5 stroke-[1.5]" />
          No show
        </Badge>
      );
  }
}

export function DownpaymentBadge({ status }: { status: DownpaymentStatus }) {
  switch (status) {
    case 'PAID':
      return (
        <Badge variant="success" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3">
          <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
          Downpayment paid
        </Badge>
      );
    case 'PENDING_VERIFICATION':
      return (
        <Badge variant="warning" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900">
          <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
          Deposit review pending
        </Badge>
      );
    case 'UNPAID':
    default:
      return (
        <Badge variant="destructive" className="gap-1.5 rounded-full text-xs font-medium py-1 px-3">
          <AlertCircle className="h-3.5 w-3.5 stroke-[1.5]" />
          Downpayment required
        </Badge>
      );
  }
}

function ServiceList({ services }: { services: BookingDto['services'] }) {
  return (
    <div className="space-y-2.5 font-sans">
      {services.map((bookingService) => (
        <div key={bookingService.id} className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-800 dark:bg-rose-300 shrink-0" aria-hidden="true" />
            <span className="font-medium text-stone-900 dark:text-rose-50 truncate">
              {bookingService.service?.name || 'Salon service'}
            </span>
            {bookingService.variantId && (
              <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0">
                ({bookingService.variantId})
              </span>
            )}
            {bookingService.quantity > 1 && (
              <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400 shrink-0">
                x{bookingService.quantity}
              </span>
            )}
          </div>
          <span className="text-xs sm:text-sm font-serif font-medium tabular-nums text-stone-900 dark:text-rose-100 shrink-0 ml-4">
            {formatPrice(bookingService.price)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BookingCard({ booking, onCancel, onPaymentSubmitted }: BookingCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'GCASH' | 'MAYA'>(
    (booking.payment?.method as 'GCASH' | 'MAYA') || 'GCASH'
  );
  const [reference, setReference] = useState(booking.payment?.reference || '');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlotDto[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const { isPending: isCancelling } = useMutation(
    (bookingId: string) => bookingsApi.cancelBooking(bookingId),
    {
      onSuccess: () => {
        toast.success('Appointment reservation cancelled and slot released.');
      },
      onError: (error) => {
        toast.error(error.message || 'Unable to cancel appointment reservation. Please contact the studio.');
      },
    }
  );

  const { mutate: rescheduleBooking, isPending: isRescheduling } = useMutation(
    ({ bookingId, data }: { bookingId: string; data: { appointmentDate: string; startTime: string; endTime?: string } }) =>
      bookingsApi.rescheduleBooking(bookingId, data),
    {
      onSuccess: () => {
        toast.success('Appointment rescheduled successfully.');
        setShowRescheduleModal(false);
        if (onPaymentSubmitted) {
          onPaymentSubmitted();
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Unable to reschedule appointment. Please try again.');
      },
    }
  );

  // Fetch available slots when reschedule date changes
  useEffect(() => {
    if (rescheduleDate) {
      setIsLoadingSlots(true);
      availabilityApi.getSlots(rescheduleDate)
        .then((response) => {
          setAvailableSlots(response.data || []);
        })
        .catch(() => {
          setAvailableSlots([]);
        })
        .finally(() => {
          setIsLoadingSlots(false);
        });
    } else {
      setAvailableSlots([]);
    }
  }, [rescheduleDate]);

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await onCancel(booking.id);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reference.trim();
    if (!trimmed) {
      toast.error('Please provide the GCash or Maya deposit reference number.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await paymentsApi.create({
        bookingId: booking.id,
        amount: booking.downpayment || 10000,
        method: paymentMethod,
        reference: trimmed,
      });

      toast.success('Deposit submitted for studio review.');
      setShowPaymentModal(false);
      if (onPaymentSubmitted) {
        onPaymentSubmitted();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Unable to submit deposit reference. Please verify and retry.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const downpaymentStatus = getDownpaymentStatus(booking);
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const isPastBooking = isPastManila(booking.appointmentDate, booking.startTime);
  const within24Hours = isWithin24HoursManila(booking.appointmentDate, booking.startTime);
  const canSubmitPayment = booking.status === 'PENDING' && downpaymentStatus !== 'PAID';
  const canReschedule = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

  const inspirationUrl =
    booking.inspirationImg ||
    (booking as unknown as { inspirationImage?: string }).inspirationImage ||
    null;

  return (
    <>
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 shadow-card overflow-hidden transition-colors duration-150 p-5 sm:p-6 lg:p-7 backdrop-blur-sm">
        {/* Header row: Thumbnail, Service Name, Status Badges, Total Fee */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            {inspirationUrl ? (
              <button
                type="button"
                onClick={() => setShowInspirationModal(true)}
                className="relative h-14 w-14 rounded-xl overflow-hidden border border-rose-200/80 dark:border-rose-950/60 bg-stone-100 dark:bg-stone-800 shrink-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-800/30 focus-visible:border-rose-800/40"
                title="View inspiration reference"
                aria-label="View inspiration photo"
              >
                <img
                  src={inspirationUrl}
                  alt="Inspiration reference design"
                  className="h-full w-full object-cover transition-opacity duration-150 group-hover:opacity-85"
                />
                <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white">
                  <Eye className="h-4 w-4 stroke-[1.5]" />
                </div>
              </button>
            ) : (
              <div
                className="h-14 w-14 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-950/60 flex items-center justify-center shrink-0 text-rose-800 dark:text-rose-300"
                aria-hidden="true"
              >
                <span className="font-serif italic font-normal text-lg">PN</span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-lg sm:text-xl font-serif text-stone-900 dark:text-rose-50 truncate">
                  {booking.services.length === 1
                    ? booking.services[0].service?.name || 'Salon service'
                    : `${booking.services.length} services`}
                </h3>
                <StatusBadge status={booking.status} />
                <DownpaymentBadge status={downpaymentStatus} />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums font-sans">
                Booked on {formatDate(booking.createdAt)}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-xl sm:text-2xl font-serif font-medium tabular-nums text-stone-900 dark:text-rose-50">
              {formatPrice(booking.totalPrice)}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">Total service fee</p>
          </div>
        </div>

        {/* Itemized Services Breakdown */}
        <div className="border-t border-b border-rose-200/70 dark:border-rose-950/60 py-4 my-4">
          <ServiceList services={booking.services} />
        </div>

        {/* Metadata Strip & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300 shrink-0" />
              <span className="tabular-nums">{formatDate(booking.appointmentDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300 shrink-0" />
              <span className="font-mono tabular-nums text-xs sm:text-sm">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300 shrink-0" />
              <span className="font-medium text-stone-800 dark:text-stone-200 tabular-nums">
                Deposit: {formatPrice(booking.downpayment || 10000)}
              </span>
              {booking.payment?.reference && (
                <span className="text-xs font-mono tabular-nums bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200/80 dark:border-rose-950/60 text-rose-900 dark:text-rose-200">
                  Ref: {booking.payment.reference}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {inspirationUrl && (
              <button
                type="button"
                onClick={() => setShowInspirationModal(true)}
                className="inline-flex items-center justify-center h-10 px-4 rounded-full border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-200 text-xs font-medium gap-1.5 transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                Inspiration
              </button>
            )}

            {canSubmitPayment && (
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium gap-1.5 shadow-xs transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5 stroke-[1.5]" />
                {downpaymentStatus === 'PENDING_VERIFICATION' ? 'Update Reference' : 'Submit Deposit Reference'}
              </button>
            )}

            {canCancel && !isPastBooking && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling || within24Hours}
                className="inline-flex items-center justify-center h-10 px-5 rounded-full border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium gap-1.5 transition-colors disabled:opacity-50"
                title={within24Hours ? 'Cancellation requires at least 24 hours notice' : ''}
              >
                <XCircle className="h-3.5 w-3.5 stroke-[1.5]" />
                Cancel Session
              </button>
            )}

            {canReschedule && !isPastBooking && (
              <button
                type="button"
                onClick={() => {
                  // Pre-fill with current date and time
                  setRescheduleDate(booking.appointmentDate.split('T')[0]);
                  setRescheduleTime(booking.startTime);
                  setShowRescheduleModal(true);
                }}
                disabled={isRescheduling || within24Hours}
                className="inline-flex items-center justify-center h-10 px-5 rounded-full border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium gap-1.5 transition-colors disabled:opacity-50"
                title={within24Hours ? 'Rescheduling requires at least 24 hours notice' : ''}
              >
                <RotateCcw className="h-3.5 w-3.5 stroke-[1.5]" />
                Reschedule
              </button>
            )}

            {within24Hours && !isPastBooking && (canCancel || canReschedule) && (
              <span className="inline-flex items-center h-10 px-4 rounded-full bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200 font-medium gap-1.5 border border-amber-200 dark:border-amber-900">
                <AlertCircle className="h-3.5 w-3.5 stroke-[1.5]" />
                Within 24 hours - changes not allowed
              </span>
            )}

            {isPastBooking && booking.status !== 'CANCELLED' && booking.status !== 'NO_SHOW' && (
              <span className="inline-flex items-center h-10 px-4 rounded-full bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 font-medium gap-1.5 border border-rose-200/60 dark:border-rose-950/50">
                <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Manual Review Clarification & Booking Notes */}
        <div className="mt-4 pt-3.5 border-t border-rose-200/60 dark:border-rose-950/50 text-xs font-sans text-stone-500 dark:text-stone-400 space-y-1.5">
          <p>
            <span className="font-medium text-rose-900 dark:text-rose-300">Studio deposit policy:</span> All reservations require a deposit via GCash or Maya. Studio staff manually reviews and verifies payment references before confirming your studio appointment slot.
          </p>
          {booking.notes && (
            <p>
              <span className="font-medium text-stone-700 dark:text-stone-300">Client notes:</span> {booking.notes}
            </p>
          )}
        </div>
      </div>

      {/* Payment Reference Submission Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Submit Deposit Reference"
        description="Scan the studio QR code or send payment via GCash or Maya, then enter your transaction reference number below."
        size="lg"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2 font-sans">
          {/* Method selector tabs: 36px height, 4px gap */}
          <div className="flex gap-1.5 p-1 bg-rose-50/80 dark:bg-stone-900 rounded-full border border-rose-200/80 dark:border-rose-950/60">
            <button
              type="button"
              onClick={() => setPaymentMethod('GCASH')}
              className={`flex-1 h-9 text-xs sm:text-sm font-medium rounded-full transition-colors duration-150 ${
                paymentMethod === 'GCASH'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              GCash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('MAYA')}
              className={`flex-1 h-9 text-xs sm:text-sm font-medium rounded-full transition-colors duration-150 ${
                paymentMethod === 'MAYA'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Maya
            </button>
          </div>

          {/* QR Code and Account Details */}
          <PaymentQRCode method={paymentMethod} amount={booking.downpayment || 10000} compact />

          {/* Reference Input */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100">
              Transaction reference number <span className="text-rose-700 dark:text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <FileText className="h-4 w-4 stroke-[1.5]" />
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. 1002 9384 1928 or Ref #"
                className="w-full pl-10 pr-4 h-11 border border-rose-200/80 dark:border-rose-950/60 rounded-xl bg-white dark:bg-stone-900 text-foreground text-sm font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Our studio staff manually reviews this reference number to confirm your private appointment slot.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-rose-200/80 dark:border-rose-950/60">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowPaymentModal(false)}
              disabled={isSubmittingPayment}
              className="rounded-full px-5"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isSubmittingPayment || !reference.trim()}
              className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-xs sm:text-sm transition-colors"
            >
              {isSubmittingPayment ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Deposit Reference'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lightbox / Full-View Inspiration Photo Modal */}
      {inspirationUrl && showInspirationModal && (
        <Modal
          isOpen={showInspirationModal}
          onClose={() => setShowInspirationModal(false)}
          title="Inspiration Design"
          description="Customer-provided reference design for this appointment."
          size="lg"
        >
          <div className="space-y-4 pt-2 font-sans">
            <div className="relative max-h-[65vh] flex items-center justify-center bg-stone-900/90 rounded-2xl overflow-hidden p-2 border border-rose-200/60 dark:border-rose-950/50">
              <img
                src={inspirationUrl}
                alt="Inspiration reference design"
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1">
              <span>Appointment date: {formatDate(booking.appointmentDate)}</span>
              <a
                href={inspirationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-rose-800 dark:text-rose-300 hover:underline"
              >
                Open original image <ExternalLink className="h-3 w-3 stroke-[1.5]" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <Modal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          title="Reschedule Appointment"
          description="Select a new date and time for your appointment. Rescheduling requires at least 24 hours notice before the current appointment."
          size="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (rescheduleDate && rescheduleTime) {
                // Calculate end time (default 3 hours = 180 minutes)
                const [hours, minutes] = rescheduleTime.split(':').map(Number);
                const startDate = new Date();
                startDate.setHours(hours, minutes, 0, 0);
                const endDate = new Date(startDate.getTime() + 180 * 60 * 1000);
                const endTime = endDate.toTimeString().slice(0, 5);
                rescheduleBooking({
                  bookingId: booking.id,
                  data: { appointmentDate: rescheduleDate, startTime: rescheduleTime, endTime },
                });
              }
            }}
            className="space-y-4 pt-2 font-sans"
          >
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100">
                New date <span className="text-rose-700 dark:text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  setRescheduleTime('');
                  setAvailableSlots([]);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-11 pl-4 pr-4 border border-rose-200/80 dark:border-rose-950/60 rounded-xl bg-white dark:bg-stone-900 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100">
                New time <span className="text-rose-700 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Clock className="h-4 w-4 stroke-[1.5]" />
                </div>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  disabled={!rescheduleDate || isLoadingSlots}
                  className="w-full h-11 pl-10 pr-4 border border-rose-200/80 dark:border-rose-950/60 rounded-xl bg-white dark:bg-stone-900 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40 disabled:opacity-50"
                  required
                >
                  <option value="">Select a time slot</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
              </div>
              {isLoadingSlots && (
                <p className="text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading available slots...
                </p>
              )}
              {availableSlots.length === 0 && rescheduleDate && !isLoadingSlots && (
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  No available slots for this date. Please select another date.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-rose-200/80 dark:border-rose-950/60">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                  setRescheduleTime('');
                  setAvailableSlots([]);
                }}
                disabled={isRescheduling}
                className="rounded-full px-5"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={isRescheduling || !rescheduleDate || !rescheduleTime}
                className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-rose-900 hover:bg-rose-950 disabled:opacity-60 text-white font-medium text-xs sm:text-sm transition-colors"
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule Appointment'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export interface BookingSkeletonProps {
  count?: number;
}

export function BookingSkeleton({ count = 3 }: BookingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-5 sm:p-6 lg:p-7 animate-pulse space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-stone-200/70 dark:bg-stone-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-stone-200/70 dark:bg-stone-800 rounded-md" />
              <div className="h-3.5 w-32 bg-stone-200/50 dark:bg-stone-800/70 rounded-md" />
            </div>
            <div className="h-6 w-20 bg-stone-200/70 dark:bg-stone-800 rounded-full shrink-0" />
          </div>
          <div className="border-t border-b border-rose-200/60 dark:border-rose-950/60 py-3 space-y-2">
            <div className="h-3.5 w-full bg-stone-200/50 dark:bg-stone-800/60 rounded-md" />
            <div className="h-3.5 w-2/3 bg-stone-200/50 dark:bg-stone-800/60 rounded-md" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-48 bg-stone-200/60 dark:bg-stone-800/60 rounded-md" />
            <div className="h-9 w-28 bg-stone-200/70 dark:bg-stone-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default BookingCard;
