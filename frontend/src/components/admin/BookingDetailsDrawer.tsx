'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Mail,
  Phone,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Tag,
  ShieldCheck,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { BookingStatus, CustomerListDto } from '@/types';
import { BookingDetailsData, transitionBookingStatus } from './bookings/types';
import {
  formatPrice,
  formatDate,
  formatTime,
  getInitials,
  cn,
} from '@/lib/utils';
import { toast } from 'sonner';

interface BookingDetailsDrawerProps {
  booking: BookingDetailsData | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (bookingId: string, newStatus: BookingStatus) => void;
  customer?: CustomerListDto | null;
  onTriggerCompletionQR?: (bookingId: string) => void;
}

function getRestrainedStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
    case 'COMPLETED':
      return 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-850 dark:text-stone-300 dark:border-stone-700/60';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
    case 'NO_SHOW':
      return 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-850 dark:text-stone-400 dark:border-stone-800';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

function getSentenceStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No show';
    default:
      return status;
  }
}

export function BookingDetailsDrawer({
  booking,
  isOpen,
  onClose,
  onStatusUpdated,
  customer,
  onTriggerCompletionQR,
}: BookingDetailsDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Cancellation / No-Show modal state
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'CANCELLED' | 'NO_SHOW' | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isPhotoModalOpen) {
          setIsPhotoModalOpen(false);
        } else if (reasonModalOpen) {
          setReasonModalOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isPhotoModalOpen, reasonModalOpen, onClose]);

  if (!isOpen || !booking) return null;

  // Resolve customer details with fallback cascade
  const customerName =
    customer?.name ||
    booking.customerName ||
    booking.user?.name ||
    `Customer #${booking.userId.slice(-6)}`;

  const customerEmail =
    customer?.email ||
    booking.customerEmail ||
    booking.user?.email ||
    'No email provided';

  const customerPhone =
    customer?.phone ||
    booking.customerPhone ||
    booking.user?.phone ||
    'No phone number';

  const customerNotes = booking.notes?.trim() || null;

  // Resolve inspiration image URL
  const inspirationUrl = booking.inspirationImg || booking.inspirationImage || null;

  // Resolve payment details
  const payment = booking.payment;
  const paymentMethod = payment?.method || (booking as unknown as Record<string, unknown>).paymentMethod || 'GCASH';
  const paymentRef = payment?.reference || booking.paymentReference || null;
  const paymentStatus = payment?.status || (paymentRef ? 'PENDING_VERIFICATION' : 'UNPAID');
  const downpaymentAmount = booking.downpayment || payment?.amount || 10000;
  const remainingBalance = Math.max(0, booking.totalPrice - downpaymentAmount);

  // Copy reference number to clipboard
  const handleCopyRef = async () => {
    if (!paymentRef) return;
    try {
      await navigator.clipboard.writeText(paymentRef);
      setCopiedRef(true);
      toast.success('Reference number copied to clipboard');
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      toast.error('Failed to copy reference number');
    }
  };

  // Perform status transition
  const handleTransition = async (newStatus: BookingStatus, reason?: string) => {
    setIsUpdating(true);
    try {
      await transitionBookingStatus(booking.id, newStatus, reason);
      toast.success(`Booking status updated to ${getSentenceStatusLabel(newStatus)}`);
      onStatusUpdated?.(booking.id, newStatus);

      // If marked COMPLETED and completion QR callback is provided, trigger it
      if (newStatus === 'COMPLETED' && onTriggerCompletionQR) {
        onTriggerCompletionQR(booking.id);
      }

      // Close reason modal if open
      setReasonModalOpen(false);
      setPendingAction(null);
      setSelectedReason('');
      setCustomReason('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || 'Failed to update booking status';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open reason modal for Cancel or No-Show
  const openReasonModal = (action: 'CANCELLED' | 'NO_SHOW') => {
    setPendingAction(action);
    setSelectedReason('');
    setCustomReason('');
    setReasonModalOpen(true);
  };

  const handleConfirmReason = () => {
    if (!pendingAction) return;
    const finalReason = customReason.trim()
      ? selectedReason
        ? `${selectedReason}: ${customReason.trim()}`
        : customReason.trim()
      : selectedReason || `${getSentenceStatusLabel(pendingAction)} by admin`;

    handleTransition(pendingAction, finalReason);
  };

  const cancelReasons = [
    'Customer requested cancellation',
    'Scheduling conflict / Stylist unavailable',
    'Downpayment not received / Invalid reference',
    'Customer unresponsive',
    'Salon emergency closure',
    'Other reason',
  ];

  const noShowReasons = [
    'Customer did not arrive within 15-minute grace period',
    'Customer unreachable via phone or email',
    'Customer arrived too late to complete service',
    'Refused service on arrival',
    'Other reason',
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background shadow-2xl flex flex-col',
          'transform transition-transform duration-200 ease-out',
          'border-l border-border'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="drawer-title" className="text-base font-semibold text-foreground">
                  Booking details
                </h2>
                <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border">
                  #{booking.id.slice(-8)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                Created {formatDate(booking.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-[11px] font-medium py-0.5 px-2 rounded-sm border', getRestrainedStatusBadge(booking.status))}
            >
              {getSentenceStatusLabel(booking.status)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Close details"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </Button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Section 1: Customer Profile */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center font-medium text-sm">
                  {getInitials(customerName)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{customerName}</h3>
                  <p className="text-xs text-muted-foreground font-mono tabular-nums">
                    Client ID: {booking.userId.slice(0, 10)}...
                  </p>
                </div>
              </div>
              {customer && customer.loyaltyStamps !== undefined && (
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="gap-1 text-[11px] rounded-sm bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 tabular-nums"
                  >
                    <Sparkles className="h-3 w-3 stroke-[1.5]" />
                    {customer.loyaltyStamps} stamps
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground/80 stroke-[1.5]" />
                {customerEmail !== 'No email provided' ? (
                  <a
                    href={`mailto:${customerEmail}`}
                    className="text-foreground hover:text-primary transition-colors truncate"
                  >
                    {customerEmail}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{customerEmail}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground/80 stroke-[1.5]" />
                {customerPhone !== 'No phone number' ? (
                  <a
                    href={`tel:${customerPhone}`}
                    className="text-foreground hover:text-primary transition-colors tabular-nums"
                  >
                    {customerPhone}
                  </a>
                ) : (
                  <span className="text-muted-foreground tabular-nums">{customerPhone}</span>
                )}
              </div>
            </div>

            {customerNotes && (
              <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                <p className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                  <FileText className="h-3.5 w-3.5 text-primary stroke-[1.5]" /> Customer notes:
                </p>
                <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border/40 whitespace-pre-line italic">
                  "{customerNotes}"
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Appointment Schedule */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary stroke-[1.5]" /> Appointment schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/30 p-3 rounded-md border border-border/40">
                <span className="text-[11px] text-muted-foreground block mb-0.5">Date</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatDate(booking.appointmentDate)}
                </span>
              </div>
              <div className="bg-muted/30 p-3 rounded-md border border-border/40">
                <span className="text-[11px] text-muted-foreground block mb-0.5">Time window</span>
                <span className="font-medium text-foreground flex items-center gap-1.5 tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground stroke-[1.5]" />
                  {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Services & Price Breakdown */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-primary stroke-[1.5]" /> Selected services ({booking.services?.length || 0})
              </h4>
            </div>

            <div className="divide-y divide-border/60">
              {booking.services && booking.services.length > 0 ? (
                booking.services.map((svc, index) => (
                  <div key={svc.id || index} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {svc.service?.name || svc.serviceId}
                        </span>
                        {svc.service?.category && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 rounded-sm font-normal text-muted-foreground border-border"
                          >
                            {svc.service.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                        {svc.variantId && <span>Variant: {svc.variantId}</span>}
                        <span>Qty: {svc.quantity || 1}</span>
                        {svc.service?.duration && <span>• {svc.service.duration} mins</span>}
                      </div>
                    </div>
                    <span className="font-medium text-foreground shrink-0 tabular-nums">
                      {formatPrice(svc.price * (svc.quantity || 1))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2">No services recorded</p>
              )}
            </div>

            {/* Price Summary Breakdown */}
            <div className="pt-3 border-t border-border/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Services subtotal:</span>
                <span className="tabular-nums">{formatPrice(booking.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-amber-800 dark:text-amber-300">
                <span>Downpayment required:</span>
                <span className="tabular-nums font-medium">{formatPrice(downpaymentAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Remaining balance at counter:</span>
                <span className="font-medium text-foreground tabular-nums">{formatPrice(remainingBalance)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-2 border-t border-border/60 text-foreground">
                <span>Total amount:</span>
                <span className="tabular-nums text-foreground">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Payment & Downpayment Verification */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary stroke-[1.5]" /> Deposit and payment verification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/30 p-3 rounded-md border border-border/40 space-y-1">
                <span className="text-[11px] text-muted-foreground block">Payment method</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="font-medium uppercase text-[11px] rounded-sm">
                    {String(paymentMethod)}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-md border border-border/40 space-y-1">
                <span className="text-[11px] text-muted-foreground block">Deposit verification tag</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[11px] font-medium rounded-sm border tabular-nums',
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                      : paymentStatus === 'PENDING_VERIFICATION'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                      : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                  )}
                >
                  {paymentStatus === 'PAID' && <CheckCircle2 className="h-3 w-3 mr-1 inline stroke-[1.5]" />}
                  {paymentStatus === 'PENDING_VERIFICATION' && <Clock className="h-3 w-3 mr-1 inline stroke-[1.5]" />}
                  {paymentStatus === 'UNPAID' && <AlertCircle className="h-3 w-3 mr-1 inline stroke-[1.5]" />}
                  {paymentStatus === 'PAID' ? 'Verified paid' : paymentStatus === 'PENDING_VERIFICATION' ? 'Pending verification' : 'Unpaid'}
                </Badge>
              </div>
            </div>

            {/* Reference Number */}
            <div className="bg-muted/40 p-3 rounded-md border border-border/60">
              <span className="text-[11px] text-muted-foreground block mb-1">
                GCash / Maya deposit reference number
              </span>
              {paymentRef ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-foreground text-xs tracking-wide tabular-nums">
                    {paymentRef}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyRef}
                    className="h-7 px-2.5 gap-1 text-[11px] rounded-md"
                  >
                    {copiedRef ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[1.5]" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No payment reference submitted yet
                </span>
              )}
            </div>

            {payment?.verifiedAt && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 tabular-nums">
                <ShieldCheck className="h-4 w-4 text-emerald-600 stroke-[1.5]" />
                <span>Verified on {formatDate(payment.verifiedAt)}</span>
              </div>
            )}
          </div>

          {/* Section 5: Inspiration Photo Preview */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary stroke-[1.5]" /> Inspiration photo
            </h4>

            {inspirationUrl ? (
              <div className="space-y-2">
                <div
                  className="group relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-muted cursor-pointer"
                  onClick={() => setIsPhotoModalOpen(true)}
                >
                  <img
                    src={inspirationUrl}
                    alt="Customer inspiration design"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <Maximize2 className="h-4 w-4 stroke-[1.5]" />
                    <span className="text-xs font-medium">Click to view full photo</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="text-xs h-7 gap-1 rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <Maximize2 className="h-3.5 w-3.5 stroke-[1.5]" /> Full-screen preview
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                <Sparkles className="h-5 w-5 mx-auto mb-1 text-muted-foreground/50 stroke-[1.5]" />
                <p className="text-xs">No inspiration photo was uploaded for this booking.</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer with Status Transition Actions */}
        <div className="p-4 border-t border-border bg-card space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Actions for {getSentenceStatusLabel(booking.status).toLowerCase()} booking</span>
            <span className="font-mono tabular-nums">ID: #{booking.id.slice(-6)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* When PENDING: Confirm or Cancel */}
            {booking.status === 'PENDING' && (
              <>
                <Button
                  onClick={() => handleTransition('CONFIRMED')}
                  isLoading={isUpdating}
                  className="flex-1 h-9 rounded-md gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 stroke-[1.5]" />
                  Confirm booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openReasonModal('CANCELLED')}
                  disabled={isUpdating}
                  className="h-9 rounded-md gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4 stroke-[1.5]" />
                  Cancel
                </Button>
              </>
            )}

            {/* When CONFIRMED: Complete, No-Show, or Cancel */}
            {booking.status === 'CONFIRMED' && (
              <>
                <Button
                  onClick={() => handleTransition('COMPLETED')}
                  isLoading={isUpdating}
                  className="flex-1 h-9 rounded-md gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm"
                >
                  <Check className="h-4 w-4 stroke-[1.5]" />
                  Complete appointment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openReasonModal('NO_SHOW')}
                  disabled={isUpdating}
                  className="h-9 rounded-md gap-1 text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  <UserX className="h-4 w-4 stroke-[1.5]" />
                  No-show
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openReasonModal('CANCELLED')}
                  disabled={isUpdating}
                  className="h-9 rounded-md gap-1 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4 stroke-[1.5]" />
                  Cancel
                </Button>
              </>
            )}

            {/* When COMPLETED */}
            {booking.status === 'COMPLETED' && (
              <div className="w-full flex items-center justify-between p-2.5 rounded-md bg-stone-50 dark:bg-stone-850 border border-border">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[1.5]" />
                  Appointment completed
                </span>
                {onTriggerCompletionQR && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTriggerCompletionQR(booking.id)}
                    className="h-8 text-xs gap-1.5 rounded-md border-border"
                  >
                    <QrCode className="h-3.5 w-3.5 stroke-[1.5]" />
                    Completion QR
                  </Button>
                )}
              </div>
            )}

            {/* When CANCELLED or NO_SHOW */}
            {(booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') && (
              <div className="w-full p-2.5 rounded-md bg-muted text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 stroke-[1.5]" />
                <span>
                  This booking is {getSentenceStatusLabel(booking.status).toLowerCase()}. No further transitions can be made.
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Lightbox / Full-View Photo Modal */}
      {inspirationUrl && isPhotoModalOpen && (
        <Modal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          title="Inspiration design photo"
          description={`Uploaded by ${customerName}`}
          size="full"
        >
          <div className="space-y-4">
            <div className="relative max-h-[75vh] flex items-center justify-center bg-black/90 rounded-xl overflow-hidden p-2">
              <img
                src={inspirationUrl}
                alt="Full resolution inspiration photo"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>Customer: {customerName}</span>
              <a
                href={inspirationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Open original in new tab <ExternalLink className="h-3.5 w-3.5 stroke-[1.5]" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation / No-Show Reason Modal */}
      {reasonModalOpen && (
        <Modal
          isOpen={reasonModalOpen}
          onClose={() => {
            setReasonModalOpen(false);
            setPendingAction(null);
          }}
          title={pendingAction === 'NO_SHOW' ? 'Record customer no-show' : 'Cancel booking'}
          description={`Please provide a reason for updating #${booking.id.slice(-6)} to ${
            pendingAction ? getSentenceStatusLabel(pendingAction).toLowerCase() : ''
          }.`}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Select a standard reason:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(pendingAction === 'NO_SHOW' ? noShowReasons : cancelReasons).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs rounded-md border transition-colors',
                      selectedReason === reason
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:bg-muted/50 text-foreground'
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="custom-reason" className="block text-xs font-semibold text-foreground mb-1.5">
                Additional notes (optional):
              </label>
              <Textarea
                id="custom-reason"
                rows={3}
                placeholder="Enter any additional context or remarks..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="text-xs rounded-md border-border"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReasonModalOpen(false);
                  setPendingAction(null);
                }}
                disabled={isUpdating}
                className="h-9 rounded-md text-xs"
              >
                Keep booking
              </Button>
              <Button
                size="sm"
                variant={pendingAction === 'NO_SHOW' ? 'secondary' : 'destructive'}
                onClick={handleConfirmReason}
                isLoading={isUpdating}
                disabled={!selectedReason && !customReason.trim()}
                className="h-9 rounded-md text-xs"
              >
                {pendingAction === 'NO_SHOW' ? 'Confirm no-show' : 'Confirm cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default BookingDetailsDrawer;
