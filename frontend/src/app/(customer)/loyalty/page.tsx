'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@/hooks/useApi';
import { loyaltyApi } from '@/lib/api';
import { LoyaltyCardDto, StampResponse } from '@/types';
import { LoyaltyCard } from '@/components/customer/LoyaltyCard';
import { QRScanner } from '@/components/loyalty/QRScanner';
import { Modal } from '@/components/ui/Modal';
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
        refetch();
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
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="max-w-md w-full rounded-3xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-8 sm:p-10 text-center space-y-6 shadow-card backdrop-blur-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-950/60 flex items-center justify-center mx-auto text-rose-800 dark:text-rose-300">
            <Gift className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold block">
              Pretty Nails by Atasha · Cebu City
            </span>
            <h2 className="text-2xl font-serif text-stone-900 dark:text-rose-50 font-normal">
              Client Loyalty Card
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
              Sign in to view your digital stamp card and collect stamps toward your complimentary gel manicure.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3 font-sans">
            <Link href="/login?redirect=/loyalty">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center h-14 px-8 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base shadow-[0_6px_24px_rgba(76,5,25,0.28)] transition-colors"
              >
                Sign In to Atelier
              </button>
            </Link>
            <Link href="/register?redirect=/loyalty">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center h-14 px-8 rounded-full border border-rose-300/80 dark:border-rose-800 bg-white/90 dark:bg-stone-800 text-stone-900 dark:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium text-base transition-colors"
              >
                Create Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="max-w-2xl mx-auto space-y-6">
          <LoyaltyCard
            data={{} as LoyaltyCardDto}
            maxStamps={MAX_STAMPS}
            isLoading={true}
          />
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-6 animate-pulse space-y-3">
            <div className="h-4 w-40 bg-rose-200/60 dark:bg-rose-950/60 rounded-full" />
            <div className="h-3 w-64 bg-stone-200/70 dark:bg-stone-800 rounded-md" />
            <div className="h-16 bg-stone-100 dark:bg-stone-800/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !loyaltyCard) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="max-w-md w-full rounded-3xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-8 sm:p-10 text-center space-y-4 shadow-card backdrop-blur-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-950/60 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-serif text-stone-900 dark:text-rose-50 font-normal">
              Unable to Load Loyalty Card
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans">
              Please check your connection and try again or contact studio staff.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center justify-center h-10 px-6 rounded-full border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors selection:bg-rose-200 selection:text-rose-950">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Editorial Page Header */}
        <div className="text-center sm:text-left">
          <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold mb-2 block">
            Client Rewards Atelier · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-900 dark:text-rose-50 font-normal tracking-tight">
            Studio Loyalty Card
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
            Every completed salon appointment stamps your digital card. 10 stamps unlock a complimentary gel manicure or structured BIAB overlay.
          </p>
        </div>

        {/* Physical Aesthetic Loyalty Stamp Card Hero */}
        <LoyaltyCard
          data={loyaltyCard}
          maxStamps={MAX_STAMPS}
          onScanQR={() => setIsScannerOpen(true)}
          onShowQR={() => setIsCustomerQROpen(true)}
          isLoading={isLoading}
        />

        {/* Voucher Redemption Card */}
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-6 sm:p-7 shadow-card backdrop-blur-sm space-y-4 font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-rose-200/70 dark:border-rose-950/60">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300" />
              <h2 className="text-lg sm:text-xl font-serif text-stone-900 dark:text-rose-50 font-normal">
                Voucher Redemption
              </h2>
            </div>
            {isComplete ? (
              <Badge variant="success" className="text-xs rounded-full px-3 py-1">
                Voucher Ready
              </Badge>
            ) : (
              <span className="text-xs font-sans font-medium px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60 tabular-nums">
                {stampCount} / {MAX_STAMPS} stamps
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            {isComplete
              ? 'Your complimentary service voucher is unlocked and ready to use for your next session.'
              : `Earn ${MAX_STAMPS - stampCount} more stamps to unlock your complimentary structured BIAB or gel manicure treatment.`}
          </p>

          {isComplete ? (
            <div className="space-y-3 p-4 rounded-xl bg-rose-50/70 dark:bg-stone-900/60 border border-rose-200/80 dark:border-rose-950/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Voucher code</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base font-semibold tracking-wider text-rose-950 dark:text-rose-100 tabular-nums">
                      {voucherCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyVoucher}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                      title="Copy voucher code"
                    >
                      {hasCopiedVoucher ? (
                        <Check className="h-4 w-4 stroke-[1.5] text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4 stroke-[1.5]" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerQROpen(true)}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-full border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-800 dark:text-stone-200 text-xs font-medium gap-1.5 transition-colors shadow-xs"
                >
                  <QrCode className="h-3.5 w-3.5 stroke-[1.5]" />
                  Present Voucher QR
                </button>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed border-t border-rose-200/60 dark:border-rose-950/50 pt-2.5">
                Redeemable for one complimentary gel manicure or structured BIAB treatment. Present this card or voucher QR to your nail artist during checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 p-4 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500 dark:text-stone-400">Reward tier</span>
                <span className="font-medium text-stone-900 dark:text-stone-100">
                  Complimentary gel set or BIAB overlay
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
                <span className="font-medium text-rose-800 dark:text-rose-300 tabular-nums">
                  {stampCount} / {MAX_STAMPS} stamps earned
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card Details & Visit Activity */}
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-6 sm:p-7 shadow-card backdrop-blur-sm space-y-4 font-sans">
          <div className="pb-3 border-b border-rose-200/70 dark:border-rose-950/60">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300" />
              <h2 className="text-lg sm:text-xl font-serif text-stone-900 dark:text-rose-50 font-normal">
                Card Details & Activity
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Membership card identifiers and appointment visit history.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 text-xs">
              <span className="text-stone-500 dark:text-stone-400">Member card ID</span>
              <span className="font-mono text-stone-800 dark:text-stone-200 tabular-nums">
                {loyaltyCard.id.slice(0, 16)}...
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 text-xs">
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

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 text-xs">
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

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 text-xs">
              <span className="text-stone-500 dark:text-stone-400">Membership status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60">
                Active Client
              </span>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-900/95 p-6 sm:p-7 shadow-card backdrop-blur-sm space-y-4 font-sans">
          <div className="pb-3 border-b border-rose-200/70 dark:border-rose-950/60">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300" />
              <h2 className="text-lg sm:text-xl font-serif text-stone-900 dark:text-rose-50 font-normal">
                How It Works
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Three simple steps to earn atelier loyalty rewards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 space-y-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/70 flex items-center justify-center text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60">
                <span className="text-xs font-serif font-semibold tabular-nums">1</span>
              </div>
              <p className="text-xs font-medium text-stone-900 dark:text-rose-50">
                Visit for session
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                Receive 1 stamp for each completed private salon appointment visit.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 space-y-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/70 flex items-center justify-center text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60">
                <span className="text-xs font-serif font-semibold tabular-nums">2</span>
              </div>
              <p className="text-xs font-medium text-stone-900 dark:text-rose-50">
                Collect 10 stamps
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                Fill the 10 tactile debossed stamp card wells on your digital member card.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50 space-y-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/70 flex items-center justify-center text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60">
                <span className="text-xs font-serif font-semibold tabular-nums">3</span>
              </div>
              <p className="text-xs font-medium text-stone-900 dark:text-rose-50">
                Redeem reward
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                Enjoy a complimentary gel manicure set or BIAB overlay on your next visit.
              </p>
            </div>
          </div>
        </div>

        {/* Member QR Presentation Modal */}
        <Modal
          isOpen={isCustomerQROpen}
          onClose={() => setIsCustomerQROpen(false)}
          title="Member Stamp QR"
          description="Present to nail artist during checkout to record your visit."
          size="sm"
        >
          <div className="space-y-4 pt-1 font-sans">
            <div className="flex justify-center py-2">
              <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-card">
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
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Staff scans this QR code to issue stamps or verify reward redemption.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomerQROpen(false)}
              className="w-full inline-flex items-center justify-center h-10 px-5 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium transition-colors shadow-xs"
            >
              Done
            </button>
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
