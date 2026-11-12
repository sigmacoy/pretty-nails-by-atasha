'use client';

import { LoyaltyCardDto } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
 * representing the manicure lacquer drop studio signature.
 */
function LacquerDropMark({ className = 'h-3.5 w-3.5' }: { className?: string }) {
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
    <div className="relative rounded-2xl border border-stone-200/90 dark:border-stone-800/80 bg-[#FDFBF7] dark:bg-[#1E1C1A] text-stone-900 dark:text-stone-100 shadow-[0_1px_3px_rgba(28,25,23,0.04)] overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Studio Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-5 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
              <LacquerDropMark className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Pretty Nails by Atasha</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Loyalty Stamp Card
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              {isComplete
                ? '10 of 10 stamps earned'
                : `${stampCount} of ${maxStamps} stamps earned`}
            </p>
          </div>
          <div>
            {isComplete ? (
              <Badge variant="success" className="gap-1.5 text-xs py-1 px-2.5">
                <Check className="h-3.5 w-3.5 stroke-[1.5]" />
                Free service unlocked
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs tabular-nums py-1 px-2.5">
                {remaining} {remaining === 1 ? 'stamp' : 'stamps'} to free gel set
              </Badge>
            )}
          </div>
        </div>

        {/* Tactile Stamp Grid: 2 rows x 5 columns with 10px-12px gap */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3 justify-items-center max-w-sm mx-auto">
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

          {/* Progress bar */}
          <div className="space-y-1.5 max-w-sm mx-auto w-full pt-1">
            <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              <span>Card progress</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {stampCount}/{maxStamps} ({percentage}%)
              </span>
            </div>
            <div className="h-1.5 bg-stone-200/80 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {(onShowQR || onScanQR) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            {onShowQR && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onShowQR}
                className="w-full sm:w-auto gap-2 text-xs"
              >
                <QrCode className="h-4 w-4 stroke-[1.5]" />
                Present Member QR
              </Button>
            )}
            {onScanQR && !isComplete && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onScanQR}
                className="w-full sm:w-auto gap-2 text-xs"
              >
                <QrCode className="h-4 w-4 stroke-[1.5]" />
                Scan Studio QR
              </Button>
            )}
          </div>
        )}

        {/* Reward Unlocked Notice */}
        {isComplete && (
          <div className="p-4 rounded-xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Gift className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div className="space-y-0.5 text-xs">
              <p className="font-medium text-stone-900 dark:text-stone-100">
                Free service unlocked
              </p>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                You have earned a complimentary gel service. Present your member QR or card ID at your next appointment to redeem.
              </p>
            </div>
          </div>
        )}

        {/* Card Details Footer */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-200/80 dark:border-stone-800/80 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-stone-100/60 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
            <Clock className="h-4 w-4 stroke-[1.5] text-stone-500 dark:text-stone-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Expires</p>
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

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-stone-100/60 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
            <Check className="h-4 w-4 stroke-[1.5] text-stone-500 dark:text-stone-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Last visit</p>
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
 * Nested stamp well: circular deboss 40px diameter (w-10 h-10) with subtle inset border.
 * Stamped well has solid lacquer rose fill #BE185D with studio drop mark.
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
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          'relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors duration-150',
          isStamped
            ? 'bg-[#BE185D] text-white shadow-sm ring-1 ring-[#BE185D]/30'
            : 'bg-stone-100/90 dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-800 text-stone-400 dark:text-stone-500 shadow-[inset_0_1.5px_2px_rgba(28,25,23,0.06)] dark:shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.35)]'
        )}
        title={isStamped ? `Stamp ${index} recorded` : `Stamp ${index}`}
      >
        {isStamped ? (
          <LacquerDropMark className="h-4 w-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" />
        ) : isReward ? (
          <Gift className="h-4 w-4 stroke-[1.5] text-stone-400 dark:text-stone-500" />
        ) : (
          <span className="text-xs font-medium tabular-nums text-stone-400 dark:text-stone-500">
            {index}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 tabular-nums">
        {isStamped ? 'Stamped' : isReward ? 'Reward' : `${index}`}
      </span>
    </div>
  );
}

function LoyaltyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-[#FDFBF7] dark:bg-[#1E1C1A] p-6 sm:p-8 space-y-6">
      <div className="flex justify-between items-start gap-4 pb-5 border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-stone-200/80 dark:bg-stone-800 rounded animate-pulse" />
          <div className="h-6 w-44 bg-stone-200/80 dark:bg-stone-800 rounded animate-pulse" />
          <div className="h-3.5 w-32 bg-stone-200/80 dark:bg-stone-800 rounded animate-pulse" />
        </div>
        <div className="h-6 w-24 bg-stone-200/80 dark:bg-stone-800 rounded-full animate-pulse" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-2.5 sm:gap-3 justify-items-center max-w-sm mx-auto">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-200/80 dark:bg-stone-800 animate-pulse" />
              <div className="h-2 w-4 bg-stone-200/80 dark:bg-stone-800 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="h-1.5 max-w-sm mx-auto w-full bg-stone-200/80 dark:bg-stone-800 rounded-full animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-200/80 dark:border-stone-800/80">
        <div className="h-12 bg-stone-200/80 dark:bg-stone-800 rounded-lg animate-pulse" />
        <div className="h-12 bg-stone-200/80 dark:bg-stone-800 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
