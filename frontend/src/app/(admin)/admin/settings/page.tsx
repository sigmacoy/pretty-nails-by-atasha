'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { LoyaltySettingsDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import {
  Sliders,
  Award,
  Clock,
  DollarSign,
  Shield,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';

const INITIAL_DEFAULTS: LoyaltySettingsDto = {
  stampsPerService: 1,
  stampsPerAmount: 0,
  amountThreshold: 100000,
  freeServiceReward: 'Free Gel Manicure',
  cardExpiryMonths: 12,
};

const AMOUNT_PRESETS = [
  { label: '₱500', value: 50000 },
  { label: '₱1,000', value: 100000 },
  { label: '₱1,500', value: 150000 },
  { label: '₱2,000', value: 200000 },
];

const EXPIRY_PRESETS = [
  { label: '6 months', value: 6 },
  { label: '12 months', value: 12 },
  { label: '24 months', value: 24 },
];

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<LoyaltySettingsDto>(INITIAL_DEFAULTS);

  const { data: settingsData, isLoading, refetch } = useQuery(
    () => adminApi.getSettings(),
    { enabled: true }
  );

  const updateMutation = useMutation(
    (data: LoyaltySettingsDto) => adminApi.updateSettings(data),
    {
      onSuccess: () => {
        toast.success('Settings saved successfully');
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to save settings');
      },
    }
  );

  // Synchronize form data when settings load without render loops
  useEffect(() => {
    if (settingsData?.data) {
      setFormData(settingsData.data);
    }
  }, [settingsData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof LoyaltySettingsDto, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (settingsData?.data) {
      setFormData(settingsData.data);
      toast.info('Changes reset to saved values');
    } else {
      setFormData(INITIAL_DEFAULTS);
    }
  };

  const activeSaved = settingsData?.data || INITIAL_DEFAULTS;
  const isDirty = JSON.stringify(formData) !== JSON.stringify(activeSaved);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Studio administration
            </span>
            {isDirty && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                Unsaved changes
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Loyalty settings
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Configure stamp rules, reward definitions, and card expiration periods for Pretty Nails by Atasha.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={updateMutation.isPending}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" strokeWidth={1.5} />
              Reset changes
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Domain 1: Loyalty rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                <Sliders className="h-4 w-4 text-stone-600 dark:text-stone-400" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle>Loyalty rules</CardTitle>
                <CardDescription>
                  Rules governing how clients earn digital stamps on each appointment visit
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Stamps per service"
                type="number"
                value={formData.stampsPerService}
                onChange={(e) => handleChange('stampsPerService', parseInt(e.target.value, 10) || 0)}
                min={0}
                max={10}
                helperText="Base stamps awarded for each completed appointment service"
              />
              <Input
                label="Stamps per amount threshold"
                type="number"
                value={formData.stampsPerAmount}
                onChange={(e) => handleChange('stampsPerAmount', parseInt(e.target.value, 10) || 0)}
                min={0}
                max={10}
                helperText="Additional bonus stamps awarded when visit spend reaches the threshold"
              />
            </div>

            <div className="space-y-2 pt-1">
              <Input
                label="Amount threshold (centavos)"
                type="number"
                value={formData.amountThreshold}
                onChange={(e) => handleChange('amountThreshold', parseInt(e.target.value, 10) || 0)}
                min={0}
                max={1000000}
                step={1000}
                helperText="Spending amount in centavos required to trigger additional bonus stamps"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <span>Equivalent threshold:</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                    ₱{(formData.amountThreshold / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-400 dark:text-stone-500 mr-1">Presets:</span>
                  {AMOUNT_PRESETS.map((preset) => {
                    const isSelected = formData.amountThreshold === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleChange('amountThreshold', preset.value)}
                        className={`text-xs px-2 py-1 rounded-md transition-colors duration-150 tabular-nums ${
                          isSelected
                            ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain 2: Reward definitions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                <Award className="h-4 w-4 text-stone-600 dark:text-stone-400" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle>Reward definitions</CardTitle>
                <CardDescription>
                  Complimentary service granted when a client completes their stamp card
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Complimentary service reward"
              type="text"
              value={formData.freeServiceReward}
              onChange={(e) => handleChange('freeServiceReward', e.target.value)}
              placeholder="e.g. Free Gel Manicure"
              helperText="Name of the salon service awarded when the customer fills their 10-stamp loyalty card"
            />

            <div className="rounded-lg border border-stone-200/70 dark:border-stone-800/70 bg-stone-50/60 dark:bg-stone-900/30 p-3.5 flex items-start gap-3">
              <Info className="h-4 w-4 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                <p className="font-medium text-stone-800 dark:text-stone-200 mb-0.5">Stamp target policy</p>
                The standard salon stamp card targets <span className="font-medium text-stone-800 dark:text-stone-200 tabular-nums">10 stamps</span>. Upon reaching 10 stamps, the customer can redeem this complimentary service during their appointment check-out.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain 3: System preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-stone-600 dark:text-stone-400" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle>System preferences</CardTitle>
                <CardDescription>
                  Card validity periods, audit protections, and expiration rules
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                label="Card expiration period (months)"
                type="number"
                value={formData.cardExpiryMonths}
                onChange={(e) => handleChange('cardExpiryMonths', parseInt(e.target.value, 10) || 12)}
                min={1}
                max={36}
                helperText="Number of months of inactivity after last visit before loyalty stamps expire"
              />

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs text-stone-400 dark:text-stone-500 mr-1">Presets:</span>
                {EXPIRY_PRESETS.map((preset) => {
                  const isSelected = formData.cardExpiryMonths === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleChange('cardExpiryMonths', preset.value)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors duration-150 tabular-nums ${
                        isSelected
                          ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-stone-200/70 dark:border-stone-800/70 bg-stone-50/60 dark:bg-stone-900/30 p-3.5 flex items-start gap-3">
              <Shield className="h-4 w-4 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                <p className="font-medium text-stone-800 dark:text-stone-200 mb-0.5">Audit and verification</p>
                All stamp additions and reward redemptions require salon cashier authorization via QR scanner. Expirations are evaluated automatically based on the last recorded stamp timestamp.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-card">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Saved changes take effect immediately across all customer loyalty profiles.
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={updateMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} />
              Save settings
            </Button>
          </div>
        </div>
      </form>

      {/* Domain 4: Current Configuration Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
              <DollarSign className="h-4 w-4 text-stone-600 dark:text-stone-400" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle>Current configuration overview</CardTitle>
              <CardDescription>
                Live summary of active parameters currently applied to customer stamp cards
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/40 dark:bg-stone-900/20 space-y-2">
                  <Skeleton variant="text" width="60%" className="h-3" />
                  <Skeleton variant="text" width="40%" className="h-6" />
                  <Skeleton variant="text" width="75%" className="h-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Stamps per service</p>
                <p className="text-xl sm:text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                  {formData.stampsPerService}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">base earning</p>
              </div>

              <div className="p-4 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Spend bonus</p>
                <p className="text-xl sm:text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                  {formData.stampsPerAmount > 0 ? `+${formData.stampsPerAmount}` : '0'}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                  at ₱{(formData.amountThreshold / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })} spend
                </p>
              </div>

              <div className="p-4 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Card expiration</p>
                <p className="text-xl sm:text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                  {formData.cardExpiryMonths} <span className="text-sm font-normal text-stone-500 dark:text-stone-400">mo</span>
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">validity period</p>
              </div>

              <div className="p-4 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Reward service</p>
                <p className="text-sm sm:text-base font-medium text-stone-900 dark:text-stone-100 truncate" title={formData.freeServiceReward}>
                  {formData.freeServiceReward || 'None'}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">at 10 stamps target</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
