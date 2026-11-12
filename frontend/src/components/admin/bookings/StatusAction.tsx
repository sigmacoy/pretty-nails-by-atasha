'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';
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
  { value: 'NO_SHOW', label: 'No Show' },
];

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
      toast.success(`Booking status updated to ${getStatusLabel(status)}`);
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
      : selectedReason || `${getStatusLabel(targetStatus)} by Admin`;

    executeTransition(targetStatus, finalReason);
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {/* Current Status Badge */}
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer transition-colors select-none py-1 px-2.5',
            getStatusColor(currentStatus),
            'hover:opacity-85'
          )}
          onClick={() => !isUpdating && setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-1 text-xs font-medium">
            {getStatusLabel(currentStatus)}
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </span>
        </Badge>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 z-50 mt-1 min-w-[170px] rounded-lg border border-border bg-popover shadow-xl py-1 text-popover-foreground animate-in fade-in-50 zoom-in-95">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
              Change Status
            </div>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                disabled={isUpdating || option.value === currentStatus}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-xs transition-colors',
                  option.value === currentStatus
                    ? 'bg-muted/60 text-muted-foreground cursor-default'
                    : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-block h-2 w-2 rounded-full',
                      option.value === 'PENDING' && 'bg-amber-500',
                      option.value === 'CONFIRMED' && 'bg-blue-500',
                      option.value === 'COMPLETED' && 'bg-emerald-500',
                      option.value === 'CANCELLED' && 'bg-red-500',
                      option.value === 'NO_SHOW' && 'bg-gray-500'
                    )}
                  />
                  <span>{option.label}</span>
                </span>
                {option.value === currentStatus && (
                  <Check className="h-3.5 w-3.5 text-primary ml-auto" aria-hidden="true" />
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
          title={targetStatus === 'NO_SHOW' ? 'Reason for No-Show' : 'Reason for Cancellation'}
          description={`Please provide context for marking booking #${bookingId.slice(-6)} as ${
            targetStatus ? getStatusLabel(targetStatus) : ''
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
                    'w-full text-left px-3 py-2 text-xs rounded-lg border transition-colors',
                    selectedReason === r
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="modal-notes" className="block text-xs font-medium mb-1">
                Custom Notes (optional):
              </label>
              <Textarea
                id="modal-notes"
                rows={2}
                placeholder="Additional notes..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="text-xs"
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
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant={targetStatus === 'NO_SHOW' ? 'primary' : 'destructive'}
                onClick={handleConfirmReason}
                isLoading={isUpdating}
                disabled={!selectedReason && !customReason.trim()}
              >
                Apply Status
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
