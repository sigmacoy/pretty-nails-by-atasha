'use client';

import { LoyaltyCardDto } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Award, Crown, Sparkles, Clock } from 'lucide-react';

interface LoyaltyCardProps {
  data: LoyaltyCardDto;
  maxStamps?: number;
  onScanQR?: () => void;
  isLoading?: boolean;
}

export function LoyaltyCard({
  data,
  maxStamps = 10,
  onScanQR,
  isLoading = false,
}: LoyaltyCardProps) {
  const stampCount = data.stampCount || 0;
  const isComplete = stampCount >= maxStamps;
  const progress = Math.min(stampCount / maxStamps, 1);
  const percentage = Math.round(progress * 100);

  if (isLoading) {
    return <LoyaltyCardSkeleton />;
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-pink-500/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

      <CardContent className="relative p-6 lg:p-8 space-y-6">
        {/* Header with title and badge */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Loyalty Card
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Collect stamps and earn free services
            </p>
          </div>
          {isComplete && (
            <Badge variant="success" className="text-base px-4 py-2 gap-2">
              <Crown className="h-4 w-4" />
              Free Service Earned!
            </Badge>
          )}
        </div>

        {/* Stamp visualization */}
        <div className="relative">
          {/* Progress ring */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 lg:w-40 lg:h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress)}`}
                  className="transition-all duration-500"
                  style={{ filter: 'url(#glow)' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {stampCount}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">/{maxStamps}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {isComplete ? 'Complete!' : `${maxStamps - stampCount} more to go`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual stamp circles */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Array.from({ length: maxStamps }, (_, i) => (
              <StampCircle
                key={i}
                index={i + 1}
                isFilled={i < stampCount}
                isComplete={isComplete}
              />
            ))}
          </div>

          {/* Scan QR button */}
          {onScanQR && !isComplete && (
            <div className="text-center">
              <button
                onClick={onScanQR}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Award className="h-5 w-5" />
                Scan QR Code to Add Stamp
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Ask your nail technician for the QR code after your service
              </p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(data.expiresAt, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Stamp</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {data.lastStampAt
                  ? formatDate(data.lastStampAt, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'No stamps yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Reward message when complete */}
        {isComplete && (
          <div className="relative p-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 animate-bounce" />
              <span className="text-xl font-bold">Congratulations!</span>
              <Sparkles className="h-6 w-6 animate-bounce" />
            </div>
            <p className="text-center text-pink-100">
              You&apos;ve earned a <span className="font-semibold">free {getRewardName()}</span>!
            </p>
            <p className="text-center text-pink-100/80 text-sm mt-1">
              Present this card at your next appointment to redeem.
            </p>
            <Award className="h-12 w-12 mx-auto mt-4 opacity-80" />
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress to next reward</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{percentage}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StampCircle({ index, isFilled, isComplete }: { index: number; isFilled: boolean; isComplete: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          isFilled
            ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-pink-500 shadow-lg shadow-pink-500/25'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}
      >
        {isFilled ? (
          <Award className="h-6 w-6 text-white drop-shadow-sm" />
        ) : (
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{index}</span>
        )}
        {isComplete && isFilled && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-yellow-900" />
          </span>
        )}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {isFilled ? 'Earned' : `Stamp ${index}`}
      </span>
    </div>
  );
}

function LoyaltyCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="flex justify-center">
          <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function getRewardName(): string {
  // This could come from settings, defaulting to "service"
  return 'service';
}