'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Camera, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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

interface QRScannerProps {
  onScanSuccess: (qrCode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRScanner({ onScanSuccess, onClose, isOpen }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [scanResult, setScanResult] = useState<{ code: string; success: boolean } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Inject scanning animation keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scan-line {
        0% { top: 4%; opacity: 0; }
        50% { opacity: 1; }
        100% { top: calc(100% - 4%); opacity: 0; }
      }
      .animate-scan-line {
        animation: scan-line 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Check if BarcodeDetector API is available
  const isBarcodeDetectorSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // Initialize BarcodeDetector
  useEffect(() => {
    if (isBarcodeDetectorSupported) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code'],
        });
      } catch (e) {
        console.warn('BarcodeDetector initialization failed:', e);
      }
    }
  }, [isBarcodeDetectorSupported]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setHasPermission(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        setIsScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please allow camera permissions or use manual entry.');
      setHasPermission(false);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = () => {
    if (!isScanning || !videoRef.current || !barcodeDetectorRef.current) return;

    const detect = async () => {
      if (!isScanning || !videoRef.current || !barcodeDetectorRef.current) return;

      try {
        const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);

        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          if (code && code !== scanResult?.code) {
            handleScanResult(code);
            return; // Stop scanning after successful detection
          }
        }
      } catch (err) {
        console.warn('Barcode detection error:', err);
      }

      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  const handleScanResult = (code: string) => {
    setIsScanning(false);
    setScanResult({ code, success: true });

    // Show success feedback briefly
    setTimeout(() => {
      onScanSuccess(code);
      onClose();
    }, 800);
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onScanSuccess(manualCode.trim());
      onClose();
    } catch (err) {
      setError('Invalid QR code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Camera view or manual entry */}
          {!showManual ? (
            <div className="relative">
              {/* Camera feed */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {hasPermission && videoRef.current ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                    <Camera className="h-12 w-12 opacity-50" />
                    <p className="text-center px-4">
                      {error || 'Starting camera...'}
                    </p>
                    {error && (
                      <Button variant="outline" onClick={() => setShowManual(true)} size="sm">
                        Enter Code Manually
                      </Button>
                    )}
                  </div>
                )}

                {/* Scanning overlay */}
                {isScanning && hasPermission && (
                  <>
                    {/* Corner brackets */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 left-4 h-12 w-12 border-2 border-primary border-b-0 border-r-0 rounded-tl-2xl" />
                      <div className="absolute top-4 right-4 h-12 w-12 border-2 border-primary border-b-0 border-l-0 rounded-tr-2xl" />
                      <div className="absolute bottom-4 left-4 h-12 w-12 border-2 border-primary border-t-0 border-r-0 rounded-bl-2xl" />
                      <div className="absolute bottom-4 right-4 h-12 w-12 border-2 border-primary border-t-0 border-l-0 rounded-br-2xl" />
                    </div>

                    {/* Scanning line animation */}
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-primary/80 animate-scan-line" />

                    {/* Scan line with glow */}
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse" />
                  </>
                )}

                {/* Success overlay */}
                {scanResult?.success && (
                  <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center gap-3 rounded-xl">
                    <CheckCircle className="h-16 w-16 text-white animate-bounce" />
                    <p className="text-white font-semibold text-lg">QR Code Detected!</p>
                    <p className="text-white/80 text-sm px-4 text-center">{scanResult.code}</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Position the QR code within the frame
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Ask your nail technician for the QR code after your service
                </p>
              </div>

              {/* Manual entry toggle */}
              <Button
                variant="ghost"
                onClick={() => setShowManual(true)}
                className="w-full mt-2 text-sm"
              >
                Can't scan? Enter code manually
              </Button>
            </div>
          ) : (
            /* Manual entry form */
            <div className="space-y-4">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Enter QR Code Manually</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Type or paste the code from your receipt
                </p>
              </div>

              <Input
                label="QR Code"
                placeholder="Enter the code here..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                error={error || undefined}
                autoFocus
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowManual(false);
                    setError(null);
                    setManualCode('');
                    if (hasPermission) {
                      setIsScanning(true);
                      startScanning();
                    }
                  }}
                  className="flex-1"
                >
                  Back to Camera
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Submit Code
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                </Button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && !scanResult?.success && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Supported formats info */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2">
            <Badge variant="outline" className="text-xs">QR Code</Badge>
            <span>•</span>
            <Badge variant="outline" className="text-xs">Alphanumeric</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}