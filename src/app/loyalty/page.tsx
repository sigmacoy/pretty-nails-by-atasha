"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { Award, QrCode, Camera, CheckCircle, Clock, Sparkles, Loader2, ArrowUpRight, AlertCircle, X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate, getStampProgress, getStampsNeeded } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STAMPS_REQUIRED = 9;
const STAMP_EXPIRY_MONTHS = 12;

export default function LoyaltyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loyaltyCard, setLoyaltyCard] = useState<{
    stampCount: number;
    lastStampAt: string | null;
    expiresAt: string | null;
    stamps: Array<{ earnedAt: string; source: string; amount?: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProcessing, setScanProcessing] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchLoyaltyCard();
    }
    return () => {
      stopScanner();
    };
  }, [session]);

  const fetchLoyaltyCard = async () => {
    try {
      const res = await fetch("/api/loyalty/card");
      if (res.ok) {
        const data = await res.json();
        setLoyaltyCard(data);
      }
    } catch (error) {
      console.error("Failed to fetch loyalty card:", error);
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setScanning(true);
        requestAnimationFrame(scanQRCode);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      setScanResult({
        success: false,
        message: "Camera access unavailable or denied. You can enter or paste the code directly below.",
      });
      setShowManualInput(true);
    }
  };

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !scanning) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          stopScanner();
          handleQRScan(code.data);
          return;
        }
      }
    }

    if (scanning) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRScan = async (qrData: string) => {
    if (!qrData || !qrData.trim()) {
      setScanResult({ success: false, message: "Please provide a valid stamp code or QR code." });
      return;
    }

    setScanProcessing(true);
    try {
      const res = await fetch("/api/loyalty/stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrData.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setScanResult({
          success: true,
          message: data.message || `Stamp earned! You now have ${data.stampCount} stamps.`,
        });
        setManualCode("");
        fetchLoyaltyCard();
      } else {
        setScanResult({
          success: false,
          message: data.error || "Failed to add stamp. Please check the QR code.",
        });
      }
    } catch (error) {
      setScanResult({ success: false, message: "Error processing stamp. Please try again." });
    } finally {
      setScanProcessing(false);
    }
  };

  const formatPrice = (price: number) => `₱${(price / 100).toLocaleString()}`;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session) return null;

  const progress = loyaltyCard ? getStampProgress(loyaltyCard.stampCount, STAMPS_REQUIRED) : 0;
  const stampsNeeded = loyaltyCard ? getStampsNeeded(loyaltyCard.stampCount, STAMPS_REQUIRED) : STAMPS_REQUIRED;
  const isExpired = Boolean(loyaltyCard?.expiresAt && new Date(loyaltyCard.expiresAt) < new Date());

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Loyalty Card */}
        <Card className="mb-8 gradient-pinkish relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellowish-DEFAULT rounded-full blur-3xl opacity-50" />

          <CardContent className="relative p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-gray-900">Loyalty Card</h2>
                <p className="text-gray-600 mt-1">Pretty Nails by Atasha</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Member since</p>
                <p className="font-medium text-gray-900">{session.user.name || "Customer"}</p>
              </div>
            </div>

            {/* Stamp Progress */}
            <div className="text-center mb-8">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 5.65} 565`}
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-5xl font-bold text-gray-900">{loyaltyCard?.stampCount || 0}</span>
                    <span className="text-gray-500 ml-1">/ {STAMPS_REQUIRED}</span>
                  </div>
                </div>
              </div>

              {stampsNeeded > 0 ? (
                <p className="text-lg text-gray-600">
                  {stampsNeeded} more stamp{stampsNeeded !== 1 ? "s" : ""} for a free nail set!
                </p>
              ) : (
                <p className="text-lg text-green-600 font-medium flex items-center justify-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  You have earned a free nail set! Claim it on your next visit.
                </p>
              )}
            </div>

            {/* Visual Stamps */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              {Array.from({ length: STAMPS_REQUIRED }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all",
                    i < (loyaltyCard?.stampCount || 0)
                      ? "bg-primary-500 border-primary-500 shadow-sm"
                      : "bg-white border-gray-300"
                  )}
                >
                  {i < (loyaltyCard?.stampCount || 0) && (
                    <CheckCircle className="h-6 w-6 text-white" />
                  )}
                  {i >= (loyaltyCard?.stampCount || 0) && (
                    <span className="text-gray-400 text-xs font-semibold">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Active Video Scanner Preview */}
            {scanning && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary-500 bg-black aspect-square max-w-sm mx-auto mb-6 shadow-lg">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Aiming Reticle Frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-white/80 rounded-2xl relative shadow-inner animate-pulse">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopScanner}
                    className="shadow-md"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close Camera
                  </Button>
                </div>
              </div>
            )}

            {/* QR Scanner Buttons & Controls */}
            <div className="space-y-3">
              {!scanning && (
                <Button
                  onClick={startScanner}
                  disabled={isExpired || scanProcessing}
                  className="w-full py-3 text-lg font-semibold shadow-md"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Scan QR Code to Earn Stamp
                </Button>
              )}

              {/* Manual input toggle & test options */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="flex-1 text-xs text-gray-700"
                >
                  <Keyboard className="mr-1.5 h-3.5 w-3.5" />
                  {showManualInput ? "Hide Code Input" : "Enter Code Manually"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQRScan("prettynails-stamp:cmvqpeceq00014ei5y81wg2ht")}
                  disabled={scanProcessing || isExpired}
                  className="flex-1 text-xs text-primary-700 border-primary-200 hover:bg-primary-50"
                >
                  {scanProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Test Oct 31 Stamp (+1)
                </Button>
              </div>

              {/* Manual Code Input Form */}
              {showManualInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualCode.trim()) handleQRScan(manualCode);
                  }}
                  className="flex gap-2 pt-2"
                >
                  <Input
                    placeholder="e.g. prettynails-stamp:cmvqpeceq..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={scanProcessing || !manualCode.trim()}
                    className="text-xs shrink-0"
                  >
                    {scanProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply Stamp"}
                  </Button>
                </form>
              )}
            </div>

            {isExpired && (
              <p className="text-center text-sm text-red-600 mt-3">
                Your loyalty card has expired. Contact Atasha for assistance.
              </p>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className={cn(
                "mt-4 p-4 rounded-lg text-center",
                scanResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                {scanResult.success ? (
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                )}
                <p>{scanResult.message}</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setScanResult(null)}>
                  Dismiss
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Get a Service</h4>
                <p className="text-sm text-gray-600">Book and complete any nail service</p>
              </div>
              <div className="p-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Scan QR Code</h4>
                <p className="text-sm text-gray-600">Scan the shop QR after payment</p>
              </div>
              <div className="p-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
                  <Award className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Earn Rewards</h4>
                <p className="text-sm text-gray-600">9 stamps = 1 free nail set</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earning Rules */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary-600" />
              Earning Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="font-medium text-gray-900">1 Stamp per Nail Set</p>
                  <p className="text-sm text-gray-600">Any gel, extension, or pedicure service counts as 1 stamp</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="font-medium text-gray-900">1 Stamp per ₱500 Spent</p>
                  <p className="text-sm text-gray-600">Or earn stamps based on amount: ₱500 = 1 stamp, ₱1,000+ = 2 stamps</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <p className="font-medium text-gray-900">9 Stamps = Free Nail Set</p>
                  <p className="text-sm text-gray-600">Redeem for any nail set service (gel or extension) on your 10th visit</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <p className="font-medium text-gray-900">12-Month Validity</p>
                  <p className="text-sm text-gray-600">Stamps expire 12 months after your last stamp. Visit regularly to keep them active!</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Stamp History */}
        {loyaltyCard?.stamps && loyaltyCard.stamps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary-600" />
                Stamp History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loyaltyCard.stamps
                  .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                  .map((stamp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {stamp.source === "AMOUNT" ? `₱${(stamp.amount || 0) / 100} spent` : "Nail set service"}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(stamp.earnedAt)}</p>
                        </div>
                      </div>
                      <Badge variant={stamp.source === "AMOUNT" ? "secondary" : "default"}>
                        +1 Stamp
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shop QR Code Info */}
        <Card className="mt-8 border-2 border-dashed border-primary-300 bg-primary-50">
          <CardContent className="p-6 text-center">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-primary-400" />
            <h3 className="font-semibold text-gray-900 mb-2">Shop Loyalty QR Code</h3>
            <p className="text-gray-600 mb-4">
              Ask Atasha to show you the shop's loyalty QR code after your payment.
              Scan it with this page to earn your stamp instantly!
            </p>
            <p className="text-sm text-gray-500">
              The QR code is linked to Atasha's GCash account for payment verification.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}