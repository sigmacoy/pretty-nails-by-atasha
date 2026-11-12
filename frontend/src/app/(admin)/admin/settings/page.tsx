'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { LoyaltySettingsDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { Loader2, Save, Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<LoyaltySettingsDto>({
    stampsPerService: 1,
    stampsPerAmount: 0,
    amountThreshold: 100000,
    freeServiceReward: 'Free Gel Manicure',
    cardExpiryMonths: 12,
  });

  const { data: settingsData, isLoading, refetch } = useQuery(
    () => adminApi.getSettings(),
    { enabled: true }
  );

  const updateMutation = useMutation(
    (data: LoyaltySettingsDto) => adminApi.updateSettings(data),
    {
      onSuccess: () => {
        toast.success('Settings saved successfully');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to save settings');
      },
    }
  );

  // Update form data when settings load
  if (settingsData?.data) {
    setFormData(settingsData.data);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof LoyaltySettingsDto, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container-padding section-padding">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Loyalty Program Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure how customers earn and redeem loyalty stamps</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Loyalty Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Stamps per Service"
                type="number"
                value={formData.stampsPerService}
                onChange={(e) => handleChange('stampsPerService', parseInt(e.target.value) || 0)}
                min={0}
                max={10}
                helperText="Number of stamps earned per completed service"
              />
              <Input
                label="Stamps per Amount Threshold"
                type="number"
                value={formData.stampsPerAmount}
                onChange={(e) => handleChange('stampsPerAmount', parseInt(e.target.value) || 0)}
                min={0}
                max={10}
                helperText="Additional stamps earned when spending reaches the threshold"
              />
              <Input
                label="Amount Threshold (Centavos)"
                type="number"
                value={formData.amountThreshold}
                onChange={(e) => handleChange('amountThreshold', parseInt(e.target.value) || 0)}
                min={0}
                max={1000000}
                helperText="Spending amount in centavos (₱100 = 10000 centavos) to earn extra stamps"
              />
              <Input
                label="Card Expiry (Months)"
                type="number"
                value={formData.cardExpiryMonths}
                onChange={(e) => handleChange('cardExpiryMonths', parseInt(e.target.value) || 12)}
                min={1}
                max={24}
                helperText="Months until loyalty card expires after last stamp"
              />
            </div>

            <Input
              label="Free Service Reward"
              type="text"
              value={formData.freeServiceReward}
              onChange={(e) => handleChange('freeServiceReward', e.target.value)}
              placeholder="e.g., Free Gel Manicure"
              helperText="Name of the free service awarded when card is full"
            />

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" isLoading={updateMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Current Settings Display */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="text" className="h-8" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Stamps per Service</p>
                <p className="text-2xl font-bold text-primary">{formData.stampsPerService}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Stamps per Amount</p>
                <p className="text-2xl font-bold text-primary">{formData.stampsPerAmount}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Amount Threshold</p>
                <p className="text-2xl font-bold text-primary">₱{(formData.amountThreshold / 100).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Card Expiry</p>
                <p className="text-2xl font-bold text-primary">{formData.cardExpiryMonths} months</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}