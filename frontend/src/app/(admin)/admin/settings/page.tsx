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
  ShieldCheck,
  Save,
  RotateCcw,
  Building2,
  CreditCard,
  HeartPulse,
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
    <div className="space-y-8 -m-4 sm:-m-6 lg:-m-8 p-6 sm:p-8 lg:p-10 min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950 transition-colors pb-16">
      {/* Standard Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Studio Configuration & Policies
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Manage studio identity parameters, reservation deposit guidelines, dry autoclave sterilization protocols, and loyalty stamp rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-white/80 dark:bg-stone-900/80 text-xs font-medium text-rose-900 dark:text-rose-200 shadow-xs">
            Studio Administration
          </span>
          {isDirty && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
              Unsaved changes
            </span>
          )}
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={updateMutation.isPending}
              className="h-12 px-6 rounded-full border-rose-300/80 dark:border-rose-800/80 text-xs font-medium gap-2"
            >
              <RotateCcw className="h-4 w-4 stroke-[1.5]" />
              Reset changes
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
        {/* Domain 1: Atelier Identity & Location */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
          <CardHeader className="border-b border-rose-200/60 dark:border-rose-950/50 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
                <Building2 className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <CardTitle className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
                  1. Atelier Identity & Location
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Private sanctuary profile, physical atelier address, and 1-on-1 booking model
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-sans">Official Studio Name</span>
                <p className="font-serif font-medium text-base text-stone-900 dark:text-rose-100">
                  Pretty Nails by Atasha · Cebu City
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Private 1-on-1 nail atelier sanctuary
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-sans">Location & Sanctuary Notice</span>
                <p className="font-sans font-medium text-xs text-stone-900 dark:text-rose-100">
                  Cebu City, Central Visayas, Philippines
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Private residence atelier, exact address provided upon deposit verification
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-white/70 dark:bg-stone-900/50 text-xs text-stone-600 dark:text-stone-300 leading-relaxed space-y-1">
              <p className="font-semibold text-stone-900 dark:text-rose-100">Private 1-on-1 Atelier Model:</p>
              <p className="text-stone-600 dark:text-stone-300 font-sans">
                Each appointment is booked exclusively for one client at a time. No double-booking or walk-in queue overlaps are allowed. A mandatory 15-minute buffer is scheduled between clients for room sanitation and tool sterilization.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Domain 2: Reservation & Deposit Policy */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
          <CardHeader className="border-b border-rose-200/60 dark:border-rose-950/50 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
                <CreditCard className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <CardTitle className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
                  2. Reservation & Deposit Policy
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Manual GCash & Maya transfer verification workflow and deposit terms
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-sans">Standard Reservation Deposit</span>
                <p className="font-mono font-semibold text-lg text-stone-900 dark:text-rose-100 tabular-nums">
                  ₱100.00
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                  Credited toward final counter balance
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-sans">Confirmation Mode</span>
                <p className="font-sans font-semibold text-xs text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                  Manual Verification Only
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                  Instant automatic slot confirmation is permanently disabled
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-200/70 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-xs text-stone-700 dark:text-stone-300 leading-relaxed space-y-2">
              <p className="font-semibold text-rose-950 dark:text-rose-100">Manual Verification Protocol:</p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-300 font-sans">
                <li>Clients submit a GCash or Maya payment transaction reference upon checkout.</li>
                <li>Studio staff reviews payment references manually against transaction statements before changing status from Pending to Confirmed.</li>
                <li>Clients may reschedule up to 24 hours prior to appointment without forfeiting their reservation deposit.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Domain 3: Hygiene & Sanitation Protocol */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
          <CardHeader className="border-b border-rose-200/60 dark:border-rose-950/50 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
                <HeartPulse className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <CardTitle className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
                  3. Hygiene & Sanitation Protocol
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Hospital-grade dry autoclave sterilization standards and single-use tool policies
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-sans">Metal Implements</span>
                <p className="font-sans font-semibold text-xs text-stone-900 dark:text-rose-100">
                  Dry Autoclave Cycle
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  160°C medical sterilization with chemical indicator verification
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-sans">Client Pouch Unsealing</span>
                <p className="font-sans font-semibold text-xs text-stone-900 dark:text-rose-100">
                  Unsealed In Client Presence
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Sterilized pouch opened only at beginning of appointment
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-sans">Abrasives & Buffers</span>
                <p className="font-sans font-semibold text-xs text-stone-900 dark:text-rose-100">
                  Single-Use Disposable
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Never reused between clients; client may take home or discard
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-white/70 dark:bg-stone-900/50 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[1.5]" />
              <p className="leading-relaxed font-sans">
                Sanitation records and autoclave test strips are logged weekly. Non-metal implements (nail files, orange wood sticks, lint-free wipes) are never shared between clients.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Domain 4: Loyalty Stamp Program Parameters */}
        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
          <CardHeader className="border-b border-rose-200/60 dark:border-rose-950/50 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
                <Sliders className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <CardTitle className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
                  4. Loyalty Stamp Program Parameters
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Configure digital stamp earning rates, threshold spend triggers, and complimentary rewards
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Stamps per completed service"
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

            <div className="space-y-3 pt-1">
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-sans">
                  <span>Equivalent threshold:</span>
                  <span className="font-mono font-medium text-stone-900 dark:text-rose-100 tabular-nums">
                    ₱{(formData.amountThreshold / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 dark:text-stone-500 mr-1 font-sans">Presets:</span>
                  {AMOUNT_PRESETS.map((preset) => {
                    const isSelected = formData.amountThreshold === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleChange('amountThreshold', preset.value)}
                        className={`text-xs h-10 px-4 rounded-full transition-colors tabular-nums border font-medium ${
                          isSelected
                            ? 'bg-rose-900 text-white border-rose-800 shadow-sm'
                            : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-rose-200 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-rose-200/60 dark:border-rose-950/50">
              <Input
                label="Complimentary service reward"
                type="text"
                value={formData.freeServiceReward}
                onChange={(e) => handleChange('freeServiceReward', e.target.value)}
                placeholder="e.g. Free Gel Manicure"
                helperText="Name of the salon service awarded when the customer fills their 10-stamp loyalty card"
              />

              <div className="rounded-2xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-4 flex items-start gap-3">
                <Award className="h-5 w-5 text-rose-800 dark:text-rose-300 shrink-0 mt-0.5 stroke-[1.5]" />
                <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                  <p className="font-semibold text-stone-900 dark:text-rose-100 mb-0.5">Physical Stamp Card Aesthetic Policy:</p>
                  The standard atelier loyalty card targets <span className="font-mono font-semibold text-rose-900 dark:text-rose-300 tabular-nums">10 stamps</span>. Upon reaching 10 stamps, the customer can redeem this complimentary service during their appointment check-out.
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-rose-200/60 dark:border-rose-950/50">
              <Input
                label="Card expiration period (months)"
                type="number"
                value={formData.cardExpiryMonths}
                onChange={(e) => handleChange('cardExpiryMonths', parseInt(e.target.value, 10) || 12)}
                min={1}
                max={36}
                helperText="Number of months of inactivity after last visit before loyalty stamps expire"
              />

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-stone-400 dark:text-stone-500 mr-1 font-sans">Presets:</span>
                {EXPIRY_PRESETS.map((preset) => {
                  const isSelected = formData.cardExpiryMonths === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleChange('cardExpiryMonths', preset.value)}
                      className={`text-xs h-10 px-4 rounded-full transition-colors tabular-nums border font-medium ${
                        isSelected
                          ? 'bg-rose-900 text-white border-rose-800 shadow-sm'
                          : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-rose-200 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Action Bar */}
        <div className="p-5 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-[#1A0E15]/90 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_4px_24px_rgba(26,14,21,0.04)]">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            Saved changes apply immediately across all client accounts and atelier booking policies.
          </p>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
                disabled={updateMutation.isPending}
                className="h-14 px-8 rounded-full border-rose-300/80 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 font-medium text-xs sm:text-sm"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={updateMutation.isPending}
              className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] transition-all gap-2"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} />
              Save settings
            </Button>
          </div>
        </div>
      </form>

      {/* Current Configuration Overview */}
      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)] max-w-5xl">
        <CardHeader className="border-b border-rose-200/60 dark:border-rose-950/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
              <DollarSign className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
                Active Policy Overview
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Live summary of active parameters currently applied to client loyalty cards
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                  <Skeleton variant="text" width="60%" className="h-3" />
                  <Skeleton variant="text" width="40%" className="h-6" />
                  <Skeleton variant="text" width="75%" className="h-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-sans">Stamps per service</p>
                <p className="text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-rose-50 tabular-nums">
                  {formData.stampsPerService}
                </p>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1 font-sans">base earning</p>
              </div>

              <div className="p-5 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-sans">Spend bonus</p>
                <p className="text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-rose-50 tabular-nums">
                  {formData.stampsPerAmount > 0 ? `+${formData.stampsPerAmount}` : '0'}
                </p>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1 font-sans">
                  at ₱{(formData.amountThreshold / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })} spend
                </p>
              </div>

              <div className="p-5 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-sans">Card expiration</p>
                <p className="text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-rose-50 tabular-nums">
                  {formData.cardExpiryMonths} <span className="text-sm font-sans font-normal text-stone-500 dark:text-stone-400">mo</span>
                </p>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1 font-sans">validity window</p>
              </div>

              <div className="p-5 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-sans">Reward service</p>
                <p className="text-base font-serif font-medium text-stone-900 dark:text-rose-50 truncate" title={formData.freeServiceReward}>
                  {formData.freeServiceReward || 'None'}
                </p>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1 font-sans">at 10 stamps target</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
