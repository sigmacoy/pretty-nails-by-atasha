'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loyaltyApi } from '@/lib/api';
import { toast } from 'sonner';

interface QRScannerProps {
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const lastScannedCodeRef = useRef<string | null>(null);

  // Initialize html5-qrcode scanner
  useEffect(() => {
    const initScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');

        html5QrCodeRef.current = new Html5Qrcode('qr-reader');

        // Check camera permission
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setHasPermission(true);
        } else {
          setError('No camera found. Please connect a camera to scan QR codes.');
        }
      } catch (err) {
        console.error('Failed to initialize QR scanner:', err);
        setError('Failed to initialize scanner. Please ensure camera permissions are granted.');
      }
    };

    initScanner();

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!html5QrCodeRef.current || isScanning) return;

    try {
      setError(null);
      setIsScanning(true);

      const { Html5Qrcode } = await import('html5-qrcode');

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText: string, decodedResult: any) => {
          // Prevent duplicate scans within 2 seconds using ref
          if (lastScannedCodeRef.current === decodedText) return;

          lastScannedCodeRef.current = decodedText;
          setIsProcessing(true);

          // Clear the duplicate prevention after 2 seconds
          scanTimeoutRef.current = setTimeout(() => {
            lastScannedCodeRef.current = null;
          }, 2000);

          try {
            // Call loyalty stamp API (staff endpoint)
            const response = await loyaltyApi.addStampAsStaff(decodedText);

            if (response.data.success) {
              toast.success(`Stamp added! ${response.data.stampCount}/10 stamps`);
              onScanSuccess?.(decodedText);

              // Visual feedback
              const video = videoRef.current;
              if (video) {
                video.style.borderColor = '#22c55e';
                setTimeout(() => {
                  if (video) video.style.borderColor = '';
                }, 500);
              }
            } else {
              throw new Error(response.data.message || 'Failed to add stamp');
            }
          } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to process QR code';
            toast.error(message);
            onScanError?.(message);

            // Visual feedback for error
            const video = videoRef.current;
            if (video) {
              video.style.borderColor = '#ef4444';
              setTimeout(() => {
                if (video) video.style.borderColor = '';
              }, 500);
            }
          } finally {
            setIsProcessing(false);
          }
        },
        (errorMessage: string) => {
          // Ignore scan errors (no QR code found in frame)
        }
      );
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  }, [isScanning, onScanSuccess, onScanError]);

  const stopScanning = useCallback(async () => {
    if (!html5QrCodeRef.current || !isScanning) return;

    try {
      await html5QrCodeRef.current.stop();
      setIsScanning(false);
    } catch (err) {
      console.error('Failed to stop scanner:', err);
    }
  }, [isScanning]);

  const toggleScanning = useCallback(() => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

  // Auto-start scanning on mount
  useEffect(() => {
    if (hasPermission && !isScanning) {
      startScanning();
    }
  }, [hasPermission, isScanning, startScanning]);

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-stone-50 dark:bg-stone-900 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-8">
        {error ? (
          <>
            <XCircle className="h-16 w-16 text-rose-500 mb-4" />
            <p className="text-center text-stone-600 dark:text-stone-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-full text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-rose-800 dark:text-rose-300 mb-4" />
            <p className="text-center text-stone-600 dark:text-stone-300">Initializing camera...</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div id="qr-reader" className="relative w-full aspect-square">
        {/* Video feed will be rendered here by html5-qrcode */}
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
        {/* Top indicator */}
        <div className="w-full flex justify-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 text-white text-sm font-medium ${isProcessing ? 'bg-green-600' : isScanning ? 'bg-rose-900' : 'bg-stone-600'}`}>
            {isProcessing && <CheckCircle className="h-4 w-4 animate-pulse" />}
            {isScanning && !isProcessing && <Zap className="h-4 w-4 animate-pulse" />}
            {!isScanning && <Camera className="h-4 w-4" />}
            <span>{isProcessing ? 'Processing...' : isScanning ? 'Scanning...' : 'Camera Ready'}</span>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="w-full flex justify-center gap-4 pb-8">
          <button
            onClick={toggleScanning}
            disabled={isProcessing}
            className={`px-6 py-3 rounded-full text-base font-medium transition-all ${
              isScanning
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-white/90 hover:bg-white dark:bg-stone-800/90 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
          >
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </button>
        </div>
      </div>

      {/* Scan frame guide */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-rose-300/50 dark:border-rose-700/50 rounded-xl pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-rose-200/10 to-transparent" />
        {/* Corner indicators */}
        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-rose-400 dark:border-rose-500 rounded-tl-xl" />
        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-rose-400 dark:border-rose-500 rounded-tr-xl" />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-rose-400 dark:border-rose-500 rounded-bl-xl" />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-rose-400 dark:border-rose-500 rounded-br-xl" />
      </div>
    </div>
  );
}

export default QRScanner;