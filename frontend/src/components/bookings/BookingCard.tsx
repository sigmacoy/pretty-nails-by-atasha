'use client';

import { useState } from 'react';
import { Calendar, Clock, XCircle, CheckCircle2, AlertCircle, Sparkles, CreditCard, FileText, Loader2 } from 'lucide-react';
import { BookingDto, BookingStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PaymentQRCode } from '@/components/booking/PaymentQRCode';
import { formatDate, formatTime, formatPrice, getStatusColor, getStatusLabel, isPast } from '@/lib/utils';
import { useMutation } from '@/hooks/useApi';
import { bookingsApi, paymentsApi } from '@/lib/api';
import { toast } from 'sonner';

interface BookingCardProps {
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

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge className={getStatusColor(status)} variant="outline">
      {getStatusLabel(status)}
    </Badge>
  );
}

export function DownpaymentBadge({ status }: { status: DownpaymentStatus }) {
  switch (status) {
    case 'PAID':
      return (
        <Badge
          className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 gap-1 font-medium"
          variant="outline"
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          Downpayment: PAID
        </Badge>
      );
    case 'PENDING_VERIFICATION':
      return (
        <Badge
          className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 gap-1 font-medium"
          variant="outline"
        >
          <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          Downpayment: PENDING VERIFICATION
        </Badge>
      );
    case 'UNPAID':
    default:
      return (
        <Badge
          className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 gap-1 font-medium"
          variant="outline"
        >
          <AlertCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
          Downpayment: UNPAID
        </Badge>
      );
  }
}

function ServiceList({ services }: { services: BookingDto['services'] }) {
  return (
    <div className="space-y-2">
      {services.map((bookingService) => (
        <div key={bookingService.id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {bookingService.service?.name || 'Salon Service'}
            </span>
            {bookingService.variantId && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({bookingService.variantId})
              </span>
            )}
            {bookingService.quantity > 1 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                x{bookingService.quantity}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatPrice(bookingService.price)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BookingCard({ booking, onCancel, onPaymentSubmitted }: BookingCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'GCASH' | 'MAYA'>(
    (booking.payment?.method as 'GCASH' | 'MAYA') || 'GCASH'
  );
  const [reference, setReference] = useState(booking.payment?.reference || '');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const { mutate: cancelBooking, isPending: isCancelling } = useMutation(
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

      toast.success('Payment reference submitted! Awaiting salon verification.');
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

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {booking.services.length === 1
                      ? booking.services[0].service?.name || 'Salon Service'
                      : `${booking.services.length} Services`}
                  </h3>
                  <StatusBadge status={booking.status} />
                  <DownpaymentBadge status={downpaymentStatus} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created: {formatDate(booking.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(booking.totalPrice)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
          </div>

          <div className="border-t border-b py-4 my-4">
            <ServiceList services={booking.services} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.appointmentDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Downpayment: {formatPrice(booking.downpayment || 10000)}
                </span>
                {booking.payment?.reference && (
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                    Ref: {booking.payment.reference}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Payment Reference Submission Button */}
              {canSubmitPayment && (
                <Button
                  variant={downpaymentStatus === 'UNPAID' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                  className="gap-1.5 flex-shrink-0"
                >
                  <CreditCard className="h-4 w-4" />
                  {downpaymentStatus === 'PENDING_VERIFICATION' ? 'Update Payment Ref' : 'Submit Payment Ref'}
                </Button>
              )}

              {canCancel && !isPastBooking && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  isLoading={isCancelling}
                  className="flex-shrink-0"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}

              {isPastBooking && booking.status !== 'CANCELLED' && booking.status !== 'NO_SHOW' && (
                <Badge variant="success" className="flex-shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1.5" />
                  Completed
                </Badge>
              )}

              {booking.status === 'CANCELLED' && (
                <Badge variant="destructive" className="flex-shrink-0">
                  <XCircle className="h-3 w-3 mr-1.5" />
                  Cancelled
                </Badge>
              )}

              {booking.status === 'NO_SHOW' && (
                <Badge variant="warning" className="flex-shrink-0">
                  <AlertCircle className="h-3 w-3 mr-1.5" />
                  No Show
                </Badge>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Notes:</strong> {booking.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Reference Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Submit Downpayment Reference"
        description="Scan the salon QR code or send payment, then submit your transaction reference number below."
        size="lg"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
          {/* Method tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setPaymentMethod('GCASH')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                paymentMethod === 'GCASH'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              GCash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('MAYA')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                paymentMethod === 'MAYA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Maya
            </button>
          </div>

          {/* QR Code and Account Details */}
          <PaymentQRCode method={paymentMethod} amount={booking.downpayment || 10000} compact />

          {/* Reference Input */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Transaction Reference Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FileText className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. 1002 9384 1928 or Ref #"
                className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Our salon staff will verify this reference number to confirm your booking.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              disabled={isSubmittingPayment}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingPayment || !reference.trim()}
              isLoading={isSubmittingPayment}
            >
              {isSubmittingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Reference'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

interface BookingSkeletonProps {
  count?: number;
}

export function BookingSkeleton({ count = 3 }: BookingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
                <div className="h-8 w-24 bg-muted rounded flex-shrink-0" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
