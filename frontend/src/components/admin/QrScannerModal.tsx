'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Camera,
  QrCode,
  Search,
  CheckCircle,
  AlertCircle,
  Award,
  Plus,
  Minus,
  Loader2,
  X,
  RotateCcw,
} from 'lucide-react';
import { AdminLoyaltyCardDto, LoyaltySettingsDto } from '@/types';
import { toast } from 'sonner';

// Type declaration for BarcodeDetector Web API
interface BarcodeDetectorOptions {
  formats?: string[];
}

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<BarcodeDetectedResult[]>;
}

interface BarcodeDetectedResult {
  boundingBox: DOMRectReadOnly;
  cornerPoints: DOMPointReadOnly[];
  format: string;
  rawValue: string;
}

declare global {
  interface Window {
    BarcodeDetector: {
      new (options?: BarcodeDetectorOptions): BarcodeDetector;
    };
  }
}

export interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AdminLoyaltyCardDto[];
  settings?: LoyaltySettingsDto;
  onIssueStamps: (card: AdminLoyaltyCardDto, amount: number) => Promise<void>;
  onRedeemReward: (card: AdminLoyaltyCardDto) => Promise<void>;
}

export function QrScannerModal({
  isOpen,
  onClose,
  cards,
  settings,
  onIssueStamps,
  onRedeemReward,
}: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<AdminLoyaltyCardDto | null>(null);
  const [stampQuantity, setStampQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const maxStamps = settings?.stampsPerService ? settings.stampsPerService * 10 : 10;

  // Initialize BarcodeDetector if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code'],
        });
      } catch (err) {
        console.warn('BarcodeDetector initialization skipped:', err);
      }
    }
  }, []);

  // Handle camera start/stop on open/close
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Reset selection on modal close
  useEffect(() => {
    if (!isOpen) {
      setSelectedCard(null);
      setManualQuery('');
      setStampQuantity(1);
      setCameraError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setHasPermission(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        startScanningLoop();
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unable to access camera. Please use manual search.';
      setCameraError(errorMsg);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
  };

  const startScanningLoop = () => {
    const detect = async () => {
      if (!videoRef.current || !barcodeDetectorRef.current) return;

      try {
        const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          const rawCode = barcodes[0].rawValue.trim();
          handleScannedCode(rawCode);
          return;
        }
      } catch {
        // Continue detection loop
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const handleScannedCode = (code: string) => {
    const cleanCode = code.trim().toLowerCase();
    const matched = cards.find(
      (c) =>
        c.id.toLowerCase() === cleanCode ||
        c.userId.toLowerCase() === cleanCode ||
        c.userEmail.toLowerCase() === cleanCode ||
        cleanCode.includes(c.id.toLowerCase()) ||
        cleanCode.includes(c.userId.toLowerCase())
    );

    if (matched) {
      setSelectedCard(matched);
      stopCamera();
      toast.success(`Client identified: ${matched.userName}.`);
    } else {
      toast.error(`No client record found matching code: ${code}.`);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    const query = manualQuery.trim().toLowerCase();
    const matched = cards.find(
      (c) =>
        c.userName.toLowerCase().includes(query) ||
        c.userEmail.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
    );

    if (matched) {
      setSelectedCard(matched);
      toast.success(`Client selected: ${matched.userName}.`);
    } else {
      toast.error('No client found matching search term.');
    }
  };

  const handleQuickIssue = async (amount: number) => {
    if (!selectedCard) return;
    setIsSubmitting(true);
    try {
      await onIssueStamps(selectedCard, amount);
      setSelectedCard((prev) =>
        prev
          ? {
              ...prev,
              stampCount: prev.stampCount + amount,
              lastStampAt: new Date().toISOString(),
            }
          : null
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReward = async () => {
    if (!selectedCard) return;
    setIsSubmitting(true);
    try {
      await onRedeemReward(selectedCard);
      setSelectedCard((prev) =>
        prev
          ? {
              ...prev,
              stampCount: Math.max(0, prev.stampCount - maxStamps),
            }
          : null
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan member QR"
      description="Scan member loyalty pass or search customer to issue stamps and verify rewards"
      size="lg"
    >
      <div className="space-y-4">
        {/* Mode selector tab */}
        {!selectedCard && (
          <div className="flex rounded-lg border border-stone-200/80 dark:border-stone-800/80 p-0.5 bg-stone-100/60 dark:bg-stone-900/60">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'bg-card text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <Camera className="w-4 h-4" strokeWidth={1.5} />
              Camera scanner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-card text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <Search className="w-4 h-4" strokeWidth={1.5} />
              Manual search
            </button>
          </div>
        )}

        {/* Selected Member View */}
        {selectedCard ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
                      {selectedCard.userName}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-mono tabular-nums">
                      {selectedCard.stampCount} / {maxStamps} stamps
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {selectedCard.userEmail}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCard(null);
                    if (activeTab === 'camera') startCamera();
                  }}
                  className="h-7 px-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                  Scan another
                </Button>
              </div>

              {/* Stamp progress dots */}
              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
                <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                  <span>Card progress</span>
                  <span className="font-mono tabular-nums">
                    {Math.min(selectedCard.stampCount, maxStamps)} of {maxStamps} stamps
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: maxStamps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-colors ${
                        i < selectedCard.stampCount
                          ? 'bg-primary'
                          : 'bg-stone-200 dark:bg-stone-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reward eligibility callout if applicable */}
            {selectedCard.stampCount >= maxStamps && (
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Award className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                      Reward redemption ready
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {settings?.freeServiceReward || 'Free gel service reward eligible'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleApproveReward}
                  isLoading={isSubmitting}
                  className="h-8 px-3 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                  Approve reward
                </Button>
              </div>
            )}

            {/* Stamp issuance controls with ₱500 and ₱1,000 rules */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Issue stamps by service rule
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  ₱500 and ₱1,000 rules
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickIssue(1)}
                  disabled={isSubmitting}
                  className="h-9 justify-between text-xs border border-stone-200/80 dark:border-stone-800/80"
                >
                  <span className="text-stone-600 dark:text-stone-300">₱500 rule</span>
                  <span className="font-mono font-medium text-primary tabular-nums">+1 stamp</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickIssue(2)}
                  disabled={isSubmitting}
                  className="h-9 justify-between text-xs border border-stone-200/80 dark:border-stone-800/80"
                >
                  <span className="text-stone-600 dark:text-stone-300">₱1,000 rule</span>
                  <span className="font-mono font-medium text-primary tabular-nums">+2 stamps</span>
                </Button>
              </div>

              {/* Custom quantity stepper */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-200/60 dark:border-stone-800/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStampQuantity(Math.max(1, stampQuantity - 1))}
                    disabled={stampQuantity <= 1 || isSubmitting}
                    className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <span className="w-9 text-center text-xs font-mono font-medium tabular-nums text-stone-900 dark:text-stone-100">
                    {stampQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStampQuantity(Math.min(10, stampQuantity + 1))}
                    disabled={stampQuantity >= 10 || isSubmitting}
                    className="w-8 h-8 rounded-lg border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleQuickIssue(stampQuantity)}
                  isLoading={isSubmitting}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                  Issue {stampQuantity} stamp{stampQuantity > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Scanning or manual search state */
          <div>
            {activeTab === 'camera' ? (
              <div className="space-y-3">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-950 flex items-center justify-center border border-stone-200/80 dark:border-stone-800/80">
                  {hasPermission ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-stone-400 space-y-2">
                      <Camera className="w-8 h-8 opacity-40" strokeWidth={1.5} />
                      <p className="text-xs max-w-xs">
                        {cameraError || 'Starting camera feed for member QR scanning...'}
                      </p>
                      {cameraError && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveTab('manual')}
                          className="h-7 px-3 text-xs mt-2"
                        >
                          Switch to manual search
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Clean framing brackets */}
                  {hasPermission && (
                    <div className="absolute inset-8 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 relative border border-white/20 rounded-lg">
                        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
                        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-stone-500 dark:text-stone-400">
                  Position the customer loyalty QR code within the frame
                </p>
              </div>
            ) : (
              /* Manual search form */
              <form onSubmit={handleManualSearch} className="space-y-3">
                <div className="flex gap-2 items-end">
                  <Input
                    label="Manual code lookup"
                    placeholder="Search member by name, email, or card ID..."
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    className="h-9 text-xs"
                    autoFocus
                  />
                  <Button type="submit" size="sm" variant="secondary" className="h-9 px-3 text-xs shrink-0">
                    <Search className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                    Search
                  </Button>
                </div>

                {/* Quick list of top members for convenience */}
                <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 divide-y divide-stone-200/60 dark:divide-stone-800/60 max-h-56 overflow-y-auto bg-card">
                  {cards
                    .filter((c) =>
                      manualQuery
                        ? c.userName.toLowerCase().includes(manualQuery.toLowerCase()) ||
                          c.userEmail.toLowerCase().includes(manualQuery.toLowerCase())
                        : true
                    )
                    .slice(0, 5)
                    .map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCard(card)}
                        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                            {card.userName}
                          </p>
                          <p className="text-[11px] text-stone-500">{card.userEmail}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono tabular-nums">
                          {card.stampCount} stamps
                        </Badge>
                      </button>
                    ))}
                </div>
              </form>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
