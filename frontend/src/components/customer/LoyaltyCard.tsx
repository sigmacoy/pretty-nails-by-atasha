'use client';

import { LoyaltyCardDto } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Clock, Check, Gift, QrCode } from 'lucide-react';

interface LoyaltyCardProps {
  data: LoyaltyCardDto;
  maxStamps?: number;
  onScanQR?: () => void;
  onShowQR?: () => void;
  isLoading?: boolean;
}

/**
 * Signature lacquer drop glyph mark: an organic teardrop dot
 * representing the studio manicure lacquer seal signature.
 */
function LacquerDropMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1.5C8 1.5 3.5 6.5 3.5 10a4.5 4.5 0 0 0 9 0c0-3.5-4.5-8.5-4.5-8.5z" />
    </svg>
  );
}

export function LoyaltyCard({
  data,
  maxStamps = 10,
  onScanQR,
  onShowQR,
  isLoading = false,
}: LoyaltyCardProps) {
  const stampCount = data.stampCount || 0;
  const isComplete = stampCount >= maxStamps;
  const remaining = Math.max(0, maxStamps - stampCount);
  const progress = Math.min(stampCount / maxStamps, 1);
  const percentage = Math.round(progress * 100);

  if (isLoading) {
    return <LoyaltyCardSkeleton />;
  }

  return (
    <div className="relative rounded-3xl border border-rose-300/80 dark:border-rose-900/60 bg-[#FDFBF7] dark:bg-[#1A1316] text-stone-900 dark:text-stone-100 shadow-[0_12px_40px_rgba(76,5,25,0.08)] overflow-hidden">
      {/* Delicate tactile blind-debossed inner framing */}
      <div className="m-3 sm:m-4 p-5 sm:p-7 rounded-2xl border border-rose-200/70 dark:border-rose-950/60 bg-white/50 dark:bg-stone-900/40 backdrop-blur-xs space-y-6">
        {/* Studio Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-5 border-b border-rose-200/70 dark:border-rose-950/60">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-rose-800 dark:text-rose-300">
              <LacquerDropMark className="h-3.5 w-3.5 text-rose-900 dark:text-rose-400 shrink-0" />
              <span>Pretty Nails by Atasha · Cebu City</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 dark:text-rose-50 font-normal tracking-tight">
              Studio Loyalty Stamp Card
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans">
              {isComplete
                ? 'All 10 stamps earned · Complimentary gel reward unlocked'
                : `${stampCount} / ${maxStamps} stamps earned · ${remaining} remaining for complimentary gel set`}
            </p>
          </div>
          <div>
            {isComplete ? (
              <Badge variant="success" className="gap-1.5 text-xs py-1 px-3 rounded-full font-medium">
                <Check className="h-3.5 w-3.5 stroke-[1.5]" />
                Reward Unlocked
              </Badge>
            ) : (
              <span className="inline-flex items-center text-xs font-sans font-medium py-1 px-3 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60 tabular-nums">
                {stampCount} / {maxStamps} stamps
              </span>
            )}
          </div>
        </div>

        {/* Tactile Stamp Grid: 2 rows x 5 columns with debossed stamp wells */}
        <div className="space-y-5">
          <div className="grid grid-cols-5 gap-3 sm:gap-4 justify-items-center max-w-md mx-auto">
            {Array.from({ length: maxStamps }, (_, i) => {
              const isStamped = i < stampCount;
              const isRewardWell = i === maxStamps - 1;
              return (
                <StampWell
                  key={i}
                  index={i + 1}
                  isStamped={isStamped}
                  isReward={isRewardWell}
                />
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="space-y-2 max-w-md mx-auto w-full pt-1 font-sans">
            <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              <span>Card progress</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {stampCount} / {maxStamps} stamps ({percentage}%)
              </span>
            </div>
            <div className="h-2 bg-rose-100 dark:bg-rose-950/60 rounded-full overflow-hidden border border-rose-200/60 dark:border-rose-900/40">
              <div
                className="h-full bg-rose-900 dark:bg-rose-800 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {(onShowQR || onScanQR) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-sans">
            {onShowQR && (
              <button
                type="button"
                onClick={onShowQR}
                className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-5 rounded-full border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-800 dark:text-stone-200 text-xs font-medium gap-2 transition-colors shadow-xs"
              >
                <QrCode className="h-4 w-4 stroke-[1.5]" />
                Present Member QR
              </button>
            )}
            {onScanQR && !isComplete && (
              <button
                type="button"
                onClick={onScanQR}
                className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-5 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium gap-2 transition-colors shadow-xs"
              >
                <QrCode className="h-4 w-4 stroke-[1.5]" />
                Scan Studio QR
              </button>
            )}
          </div>
        )}

        {/* 10-Stamp Complimentary Gel Reward Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-stone-900/60 border border-rose-200/80 dark:border-rose-950/60 flex items-start gap-3.5 font-sans">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 shrink-0 border border-rose-200 dark:border-rose-800">
            <Gift className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-serif font-medium text-sm text-stone-900 dark:text-rose-50">
              10-Stamp Complimentary Gel Reward
            </p>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
              10 completed appointments unlock a complimentary structured BIAB overlay or gel manicure treatment. Present this card or your member QR code to your nail artist during checkout to redeem.
            </p>
          </div>
        </div>

        {/* Card Details Footer */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-rose-200/70 dark:border-rose-950/60 text-xs font-sans">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50">
            <Clock className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Card Expiration</p>
              <p className="font-medium text-stone-800 dark:text-stone-200 truncate tabular-nums">
                {formatDate(data.expiresAt, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50/80 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/50">
            <Check className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Last Atelier Visit</p>
              <p className="font-medium text-stone-800 dark:text-stone-200 truncate tabular-nums">
                {data.lastStampAt
                  ? formatDate(data.lastStampAt, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No visits yet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tactile debossed stamp well circle:
 * Debossed circular well with inset shadow. Stamped state displays
 * a rich lacquer rose seal impression with atelier monogram.
 */
function StampWell({
  index,
  isStamped,
  isReward,
}: {
  index: number;
  isStamped: boolean;
  isReward: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 font-sans">
      <div
        className={cn(
          'relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200',
          isStamped
            ? 'bg-rose-900 text-white shadow-[0_3px_12px_rgba(136,19,55,0.38)] ring-2 ring-rose-800/40 border border-rose-700/80 scale-[1.02]'
            : 'bg-rose-50/70 dark:bg-stone-950/70 border border-rose-200/80 dark:border-rose-950/60 text-stone-400 dark:text-stone-500 shadow-[inset_0_2px_4px_rgba(76,5,25,0.08)] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]'
        )}
        title={isStamped ? `Stamp ${index} verified` : isReward ? 'Complimentary Gel Reward' : `Stamp well ${index}`}
      >
        {isStamped ? (
          <div className="flex flex-col items-center justify-center">
            <span className="font-serif italic font-normal text-xs sm:text-sm text-rose-100">PN</span>
            <span className="text-[8px] uppercase tracking-widest text-rose-200/80 font-sans">Seal</span>
          </div>
        ) : isReward ? (
          <Gift className="h-5 w-5 stroke-[1.5] text-rose-800/80 dark:text-rose-400/80" />
        ) : (
          <span className="text-xs font-serif font-medium tabular-nums text-stone-400 dark:text-stone-500">
            {index}
          </span>
        )}
      </div>
      <span className="text-[10px] font-sans font-medium text-stone-500 dark:text-stone-400 tabular-nums">
        {isStamped ? 'Stamped' : isReward ? 'Reward' : `${index}`}
      </span>
    </div>
  );
}

export function LoyaltyCardSkeleton() {
  return (
    <div className="rounded-3xl border border-rose-200/80 dark:border-rose-950/60 bg-[#FDFBF7] dark:bg-[#1A1316] p-6 sm:p-8 space-y-6">
      <div className="flex justify-between items-start gap-4 pb-5 border-b border-rose-200/70 dark:border-rose-950/60">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-rose-200/60 dark:bg-rose-950/60 rounded-full animate-pulse" />
          <div className="h-7 w-52 bg-stone-200/80 dark:bg-stone-800 rounded-xl animate-pulse" />
          <div className="h-3.5 w-40 bg-stone-200/60 dark:bg-stone-800/70 rounded-md animate-pulse" />
        </div>
        <div className="h-6 w-24 bg-stone-200/80 dark:bg-stone-800 rounded-full animate-pulse" />
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-5 gap-3 sm:gap-4 justify-items-center max-w-md mx-auto">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-stone-200/70 dark:bg-stone-800 animate-pulse" />
              <div className="h-2 w-4 bg-stone-200/60 dark:bg-stone-800 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="h-2 max-w-md mx-auto w-full bg-stone-200/70 dark:bg-stone-800 rounded-full animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-rose-200/70 dark:border-rose-950/60">
        <div className="h-14 bg-stone-200/70 dark:bg-stone-800 rounded-xl animate-pulse" />
        <div className="h-14 bg-stone-200/70 dark:bg-stone-800 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default LoyaltyCard;
