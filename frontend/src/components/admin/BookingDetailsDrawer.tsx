'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
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
  ChevronRight,
  DollarSign,
  Tag,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { BookingDto, BookingStatus, CustomerListDto } from '@/types';
import { BookingDetailsData, transitionBookingStatus } from './bookings/types';
import {
  formatPrice,
  formatDate,
  formatTime,
  getInitials,
  getStatusColor,
  getStatusLabel,
  getCategoryColor,
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
      toast.success(`Booking successfully marked as ${getStatusLabel(newStatus)}`);
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
      : selectedReason || `${getStatusLabel(pendingAction)} by Admin`;

    handleTransition(pendingAction, finalReason);
  };

  const cancelReasons = [
    'Customer requested cancellation',
    'Scheduling conflict / Stylist unavailable',
    'Downpayment not received / Invalid reference',
    'Customer unresponsive',
    'Salon closure / Emergency',
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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background shadow-2xl flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
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
                <h2 id="drawer-title" className="text-lg font-semibold text-foreground">
                  Booking Details
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  #{booking.id.slice(-8)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Created {formatDate(booking.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs font-medium', getStatusColor(booking.status))}>
              {getStatusLabel(booking.status)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Close details"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Section 1: Customer Profile */}
          <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-base">
                  {getInitials(customerName)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">{customerName}</h3>
                  <p className="text-xs text-muted-foreground">
                    Customer ID: {booking.userId.slice(0, 12)}...
                  </p>
                </div>
              </div>
              {customer && customer.loyaltyStamps !== undefined && (
                <div className="text-right">
                  <Badge variant="secondary" className="gap-1 text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200">
                    <Sparkles className="h-3 w-3" />
                    {customer.loyaltyStamps} Stamps
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary/70" />
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
                <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                {customerPhone !== 'No phone number' ? (
                  <a
                    href={`tel:${customerPhone}`}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {customerPhone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{customerPhone}</span>
                )}
              </div>
            </div>

            {customerNotes && (
              <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                <p className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Customer Notes:
                </p>
                <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 whitespace-pre-line italic">
                  "{customerNotes}"
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Appointment Schedule */}
          <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Appointment Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-xs text-muted-foreground block">Date</span>
                <span className="font-medium text-foreground">
                  {formatDate(booking.appointmentDate)}
                </span>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-xs text-muted-foreground block">Time Window</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Services & Price Breakdown */}
          <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" /> Selected Services ({booking.services?.length || 0})
              </h4>
            </div>

            <div className="divide-y divide-border/60">
              {booking.services && booking.services.length > 0 ? (
                booking.services.map((svc, index) => (
                  <div key={svc.id || index} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {svc.service?.name || svc.serviceId}
                        </span>
                        {svc.service?.category && (
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px] px-1.5 py-0', getCategoryColor(svc.service.category))}
                          >
                            {svc.service.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {svc.variantId && (
                          <span>Variant: {svc.variantId}</span>
                        )}
                        <span>Qty: {svc.quantity || 1}</span>
                        {svc.service?.duration && (
                          <span>• {svc.service.duration} mins</span>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-foreground shrink-0">
                      {formatPrice(svc.price * (svc.quantity || 1))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2">No services recorded</p>
              )}
            </div>

            {/* Price Summary Breakdown */}
            <div className="pt-3 border-t border-border/80 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Services Subtotal:</span>
                <span>{formatPrice(booking.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400">
                <span>Downpayment Required:</span>
                <span>{formatPrice(downpaymentAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Remaining Balance at Counter:</span>
                <span className="font-medium text-foreground">{formatPrice(remainingBalance)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border/60 text-foreground">
                <span>Total Amount:</span>
                <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Payment & Downpayment Verification */}
          <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment & Downpayment Info
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40 space-y-1">
                <span className="text-xs text-muted-foreground block">Payment Method</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="font-medium uppercase text-xs">
                    {String(paymentMethod)}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg border border-border/40 space-y-1">
                <span className="text-xs text-muted-foreground block">Downpayment Status</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold',
                    paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300'
                      : paymentStatus === 'PENDING_VERIFICATION'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300'
                  )}
                >
                  {paymentStatus === 'PAID' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                  {paymentStatus === 'PENDING_VERIFICATION' && <Clock className="h-3 w-3 mr-1 inline" />}
                  {paymentStatus === 'UNPAID' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                  {paymentStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Reference Number */}
            <div className="bg-muted/40 p-3 rounded-lg border border-border/60">
              <span className="text-xs text-muted-foreground block mb-1">
                GCash / Maya Payment Reference Number
              </span>
              {paymentRef ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-foreground text-sm tracking-wide">
                    {paymentRef}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyRef}
                    className="h-7 px-2.5 gap-1 text-xs"
                  >
                    {copiedRef ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
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
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Verified on {formatDate(payment.verifiedAt)}</span>
              </div>
            )}
          </div>

          {/* Section 5: Inspiration Photo Preview */}
          <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Inspiration Photo
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
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <Maximize2 className="h-5 w-5" />
                    <span className="text-xs font-medium">Click to view full photo</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="text-xs h-7 gap-1"
                  >
                    <Maximize2 className="h-3.5 w-3.5" /> Full Screen Preview
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                <Sparkles className="h-6 w-6 mx-auto mb-1 text-muted-foreground/50" />
                <p className="text-xs">No inspiration photo was uploaded for this booking.</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer with Status Transition Actions */}
        <div className="p-4 border-t border-border bg-card space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Actions for {getStatusLabel(booking.status)} booking:</span>
            <span>ID: #{booking.id.slice(-6)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* When PENDING: Confirm or Cancel */}
            {booking.status === 'PENDING' && (
              <>
                <Button
                  onClick={() => handleTransition('CONFIRMED')}
                  isLoading={isUpdating}
                  className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openReasonModal('CANCELLED')}
                  disabled={isUpdating}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4" />
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
                  className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  Complete Appointment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openReasonModal('NO_SHOW')}
                  disabled={isUpdating}
                  className="gap-1 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 border-amber-300"
                >
                  <UserX className="h-4 w-4" />
                  No-Show
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openReasonModal('CANCELLED')}
                  disabled={isUpdating}
                  className="gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}

            {/* When COMPLETED */}
            {booking.status === 'COMPLETED' && (
              <div className="w-full flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                <span className="text-xs font-medium text-green-800 dark:text-green-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Appointment successfully completed
                </span>
                {onTriggerCompletionQR && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTriggerCompletionQR(booking.id)}
                    className="h-7 text-xs border-green-300 text-green-800 dark:text-green-300"
                  >
                    View Completion QR
                  </Button>
                )}
              </div>
            )}

            {/* When CANCELLED or NO_SHOW */}
            {(booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') && (
              <div className="w-full p-2.5 rounded-lg bg-muted text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  This booking is {booking.status.toLowerCase().replace('_', ' ')}. No further
                  transitions can be made.
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
          title="Inspiration Design Photo"
          description={`Uploaded by ${customerName}`}
          size="full"
        >
          <div className="space-y-4">
            <div className="relative max-h-[75vh] flex items-center justify-center bg-black/90 rounded-lg overflow-hidden p-2">
              <img
                src={inspirationUrl}
                alt="Full resolution inspiration photo"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded"
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
                Open original in new tab <ExternalLink className="h-3.5 w-3.5" />
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
          title={pendingAction === 'NO_SHOW' ? 'Record Customer No-Show' : 'Cancel Booking'}
          description={`Please provide a reason for updating #${booking.id.slice(-6)} to ${
            pendingAction ? getStatusLabel(pendingAction) : ''
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
                      'w-full text-left px-3 py-2 text-xs rounded-lg border transition-colors',
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
                Additional Notes / Explanation (optional):
              </label>
              <Textarea
                id="custom-reason"
                rows={3}
                placeholder="Enter any additional context or customer remarks..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="text-xs"
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
              >
                Keep Booking
              </Button>
              <Button
                size="sm"
                variant={pendingAction === 'NO_SHOW' ? 'primary' : 'destructive'}
                onClick={handleConfirmReason}
                isLoading={isUpdating}
                disabled={!selectedReason && !customReason.trim()}
              >
                {pendingAction === 'NO_SHOW' ? 'Confirm No-Show' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
export default BookingDetailsDrawer;
