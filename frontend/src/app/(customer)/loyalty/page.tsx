'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@/hooks/useApi';
import { loyaltyApi } from '@/lib/api';
import { LoyaltyCardDto, StampResponse } from '@/types';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { QRScanner } from '@/components/loyalty/QRScanner';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Gift, Clock, Info, AlertCircle, QrCode, Check, Copy } from 'lucide-react';

const MAX_STAMPS = 10;

export default function LoyaltyPage() {
  const { isAuthenticated } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomerQROpen, setIsCustomerQROpen] = useState(false);
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [hasCopiedVoucher, setHasCopiedVoucher] = useState(false);

  const { data: loyaltyData, isLoading, error, refetch } = useQuery(
    () => loyaltyApi.getCard(),
    { enabled: isAuthenticated }
  );

  const loyaltyCard = loyaltyData?.data;
  const stampCount = loyaltyCard?.stampCount || 0;
  const isComplete = stampCount >= MAX_STAMPS;
  const voucherCode = loyaltyCard ? `PN-${loyaltyCard.id.slice(0, 8).toUpperCase()}` : '';

  const handleCopyVoucher = () => {
    if (!voucherCode) return;
    navigator.clipboard.writeText(voucherCode);
    setHasCopiedVoucher(true);
    toast.success('Voucher code copied to clipboard');
    setTimeout(() => setHasCopiedVoucher(false), 2000);
  };

  const handleAddStamp = async (qrCode: string) => {
    setIsAddingStamp(true);
    try {
      const response = await loyaltyApi.addStamp(qrCode);
      const result = response.data as StampResponse;

      if (result.success) {
        toast.success(result.message || 'Stamp recorded successfully');
        refetch(); // Refresh the loyalty card data
      } else {
        toast.error(result.message || 'Unable to record stamp. Please try again.');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Unable to record stamp. Please try again.');
    } finally {
      setIsAddingStamp(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-padding section-padding">
        <div className="max-w-md mx-auto rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 sm:p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center mx-auto text-stone-600 dark:text-stone-300">
            <Gift className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">
              Sign in to view your loyalty card
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Track your stamps and earn complimentary salon services
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link href="/login?redirect=/loyalty">
              <Button size="md" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link href="/register?redirect=/loyalty">
              <Button variant="outline" size="md" className="w-full">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-padding section-padding">
        <div className="max-w-2xl mx-auto space-y-6">
          <LoyaltyCard
            data={{} as LoyaltyCardDto}
            maxStamps={MAX_STAMPS}
            isLoading={true}
          />
          <Card className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 w-40 bg-stone-200/80 dark:bg-stone-800 rounded" />
              <div className="h-3 w-64 bg-stone-200/80 dark:bg-stone-800 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-stone-100 dark:bg-stone-800/50 rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !loyaltyCard) {
    return (
      <div className="container-padding section-padding">
        <div className="max-w-md mx-auto rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 sm:p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">
              Unable to load loyalty card
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Please check your connection and try again or contact studio support.
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-padding section-padding">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Prominent Stamp Card Hero (Moment 2: Debossed Warm Cream Cardstock) */}
        <LoyaltyCard
          data={loyaltyCard}
          maxStamps={MAX_STAMPS}
          onScanQR={() => setIsScannerOpen(true)}
          onShowQR={() => setIsCustomerQROpen(true)}
          isLoading={isLoading}
        />

        {/* Voucher Redemption Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4 stroke-[1.5] text-primary" />
                Voucher redemption
              </span>
              {isComplete ? (
                <Badge variant="success" className="text-xs">
                  Voucher ready
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {stampCount} of {MAX_STAMPS} stamps
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isComplete
                ? 'Your complimentary service voucher is unlocked and ready to use'
                : `Earn ${MAX_STAMPS - stampCount} more stamps to unlock your complimentary gel set`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isComplete ? (
              <div className="space-y-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">Voucher code</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-sm font-semibold tracking-wider text-stone-900 dark:text-stone-100 tabular-nums">
                        {voucherCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyVoucher}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                        title="Copy voucher code"
                      >
                        {hasCopiedVoucher ? (
                          <Check className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCustomerQROpen(true)}
                    className="gap-1.5 text-xs w-full sm:w-auto"
                  >
                    <QrCode className="h-3.5 w-3.5 stroke-[1.5]" />
                    Present voucher QR
                  </Button>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-200/60 dark:border-stone-800/60 pt-2.5">
                  Redeemable for one complimentary gel manicure or BIAB treatment. Present this card or voucher QR to your nail artist during checkout.
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800/80 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400">Reward tier</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    Complimentary gel set
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400">Stamps required</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                    {MAX_STAMPS} stamps
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400">Current balance</span>
                  <span className="font-medium text-primary tabular-nums">
                    {stampCount} of {MAX_STAMPS} stamps earned
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Details & Visit Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 stroke-[1.5] text-stone-500" />
              Card details & activity
            </CardTitle>
            <CardDescription>
              Membership card identifiers and visit recording
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-xs">
                <span className="text-stone-500 dark:text-stone-400">Member card ID</span>
                <span className="font-mono text-stone-800 dark:text-stone-200 tabular-nums">
                  {loyaltyCard.id.slice(0, 16)}...
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-xs">
                <span className="text-stone-500 dark:text-stone-400">Last visit stamp</span>
                <span className="font-medium text-stone-800 dark:text-stone-200 tabular-nums">
                  {loyaltyCard.lastStampAt
                    ? formatDate(loyaltyCard.lastStampAt, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'No visits recorded yet'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-xs">
                <span className="text-stone-500 dark:text-stone-400">Card expiration</span>
                <span className="font-medium text-stone-800 dark:text-stone-200 tabular-nums">
                  {formatDate(loyaltyCard.expiresAt, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-xs">
                <span className="text-stone-500 dark:text-stone-400">Card status</span>
                <Badge variant="outline" className="text-xs">
                  Active member
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Info className="h-4 w-4 stroke-[1.5] text-stone-500" />
              How it works
            </CardTitle>
            <CardDescription>
              Simple three-step salon loyalty rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 space-y-1.5">
                <div className="w-7 h-7 rounded-md bg-stone-200/70 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
                  <span className="text-xs font-semibold tabular-nums">1</span>
                </div>
                <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                  Visit for service
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                  Receive 1 stamp for each completed salon appointment visit.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 space-y-1.5">
                <div className="w-7 h-7 rounded-md bg-stone-200/70 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
                  <span className="text-xs font-semibold tabular-nums">2</span>
                </div>
                <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                  Collect 10 stamps
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                  Fill the 10 stamp card wells on your digital member card.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 space-y-1.5">
                <div className="w-7 h-7 rounded-md bg-stone-200/70 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
                  <span className="text-xs font-semibold tabular-nums">3</span>
                </div>
                <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                  Redeem reward
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                  Enjoy a complimentary gel manicure set on your next visit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Customer QR Presentation Modal */}
        <Modal
          isOpen={isCustomerQROpen}
          onClose={() => setIsCustomerQROpen(false)}
          title="Member Stamp QR"
          description="Present to nail artist at checkout"
          size="sm"
        >
          <div className="space-y-4 pt-1">
            <div className="flex justify-center py-2">
              <div className="p-4 rounded-xl bg-white border border-stone-200/80 shadow-sm">
                <QRCodeSVG
                  value={loyaltyCard.id}
                  size={180}
                  level="M"
                />
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 tabular-nums">
                Card ID: {loyaltyCard.id}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Staff can scan this code to issue stamps or verify reward redemption.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCustomerQROpen(false)}
              className="w-full text-xs"
            >
              Done
            </Button>
          </div>
        </Modal>

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleAddStamp}
        />
      </div>
    </div>
  );
}
