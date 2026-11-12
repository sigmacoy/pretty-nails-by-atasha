'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FileText, Mail, Phone } from 'lucide-react';
import { CustomerListDto } from '@/types';
import { adminApi } from '@/lib/api';
import { formatDateShort, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export interface CustomerNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerListDto | null;
  initialNickname?: string;
  onSaveSuccess?: (customer: CustomerListDto, nickname?: string) => void;
}

export function CustomerNoteModal({
  isOpen,
  onClose,
  customer,
  initialNickname = '',
  onSaveSuccess,
}: CustomerNoteModalProps) {
  const [note, setNote] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setNickname(initialNickname);
    }
  }, [isOpen, initialNickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !note.trim()) return;

    setIsSubmitting(true);
    try {
      await adminApi.addCustomerNote(customer.id, { content: note.trim() });
      toast.success('Note saved successfully');
      onSaveSuccess?.(customer, nickname.trim() || undefined);
      setNote('');
      setNickname('');
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to save customer note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? `Owner notes — ${customer.name}` : 'Owner notes'}
      description="Private notes visible to salon administrators only."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {customer && (
          <div className="rounded-lg border border-stone-200/70 dark:border-stone-800/70 bg-stone-50/60 dark:bg-stone-900/40 p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs select-none shrink-0">
                {getInitials(customer.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {customer.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                    <Mail className="h-3 w-3 text-stone-400 shrink-0" strokeWidth={1.5} />
                    {customer.email}
                  </span>
                  {customer.phone && (
                    <>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Phone className="h-3 w-3 text-stone-400 shrink-0" strokeWidth={1.5} />
                        {customer.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-stone-200/60 dark:border-stone-800/60 text-xs">
              <div>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">Visit count</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                  {customer.bookingCount ?? 0}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">Stamp balance</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                  {customer.loyaltyStamps ?? 0}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">Member since</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                  {customer.createdAt ? formatDateShort(customer.createdAt) : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="customer-nickname" className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            Customer nickname
          </label>
          <Input
            id="customer-nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. VIP Ana or Saturday regular"
            className="h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="owner-notes" className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            Owner notes
          </label>
          <Textarea
            id="owner-notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter private notes, nail length preferences, gel formulas, or client reminders..."
            rows={4}
            className="resize-none text-xs sm:text-sm"
            required
          />
          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
            Private notes are stored securely and visible only to studio administrators.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !note.trim()}
            isLoading={isSubmitting}
            className="h-9 px-4 text-xs font-medium gap-1.5"
          >
            <FileText className="h-4 w-4" strokeWidth={1.5} />
            Save note
          </Button>
        </div>
      </form>
    </Modal>
  );
}
