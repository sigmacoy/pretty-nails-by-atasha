'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { BookingDto, BookingStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PaymentQRCode } from '@/components/booking/PaymentQRCode';
import { formatDate, formatTime, formatPrice, isPast } from '@/lib/utils';
import { useMutation } from '@/hooks/useApi';
import { bookingsApi, paymentsApi } from '@/lib/api';
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
        <Badge variant="success" className="gap-1 rounded-[6px] text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
          Confirmed
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="warning" className="gap-1 rounded-[6px] text-xs font-medium">
          <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
          Pending
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="secondary" className="gap-1 rounded-[6px] text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
          Completed
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className="gap-1 rounded-[6px] text-xs font-medium">
          <XCircle className="h-3.5 w-3.5 stroke-[1.5]" />
          Cancelled
        </Badge>
      );
    case 'NO_SHOW':
    default:
      return (
        <Badge variant="secondary" className="gap-1 rounded-[6px] text-xs font-medium text-stone-600 dark:text-stone-400">
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
        <Badge variant="success" className="gap-1 rounded-[6px] text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
          Downpayment paid
        </Badge>
      );
    case 'PENDING_VERIFICATION':
      return (
        <Badge variant="warning" className="gap-1 rounded-[6px] text-xs font-medium">
          <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
          Verification pending
        </Badge>
      );
    case 'UNPAID':
    default:
      return (
        <Badge variant="destructive" className="gap-1 rounded-[6px] text-xs font-medium">
          <AlertCircle className="h-3.5 w-3.5 stroke-[1.5]" />
          Downpayment required
        </Badge>
      );
  }
}

