'use client';

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { loyaltyApi } from '@/lib/api';
import { LoyaltyCardDto, StampResponse } from '@/types';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { QRScanner } from '@/components/loyalty/QRScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Gift, Shield, Sparkles, Info, AlertCircle } from 'lucide-react';

const MAX_STAMPS = 10;

export default function LoyaltyPage() {
  const { isAuthenticated } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddingStamp, setIsAddingStamp] = useState(false);

  const { data: loyaltyData, isLoading, error, refetch } = useQuery(
    () => loyaltyApi.getCard(),
    { enabled: isAuthenticated }
  );

  const loyaltyCard = loyaltyData?.data;
  const stampCount = loyaltyCard?.stampCount || 0;
  const isComplete = stampCount >= MAX_STAMPS;

  const handleAddStamp = async (qrCode: string) => {
    setIsAddingStamp(true);
    try {
      const response = await loyaltyApi.addStamp(qrCode);
      const result = response.data as StampResponse;

      if (result.success) {
        toast.success(result.message || 'Stamp added successfully!');
        refetch(); // Refresh the loyalty card data
      } else {
        toast.error(result.message || 'Failed to add stamp. Please try again.');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to add stamp. Please try again.');
    } finally {
      setIsAddingStamp(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-padding section-padding">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Gift className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Sign in to view your Loyalty Card
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Track your stamps and earn free services
            </p>
            <div className="flex flex-col gap-3">
              <a href="/login?redirect=/loyalty">
                <Button size="lg" className="w-full">
                  Sign In
                </Button>
              </a>
              <a href="/register?redirect=/loyalty">
                <Button variant="outline" size="lg" className="w-full">
                  Create Account
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-padding section-padding">
        <div className="max-w-2xl mx-auto space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-padding section-padding">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Unable to load loyalty card
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please try again later or contact support.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-padding section-padding">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Loyalty Card */}
        <LoyaltyCard
          data={loyaltyCard!}
          maxStamps={MAX_STAMPS}
          onScanQR={() => setIsScannerOpen(true)}
          isLoading={isLoading}
        />

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <div className="h-12 w-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mx-auto mb-3">
                  <Gift className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Get Stamps</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Earn 1 stamp per service visit
                </p>
              </div>
              <div className="p-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Collect {MAX_STAMPS}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Fill your card with {MAX_STAMPS} stamps
                </p>
              </div>
              <div className="p-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Redeem Reward</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Get a free service on us!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Card Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Card ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {loyaltyCard?.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(loyaltyCard!.expiresAt, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {isComplete && (
                  <Badge variant="success">Reward Ready</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reward</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Free Service ({MAX_STAMPS} stamps)
                    </p>
                  </div>
                </div>
                <Badge variant={isComplete ? 'success' : 'default'}>
                  {isComplete ? 'Ready to Redeem' : `${stampCount}/${MAX_STAMPS}`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4 animate-pulse">
        <div className="flex justify-between">
          <SkeletonText lines={2} />
          <Skeleton variant="rectangular" width="80px" height="32px" />
        </div>
        <Skeleton variant="circular" width={128} height={128} className="mx-auto" />
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} variant="circular" width={48} height={48} />
          ))}
        </div>
        <Skeleton variant="rectangular" height={48} />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton variant="rectangular" height={64} />
          <Skeleton variant="rectangular" height={64} />
        </div>
      </CardContent>
    </Card>
  );
}