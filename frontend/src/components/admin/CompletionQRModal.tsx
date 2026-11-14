'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Copy,
  Check,
  Smartphone,
  Award,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CompletionQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  customerName?: string;
  serviceSummary?: string;
  appointmentDate?: string;
}

export function CompletionQRModal({
  isOpen,
  onClose,
  bookingId,
  customerName,
  serviceSummary,
}: CompletionQRModalProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!bookingId) return null;

  // Exact payload required by the salon loyalty scanner specification
  const qrPayload = `BOOKING:${bookingId}`;

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      toast.success('QR code payload copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy payload');
    }
  };

  const handleCopyManualCode = async () => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      toast.success('Booking ID copied for manual entry');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy booking ID');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment completion QR code"
      description="Present this code for the client to scan with their loyalty card."
      size="md"
    >
      <div className="space-y-4">
        {/* Top Banner: Success & Stamping Notice */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-900 text-white flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-950 dark:text-rose-100">
                Service completed
              </p>
              <p className="text-[11px] text-stone-600 dark:text-stone-300">
                1 atelier visit stamp ready for collection
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-white/80 dark:bg-stone-900/80 text-rose-900 dark:text-rose-200 border-rose-300/80 dark:border-rose-800 rounded-full font-medium text-xs tabular-nums px-3 py-1"
          >
            +1 stamp
          </Badge>
        </div>

        {/* Client & Booking Meta Info */}
        <div className="bg-white/90 dark:bg-[#1A0E15]/90 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-500 dark:text-stone-400">Client name:</span>
            <span className="font-medium text-stone-900 dark:text-rose-100">
              {customerName || 'Walk-in client'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500 dark:text-stone-400">Booking reference:</span>
            <span className="font-mono font-medium text-stone-900 dark:text-rose-100 tabular-nums">
              #{bookingId.slice(-8)}
            </span>
          </div>
          {serviceSummary && (
            <div className="flex justify-between">
              <span className="text-stone-500 dark:text-stone-400">Service:</span>
              <span className="text-stone-900 dark:text-rose-100 truncate max-w-[220px]">
                {serviceSummary}
              </span>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center py-1">
          <div
            ref={qrRef}
            className="p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(26,14,21,0.06)] border border-rose-200/80 dark:border-rose-900/60 flex flex-col items-center justify-center relative"
          >
            <QRCodeSVG
              value={qrPayload}
              size={200}
              level="H"
              includeMargin={true}
              aria-label={`Loyalty stamp QR code for booking ${bookingId}`}
            />
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-rose-900 text-white">
                <Award className="h-3.5 w-3.5 stroke-[1.5]" />
                Atelier loyalty stamp check-out
              </span>
            </div>
          </div>

          {/* Payload Display & Copy */}
          <div className="mt-4 flex items-center gap-2 max-w-sm w-full">
            <div className="flex-1 px-3.5 py-2 bg-rose-50/50 dark:bg-rose-950/30 rounded-full font-mono text-xs text-stone-600 dark:text-rose-300 truncate border border-rose-200/70 dark:border-rose-900/50 tabular-nums">
              {qrPayload}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPayload}
              className="h-9 px-3.5 text-xs gap-1.5 shrink-0 rounded-full border-rose-300/80 dark:border-rose-800/80 text-rose-900 dark:text-rose-200"
              title="Copy QR payload"
            >
              {copied ? (
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
        </div>

        {/* Step-by-Step Scanning Instructions for Customer */}
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-[#1A0E15]/90 p-4 space-y-2.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 stroke-[1.5]" /> Instructions for client
          </h4>

          <ol className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 list-decimal list-inside leading-relaxed">
            <li>
              Open Pretty Nails on mobile browser and sign in.
            </li>
            <li>
              Navigate to the <strong>Loyalty card</strong> page (
              <code className="px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 font-mono text-[11px] text-rose-900 dark:text-rose-300">/loyalty</code>
              ).
            </li>
            <li>
              Tap the <strong>"Scan QR code"</strong> button to open camera scanner.
            </li>
            <li>
              Align camera with this QR code to collect your <strong>+1 visit stamp</strong>.
            </li>
          </ol>

          <p className="text-[11px] text-stone-500 dark:text-stone-400 border-t border-rose-200/60 dark:border-rose-950/50 pt-2 flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-rose-800 dark:text-rose-400 shrink-0 stroke-[1.5]" />
            <span>Clients collect 1 stamp per completed appointment. 10 stamps redeem 1 complimentary treatment.</span>
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-rose-200/80 dark:border-rose-950/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyManualCode}
            className="text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 h-10 px-4 rounded-full"
          >
            Copy manual code
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPayload}
              className="text-xs gap-1.5 h-10 px-4 rounded-full border-rose-300/80 dark:border-rose-800/80 text-rose-900 dark:text-rose-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[1.5]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Copy payload</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium px-6 h-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default CompletionQRModal;