function ServiceList({ services }: { services: BookingDto['services'] }) {
  return (
    <div className="space-y-2">
      {services.map((bookingService) => (
        <div key={bookingService.id} className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 min-w-0">
            {/* Delicate lacquer dot indicator instead of loud sparkle icon */}
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" aria-hidden="true" />
            <span className="font-medium text-stone-900 dark:text-stone-100 truncate">
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
          <span className="text-xs sm:text-sm font-medium tabular-nums text-stone-800 dark:text-stone-200 shrink-0 ml-4">
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
  const [paymentMethod, setPaymentMethod] = useState<'GCASH' | 'MAYA'>(
    (booking.payment?.method as 'GCASH' | 'MAYA') || 'GCASH'
  );
  const [reference, setReference] = useState(booking.payment?.reference || '');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const { isPending: isCancelling } = useMutation(
    (bookingId: string) => bookingsApi.cancelBooking(bookingId),
    {
      onSuccess: () => {
        toast.success('Booking cancelled successfully');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to cancel booking');
      },
    }
  );

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await onCancel(booking.id);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reference.trim();
    if (!trimmed) {
      toast.error('Please enter the transaction reference number');
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

      toast.success('Payment reference submitted. Salon staff will verify shortly.');
      setShowPaymentModal(false);
      if (onPaymentSubmitted) {
        onPaymentSubmitted();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to submit payment reference');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const downpaymentStatus = getDownpaymentStatus(booking);
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const isPastBooking = isPast(booking.appointmentDate);
  const canSubmitPayment = booking.status === 'PENDING' && downpaymentStatus !== 'PAID';

  const inspirationUrl =
    booking.inspirationImg ||
    (booking as unknown as { inspirationImage?: string }).inspirationImage ||
    null;

  return (
    <>
      <Card className="rounded-[12px] border border-stone-200/80 dark:border-stone-800/80 bg-card text-card-foreground shadow-card overflow-hidden transition-colors duration-150">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          {/* Header row: Thumbnail/Mark, Info, Status Badges, Total Fee */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Visual Moment: Inspiration Photo thumbnail or Studio Lacquer glyph */}
              {inspirationUrl ? (
                <button
                  type="button"
                  onClick={() => setShowInspirationModal(true)}
                  className="relative h-12 w-12 rounded-[8px] overflow-hidden border border-stone-200/90 dark:border-stone-700/90 bg-stone-100 dark:bg-stone-800 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="View inspiration design"
                  aria-label="View inspiration photo"
                >
                  <img
                    src={inspirationUrl}
                    alt="Inspiration reference design"
                    className="h-full w-full object-cover transition-opacity duration-150 group-hover:opacity-85"
                  />
                  <div className="absolute inset-0 bg-stone-950/25 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white">
                    <Eye className="h-4 w-4 stroke-[1.5]" />
                  </div>
                </button>
              ) : (
                <div
                  className="h-12 w-12 rounded-[8px] bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 text-stone-600 dark:text-stone-300"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-primary"
                  >
                    <path d="M10 2.5C10 2.5 5 9.2 5 13a5 5 0 0 0 10 0c0-3.8-5-10.5-5-10.5Z" />
                  </svg>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h3 className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 truncate">
                    {booking.services.length === 1
                      ? booking.services[0].service?.name || 'Salon service'
                      : `${booking.services.length} services`}
                  </h3>
                  <StatusBadge status={booking.status} />
                  <DownpaymentBadge status={downpaymentStatus} />
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                  Booked on {formatDate(booking.createdAt)}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-lg sm:text-xl font-medium tabular-nums text-stone-900 dark:text-stone-100">
                {formatPrice(booking.totalPrice)}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Total service fee</p>
            </div>
          </div>

          {/* Itemized Services Breakdown */}
          <div className="border-t border-b border-stone-200/60 dark:border-stone-800/60 py-3.5 my-3.5">
            <ServiceList services={booking.services} />
          </div>

          {/* Metadata strip & Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 stroke-[1.5] text-stone-400 dark:text-stone-500 shrink-0" />
                <span className="tabular-nums">{formatDate(booking.appointmentDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 stroke-[1.5] text-stone-400 dark:text-stone-500 shrink-0" />
                <span className="font-mono tabular-nums text-xs sm:text-sm">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4 stroke-[1.5] text-stone-400 dark:text-stone-500 shrink-0" />
                <span className="font-medium text-stone-800 dark:text-stone-200 tabular-nums">
                  Deposit: {formatPrice(booking.downpayment || 10000)}
                </span>
                {booking.payment?.reference && (
                  <span className="text-xs font-mono tabular-nums bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-[6px] border border-stone-200/70 dark:border-stone-700/70 text-stone-600 dark:text-stone-400">
                    Ref: {booking.payment.reference}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {inspirationUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInspirationModal(true)}
                  className="rounded-[8px] text-xs gap-1.5 text-stone-600 dark:text-stone-400"
                >
                  <ImageIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                  Inspiration photo
                </Button>
              )}

              {canSubmitPayment && (
                <Button
                  variant={downpaymentStatus === 'UNPAID' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                  className="rounded-[8px] text-xs gap-1.5 shrink-0"
                >
                  <CreditCard className="h-3.5 w-3.5 stroke-[1.5]" />
                  {downpaymentStatus === 'PENDING_VERIFICATION' ? 'Update reference' : 'Submit payment reference'}
                </Button>
              )}

              {canCancel && !isPastBooking && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  isLoading={isCancelling}
                  className="rounded-[8px] text-xs gap-1.5 shrink-0"
                >
                  <XCircle className="h-3.5 w-3.5 stroke-[1.5]" />
                  Cancel booking
                </Button>
              )}

              {isPastBooking && booking.status !== 'CANCELLED' && booking.status !== 'NO_SHOW' && (
                <Badge variant="secondary" className="rounded-[6px] text-xs shrink-0 gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                  Completed
                </Badge>
              )}

              {booking.status === 'CANCELLED' && (
                <Badge variant="destructive" className="rounded-[6px] text-xs shrink-0 gap-1 font-medium">
                  <XCircle className="h-3.5 w-3.5 stroke-[1.5]" />
                  Cancelled
                </Badge>
              )}

              {booking.status === 'NO_SHOW' && (
                <Badge variant="secondary" className="rounded-[6px] text-xs shrink-0 gap-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 stroke-[1.5]" />
                  No show
                </Badge>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-3.5 p-3 rounded-[8px] bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/60">
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                <span className="font-medium text-stone-700 dark:text-stone-300">Notes:</span> {booking.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Reference Submission Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Submit downpayment reference"
        description="Scan the salon QR code or send payment via GCash/Maya, then submit your transaction reference number below."
        size="lg"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
          {/* Method selector tabs: 36px height, 4px gap */}
          <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-900 rounded-[10px] border border-stone-200/80 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setPaymentMethod('GCASH')}
              className={`flex-1 h-9 text-xs sm:text-sm font-medium rounded-[7px] transition-colors duration-150 ${
                paymentMethod === 'GCASH'
                  ? 'bg-card text-foreground shadow-xs border border-stone-200/80 dark:border-stone-700/80'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              GCash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('MAYA')}
              className={`flex-1 h-9 text-xs sm:text-sm font-medium rounded-[7px] transition-colors duration-150 ${
                paymentMethod === 'MAYA'
                  ? 'bg-card text-foreground shadow-xs border border-stone-200/80 dark:border-stone-700/80'
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
              Transaction reference number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <FileText className="h-4 w-4 stroke-[1.5]" />
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. 1002 9384 1928 or Ref #"
                className="w-full pl-9 pr-4 h-10 border border-stone-200 dark:border-stone-700 rounded-[8px] bg-background text-foreground text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Our salon staff will verify this reference number to confirm your booking.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-200/80 dark:border-stone-800/80">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowPaymentModal(false)}
              disabled={isSubmittingPayment}
              className="rounded-[8px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="md"
              disabled={isSubmittingPayment || !reference.trim()}
              isLoading={isSubmittingPayment}
              className="rounded-[8px]"
            >
              {isSubmittingPayment ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit reference'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox / Full-View Inspiration Photo Modal */}
      {inspirationUrl && showInspirationModal && (
        <Modal
          isOpen={showInspirationModal}
          onClose={() => setShowInspirationModal(false)}
          title="Inspiration design"
          description="Customer-provided reference design for this appointment."
          size="lg"
        >
          <div className="space-y-4 pt-2">
            <div className="relative max-h-[65vh] flex items-center justify-center bg-stone-900/90 rounded-[10px] overflow-hidden p-2">
              <img
                src={inspirationUrl}
                alt="Inspiration reference design"
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-[6px]"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1">
              <span>Appointment date: {formatDate(booking.appointmentDate)}</span>
              <a
                href={inspirationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Open original image <ExternalLink className="h-3 w-3 stroke-[1.5]" />
              </a>
            </div>
          </div>
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
          className="rounded-[12px] border border-stone-200/80 dark:border-stone-800/80 bg-card p-4 sm:p-5 lg:p-6 animate-pulse space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-[8px] bg-stone-200/70 dark:bg-stone-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-stone-200/70 dark:bg-stone-800 rounded-[6px]" />
              <div className="h-3.5 w-32 bg-stone-200/50 dark:bg-stone-800/70 rounded-[4px]" />
            </div>
            <div className="h-6 w-20 bg-stone-200/70 dark:bg-stone-800 rounded-[6px] shrink-0" />
          </div>
          <div className="border-t border-b border-stone-200/60 dark:border-stone-800/60 py-3 space-y-2">
            <div className="h-3.5 w-full bg-stone-200/50 dark:bg-stone-800/60 rounded-[4px]" />
            <div className="h-3.5 w-2/3 bg-stone-200/50 dark:bg-stone-800/60 rounded-[4px]" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-48 bg-stone-200/60 dark:bg-stone-800/60 rounded-[4px]" />
            <div className="h-8 w-28 bg-stone-200/70 dark:bg-stone-800 rounded-[8px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default BookingCard;
