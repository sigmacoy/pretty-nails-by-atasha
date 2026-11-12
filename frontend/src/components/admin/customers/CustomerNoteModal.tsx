'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { X, Save } from 'lucide-react';
import { CustomerListDto } from '@/types';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface CustomerNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerListDto | null;
}

export function CustomerNoteModal({ isOpen, onClose, customer }: CustomerNoteModalProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !note.trim()) return;

    setIsSubmitting(true);
    try {
      await adminApi.addCustomerNote(customer.id, { content: note.trim() });
      toast.success('Note added successfully');
      setNote('');
      onClose();
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Failed to add customer note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Note for ${customer?.name || 'Customer'}`}
      description="This note will be visible to admins only."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter your note here..."
          rows={6}
          className="resize-none"
          aria-label="Customer note"
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !note.trim()}>
            {isSubmitting ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
