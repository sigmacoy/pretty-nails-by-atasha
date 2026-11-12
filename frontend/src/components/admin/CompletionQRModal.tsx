'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Copy,
  Check,
  Sparkles,
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
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Award className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Service completed
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                1 visit stamp ready for collection
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 rounded-sm font-medium text-xs tabular-nums"
          >
            +1 stamp
          </Badge>
        </div>

        {/* Client & Booking Meta Info */}
        <div className="bg-card p-3 rounded-xl border border-border text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client name:</span>
            <span className="font-medium text-foreground">
              {customerName || 'Walk-in client'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Booking reference:</span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              #{bookingId.slice(-8)}
            </span>
          </div>
          {serviceSummary && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="text-foreground truncate max-w-[220px]">
                {serviceSummary}
              </span>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center py-1">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-xl shadow-card border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center relative"
          >
            <QRCodeSVG
              value={qrPayload}
              size={200}
              level="H"
              includeMargin={true}
              aria-label={`Loyalty stamp QR code for booking ${bookingId}`}
            />
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-[11px] font-medium bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3 stroke-[1.5]" /> Scan for loyalty stamp
              </span>
            </div>
          </div>

          {/* Payload Display & Copy */}
          <div className="mt-3 flex items-center gap-2 max-w-sm w-full">
            <div className="flex-1 px-3 py-1.5 bg-muted rounded-md font-mono text-xs text-muted-foreground truncate border border-border tabular-nums">
              {qrPayload}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPayload}
              className="h-8 px-2.5 text-xs gap-1 shrink-0 rounded-md"
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
        <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-primary stroke-[1.5]" /> Instructions for client
          </h4>

          <ol className="space-y-1.5 text-xs text-foreground/90 list-decimal list-inside leading-relaxed">
            <li>
              Open Pretty Nails on mobile browser and sign in.
            </li>
            <li>
              Navigate to the <strong>Loyalty card</strong> page (
              <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">/loyalty</code>
              ).
            </li>
            <li>
              Tap the <strong>"Scan QR code"</strong> button to open camera scanner.
            </li>
            <li>
              Align camera with this QR code to collect your <strong>+1 visit stamp</strong>.
            </li>
          </ol>

          <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 flex items-center gap-1">
            <Gift className="h-3.5 w-3.5 text-primary shrink-0 stroke-[1.5]" />
            <span>Clients collect 1 stamp per completed appointment. 10 stamps redeem 1 free service.</span>
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyManualCode}
            className="text-xs text-muted-foreground hover:text-foreground h-9 rounded-md"
          >
            Copy manual code
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPayload}
              className="text-xs gap-1 h-9 rounded-md"
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
              className="text-xs font-medium px-4 h-9 rounded-md"
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
