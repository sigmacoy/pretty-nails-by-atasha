'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { BookingStatus } from '@/types';
import { transitionBookingStatus } from './types';
import { toast } from 'sonner';

interface StatusActionProps {
  bookingId: string;
  currentStatus: BookingStatus;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
}

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

function getStatusBadgeStyle(status: BookingStatus) {
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

function getSentenceLabel(status: BookingStatus): string {
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

export function StatusAction({ bookingId, currentStatus, onStatusChange }: StatusActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cancellation / No-Show reason modal
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'CANCELLED' | 'NO_SHOW' | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const executeTransition = async (status: BookingStatus, reason?: string) => {
    setIsUpdating(true);
    try {
      await transitionBookingStatus(bookingId, status, reason);
      toast.success(`Booking status updated to ${getSentenceLabel(status)}`);
      onStatusChange(bookingId, status);
      setReasonModalOpen(false);
      setTargetStatus(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusSelect = (status: BookingStatus) => {
    setIsOpen(false);
    if (status === currentStatus || isUpdating) return;

    if (status === 'CANCELLED' || status === 'NO_SHOW') {
      setTargetStatus(status);
      setSelectedReason('');
      setCustomReason('');
      setReasonModalOpen(true);
      return;
    }

    executeTransition(status);
  };

  const handleConfirmReason = () => {
    if (!targetStatus) return;
    const finalReason = customReason.trim()
      ? selectedReason
        ? `${selectedReason}: ${customReason.trim()}`
        : customReason.trim()
      : selectedReason || `${getSentenceLabel(targetStatus)} by admin`;

    executeTransition(targetStatus, finalReason);
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {/* Current Status Badge Button */}
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer transition-colors select-none py-1 px-2.5 rounded-sm border text-[11px] font-medium',
            getStatusBadgeStyle(currentStatus),
            'hover:opacity-90'
          )}
          onClick={() => !isUpdating && setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-1">
            {getSentenceLabel(currentStatus)}
            <ChevronDown className="h-3 w-3 stroke-[1.5]" aria-hidden="true" />
          </span>
        </Badge>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover shadow-lg py-1 text-popover-foreground animate-in fade-in-50 zoom-in-95">
            <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
              Change status
            </div>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                disabled={isUpdating || option.value === currentStatus}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors',
                  option.value === currentStatus
                    ? 'bg-muted/60 text-muted-foreground cursor-default'
                    : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      option.value === 'PENDING' && 'bg-amber-500',
                      option.value === 'CONFIRMED' && 'bg-emerald-500',
                      option.value === 'COMPLETED' && 'bg-stone-500',
                      option.value === 'CANCELLED' && 'bg-rose-500',
                      option.value === 'NO_SHOW' && 'bg-stone-400'
                    )}
                  />
                  <span>{option.label}</span>
                </span>
                {option.value === currentStatus && (
                  <Check className="h-3.5 w-3.5 text-primary stroke-[1.5] ml-auto" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reason Modal for Cancel / No-Show */}
      {reasonModalOpen && (
        <Modal
          isOpen={reasonModalOpen}
          onClose={() => {
            setReasonModalOpen(false);
            setTargetStatus(null);
          }}
          title={targetStatus === 'NO_SHOW' ? 'Reason for no-show' : 'Reason for cancellation'}
          description={`Provide context for marking booking #${bookingId.slice(-6)} as ${
            targetStatus ? getSentenceLabel(targetStatus).toLowerCase() : ''
          }.`}
          size="md"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              {[
                targetStatus === 'NO_SHOW'
                  ? 'Customer did not arrive within grace period'
                  : 'Customer requested cancellation',
                targetStatus === 'NO_SHOW'
                  ? 'Unreachable via contact number'
                  : 'Scheduling conflict / Rescheduled',
                targetStatus === 'NO_SHOW'
                  ? 'Refused service upon arrival'
                  : 'Downpayment not received',
                'Other reason',
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedReason(r)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-md border transition-colors',
                    selectedReason === r
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:bg-muted/50 text-foreground'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="modal-notes" className="block text-xs font-medium text-foreground mb-1">
                Custom notes (optional):
              </label>
              <Textarea
                id="modal-notes"
                rows={2}
                placeholder="Additional remarks..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="text-xs rounded-md border-border"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReasonModalOpen(false);
                  setTargetStatus(null);
                }}
                disabled={isUpdating}
                className="h-9 rounded-md text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant={targetStatus === 'NO_SHOW' ? 'secondary' : 'destructive'}
                onClick={handleConfirmReason}
                isLoading={isUpdating}
                disabled={!selectedReason && !customReason.trim()}
                className="h-9 rounded-md text-xs"
              >
                Apply status
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
