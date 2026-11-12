'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  QrCode,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Camera,
  ExternalLink,
  Award,
  CheckCircle2,
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
  appointmentDate,
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
      toast.success('QR Code payload copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy payload');
    }
  };

  const handleCopyManualCode = async () => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      toast.success('Booking ID copied for manual entry!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy Booking ID');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Completion QR Code"
      description="Present this QR code for the customer to scan with their Loyalty Card."
      size="md"
    >
      <div className="space-y-5">
        {/* Top Banner: Success & Stamping Notice */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Service Completed Successfully
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                1 visit stamp ready for collection
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 font-semibold text-xs"
          >
            +1 Stamp
          </Badge>
        </div>

        {/* Customer & Booking Meta Info */}
        <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-semibold text-foreground">
              {customerName || 'Walk-in Customer'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Booking Reference:</span>
            <span className="font-mono font-medium text-foreground">
              #{bookingId.slice(-8)}
            </span>
          </div>
          {serviceSummary && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="text-foreground truncate max-w-[200px]">
                {serviceSummary}
              </span>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center py-2">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-md border-2 border-primary/20 flex flex-col items-center justify-center relative"
          >
            <QRCodeSVG
              value={qrPayload}
              size={220}
              level="H"
              includeMargin={true}
              aria-label={`Loyalty stamp QR code for booking ${bookingId}`}
            />
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3" /> Scan for Loyalty Stamp
              </span>
            </div>
          </div>

          {/* Payload Display & Copy */}
          <div className="mt-3 flex items-center gap-2 max-w-sm w-full">
            <div className="flex-1 px-3 py-1.5 bg-muted rounded-lg font-mono text-xs text-muted-foreground truncate border border-border">
              {qrPayload}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPayload}
              className="h-8 px-2.5 text-xs gap-1 shrink-0"
              title="Copy QR payload"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Step-by-Step Scanning Instructions for Customer */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-primary" /> Instructions for Customer
          </h4>

          <ol className="space-y-2 text-xs text-foreground/90 list-decimal list-inside leading-relaxed">
            <li>
              Open Pretty Nails on your mobile browser and log in to your account.
            </li>
            <li>
              Go to the <strong>Loyalty Card</strong> page (
              <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">/loyalty</code>
              ).
            </li>
            <li>
              Tap the <strong>"Scan QR Code"</strong> button to open the camera scanner.
            </li>
            <li>
              Point your camera at this QR code to claim your <strong>+1 visit stamp</strong>!
            </li>
          </ol>

          <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 flex items-center gap-1">
            <Gift className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Customers earn 1 stamp per completed appointment. 10 stamps = 1 free service.</span>
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyManualCode}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Copy Manual Code
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPayload}
              className="text-xs gap-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              Copy Payload
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium px-4"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
