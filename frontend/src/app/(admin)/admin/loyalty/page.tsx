'use client';

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { adminApi, loyaltyApi } from '@/lib/api';
import { AdminLoyaltyCardDto, LoyaltyActionType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { QrScannerModal } from '@/components/admin/QrScannerModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  QrCode,
  Award,
  Plus,
  Minus,
  Search,
  CheckCircle,
  Clock,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react';

export default function AdminLoyaltyPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<AdminLoyaltyCardDto | null>(null);

  // Quick stamp issuance modal state
  const [quickIssueOpen, setQuickIssueOpen] = useState(false);
  const [quickIssueAmount, setQuickIssueAmount] = useState(1);

  // Manual adjustment modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [actionType, setActionType] = useState<LoyaltyActionType>('ADD_STAMP');
  const [actionAmount, setActionAmount] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: cardsData, isLoading, refetch } = useQuery(
    () => loyaltyApi.getAllCards(),
    { enabled: true }
  );

  const { data: settingsData } = useQuery(
    () => adminApi.getSettings(),
    { enabled: true }
  );

  const cards = cardsData?.data || [];
  const settings = settingsData?.data;
  const maxStamps = settings?.stampsPerService ? settings.stampsPerService * 10 : 10;

  // Filter cards by search query
  const filteredCards = cards.filter(
    (card) =>
      card.userName.toLowerCase().includes(search.toLowerCase()) ||
      card.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      card.id.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
  const paginatedCards = filteredCards.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Core API mutation handler
  const handleAction = async (
    targetCard: AdminLoyaltyCardDto,
    type: LoyaltyActionType,
    amount: number
  ) => {
    setIsActionLoading(true);
    try {
      await loyaltyApi.loyaltyAction({
        userId: targetCard.userId,
        action: type,
        amount: type === 'EXTEND' ? amount * 30 : amount,
      });

      const readableAction =
        type === 'ADD_STAMP'
          ? `Added ${amount} stamp${amount > 1 ? 's' : ''}`
          : type === 'REMOVE_STAMP'
          ? `Removed ${amount} stamp${amount > 1 ? 's' : ''}`
          : type === 'EXTEND'
          ? `Extended validity by ${amount} month${amount > 1 ? 's' : ''}`
          : 'Loyalty card reset';

      toast.success(`${readableAction} for ${targetCard.userName}`);
      setQuickIssueOpen(false);
      setAdjustModalOpen(false);
      refetch();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Loyalty action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Quick Issue helpers
  const openQuickIssue = (card: AdminLoyaltyCardDto) => {
    setSelectedCard(card);
    setQuickIssueAmount(1);
    setQuickIssueOpen(true);
  };

  // Open manual adjust dialog
  const openAdjustModal = (card: AdminLoyaltyCardDto) => {
    setSelectedCard(card);
    setActionType('ADD_STAMP');
    setActionAmount(1);
    setAdjustModalOpen(true);
  };

  // Scanner modal callbacks
  const handleScannerIssueStamps = async (card: AdminLoyaltyCardDto, amount: number) => {
    await handleAction(card, 'ADD_STAMP', amount);
  };

  const handleScannerRedeemReward = async (card: AdminLoyaltyCardDto) => {
    await handleAction(card, 'REMOVE_STAMP', maxStamps);
  };

  return (
    <div className="space-y-8 bg-[#FFF0F3] dark:bg-[#160D12] text-foreground min-h-screen p-6 sm:p-8 lg:p-10 transition-colors selection:bg-rose-200 selection:text-rose-950">
      {/* Header & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Digital Stamp Administration
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Monitor client stamp card balances, verify 10-stamp complimentary reward redemptions, and scan member QR cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsScannerOpen(true)}
            className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] flex items-center gap-2.5 transition-all shrink-0"
          >
            <QrCode className="w-4 h-4" strokeWidth={1.5} />
            <span>Scan member QR</span>
          </Button>
        </div>
      </div>

      {/* Program Rules Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
              Service rule
            </span>
            <CheckCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-serif font-medium text-stone-900 dark:text-rose-50 mt-2 tabular-nums">
            {settings?.stampsPerService || 1} stamp
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-normal">
            Per completed salon treatment
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
              Spend bonus
            </span>
            <Plus className="w-4 h-4 text-rose-700 dark:text-rose-400" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-serif font-medium text-stone-900 dark:text-rose-50 mt-2 tabular-nums">
            PHP 500 and PHP 1,000 rules
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-normal">
            +1 per PHP 500 · +2 per PHP 1,000 spend
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
              Complimentary reward
            </span>
            <Award className="w-4 h-4 text-rose-700 dark:text-rose-400" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-serif font-medium text-stone-900 dark:text-rose-50 mt-2 tabular-nums">
            {maxStamps} stamps reward
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-normal truncate">
            {settings?.freeServiceReward || 'Free gel treatment at 10 stamps'}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 font-semibold">
              Card validity
            </span>
            <Clock className="w-4 h-4 text-rose-700 dark:text-rose-400" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-serif font-medium text-stone-900 dark:text-rose-50 mt-2 tabular-nums">
            {settings?.cardExpiryMonths || 12} months
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-normal">
            12 months validity from last appointment
          </p>
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 dark:text-rose-500"
              strokeWidth={1.5}
            />
            <Input
              placeholder="Search by customer name, email, or card ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-11 h-12 rounded-full border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90 text-sm"
            />
          </div>

          <div className="text-xs font-mono text-stone-500 dark:text-stone-400 tabular-nums">
            Showing {paginatedCards.length} of {filteredCards.length} atelier members
          </div>
        </div>

        {/* Quiet Porcelain Table Surface with Rose Hairlines */}
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 overflow-hidden bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="sticky top-0 bg-rose-50/70 dark:bg-[#20111A]/90 backdrop-blur-sm border-b border-rose-200/80 dark:border-rose-950/60 z-10">
                  <th className="py-3 px-5 font-semibold text-[11px] uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                    Customer
                  </th>
                  <th className="py-3 px-5 font-semibold text-[11px] uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                    Physical stamp card balance
                  </th>
                  <th className="py-3 px-5 font-semibold text-[11px] uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                    Reward status
                  </th>
                  <th className="py-3 px-5 font-semibold text-[11px] uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                    Last stamp
                  </th>
                  <th className="py-3 px-5 font-semibold text-[11px] uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
                    Expires
                  </th>
                  <th className="py-3 px-5 font-semibold text-[11px] uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200/60 dark:divide-rose-950/60">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="h-16">
                      <td className="py-3 px-5">
                        <Skeleton variant="text" width={140} />
                      </td>
                      <td className="py-3 px-5">
                        <Skeleton variant="text" width={160} />
                      </td>
                      <td className="py-3 px-5">
                        <Skeleton variant="text" width={90} />
                      </td>
                      <td className="py-3 px-5">
                        <Skeleton variant="text" width={100} />
                      </td>
                      <td className="py-3 px-5">
                        <Skeleton variant="text" width={100} />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Skeleton variant="text" width={140} />
                      </td>
                    </tr>
                  ))
                ) : paginatedCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 px-5 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300">
                          <Award className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <p className="text-base font-serif font-medium text-stone-900 dark:text-rose-50">
                          No loyalty cards found
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm">
                          {search
                            ? 'No member cards match your search parameters.'
                            : 'No customer loyalty cards registered in the atelier yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCards.map((row) => {
                    const isRewardEligible = row.stampCount >= maxStamps;
                    const expiry = new Date(row.expiresAt);
                    const isExpired = expiry < new Date();

                    return (
                      <tr
                        key={row.id}
                        className="transition-colors duration-150 hover:bg-rose-50/40 dark:hover:bg-rose-950/20"
                      >
                        {/* Customer */}
                        <td className="py-3.5 px-5">
                          <p className="font-medium text-stone-900 dark:text-rose-50 text-sm">
                            {row.userName}
                          </p>
                          <p className="text-[11px] text-stone-500 font-normal">
                            {row.userEmail}
                          </p>
                        </td>

                        {/* Stamp balance with physical stamp card aesthetic */}
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-mono text-xs font-semibold text-rose-950 dark:text-rose-100 tabular-nums">
                              {row.stampCount} / {maxStamps} stamps
                            </span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: maxStamps }).map((_, idx) => {
                                const isStamped = idx < row.stampCount;
                                return (
                                  <span
                                    key={idx}
                                    className={cn(
                                      'w-3.5 h-3.5 rounded-full border text-[8px] font-mono flex items-center justify-center select-none',
                                      isStamped
                                        ? 'bg-rose-900 border-rose-900 text-white shadow-2xs'
                                        : 'bg-transparent border-rose-200/80 dark:border-rose-900/60 text-stone-400'
                                    )}
                                  >
                                    {isStamped ? '' : idx + 1}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Reward status */}
                        <td className="py-3.5 px-5">
                          {isRewardEligible ? (
                            <Badge
                              variant="default"
                              className="text-[11px] font-medium gap-1 text-white bg-rose-900 border-rose-800 rounded-full px-3 py-0.5"
                            >
                              <Award className="w-3 h-3" strokeWidth={1.5} />
                              Reward ready
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-normal gap-1 rounded-full px-3 py-0.5 border border-rose-200/80 dark:border-rose-900/60"
                            >
                              <Clock className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                              In progress
                            </Badge>
                          )}
                        </td>

                        {/* Last stamp */}
                        <td className="py-3.5 px-5 text-stone-700 dark:text-stone-300 font-mono text-xs tabular-nums">
                          {row.lastStampAt
                            ? new Date(row.lastStampAt).toLocaleDateString()
                            : 'Never'}
                        </td>

                        {/* Expires */}
                        <td className="py-3.5 px-5">
                          <span
                            className={cn(
                              'font-mono text-xs tabular-nums',
                              isExpired
                                ? 'text-destructive font-medium'
                                : 'text-stone-700 dark:text-stone-300'
                            )}
                          >
                            {expiry.toLocaleDateString()}
                          </span>
                          {isExpired && (
                            <span className="ml-1.5 text-[10px] text-destructive font-medium">
                              (Expired)
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openQuickIssue(row)}
                              className="h-10 px-4 rounded-full text-xs font-medium bg-rose-900 hover:bg-rose-950 text-white border border-rose-800/80 shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                              Issue stamps
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openAdjustModal(row)}
                              className="h-10 px-4 rounded-full text-xs font-medium border border-rose-200/80 dark:border-rose-800/60 text-stone-800 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                              Adjust
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination footer */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-rose-200/80 dark:border-rose-950/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-mono tabular-nums">
                Page {currentPage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-10 px-5 rounded-full border border-rose-200/80 dark:border-rose-800/60 text-xs font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="h-10 px-5 rounded-full border border-rose-200/80 dark:border-rose-800/60 text-xs font-medium"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Staff QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        cards={cards}
        settings={settings}
        onIssueStamps={handleScannerIssueStamps}
        onRedeemReward={handleScannerRedeemReward}
      />

      {/* Quick Stamp Issuance Dialog */}
      <Modal
        isOpen={quickIssueOpen}
        onClose={() => {
          setQuickIssueOpen(false);
          setSelectedCard(null);
        }}
        title="Issue stamps"
        description={
          selectedCard
            ? `Issue loyalty stamps to ${selectedCard.userName}`
            : 'Select stamp issuance quantity'
        }
      >
        {selectedCard && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-rose-50/50 dark:bg-[#1A0E15]/90">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-rose-50">
                    {selectedCard.userName}
                  </p>
                  <p className="text-xs text-stone-500">{selectedCard.userEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500">Current balance</span>
                  <p className="text-sm font-mono font-medium text-rose-950 dark:text-rose-100 tabular-nums">
                    {selectedCard.stampCount} / {maxStamps} stamps
                  </p>
                </div>
              </div>
            </div>

            {/* Quick preset buttons: PHP 500 and PHP 1,000 rules */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Rule presets
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuickIssueAmount(1)}
                  className={cn(
                    'h-11 justify-between text-xs rounded-xl border',
                    quickIssueAmount === 1
                      ? 'border-rose-900 bg-rose-900/10 text-rose-950 dark:text-rose-100'
                      : 'border-rose-200/80 dark:border-rose-900/60'
                  )}
                >
                  <span>PHP 500 rule</span>
                  <span className="font-mono font-medium tabular-nums">+1 stamp</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuickIssueAmount(2)}
                  className={cn(
                    'h-11 justify-between text-xs rounded-xl border',
                    quickIssueAmount === 2
                      ? 'border-rose-900 bg-rose-900/10 text-rose-950 dark:text-rose-100'
                      : 'border-rose-200/80 dark:border-rose-900/60'
                  )}
                >
                  <span>PHP 1,000 rule</span>
                  <span className="font-mono font-medium tabular-nums">+2 stamps</span>
                </Button>
              </div>
            </div>

            {/* Custom Quantity Stepper */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Custom stamp quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuickIssueAmount(Math.max(1, quickIssueAmount - 1))}
                  disabled={quickIssueAmount <= 1 || isActionLoading}
                  className="w-10 h-10 rounded-full border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center text-stone-700 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <div className="flex-1 text-center font-mono font-medium text-base text-stone-900 dark:text-rose-50 tabular-nums">
                  {quickIssueAmount} stamp{quickIssueAmount > 1 ? 's' : ''}
                </div>
                <button
                  type="button"
                  onClick={() => setQuickIssueAmount(Math.min(10, quickIssueAmount + 1))}
                  disabled={quickIssueAmount >= 10 || isActionLoading}
                  className="w-10 h-10 rounded-full border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center text-stone-700 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-rose-200/60 dark:border-rose-950/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuickIssueOpen(false);
                  setSelectedCard(null);
                }}
                className="h-10 px-5 rounded-full text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  selectedCard && handleAction(selectedCard, 'ADD_STAMP', quickIssueAmount)
                }
                isLoading={isActionLoading}
                className="h-10 px-6 rounded-full text-xs font-medium bg-rose-900 hover:bg-rose-950 text-white"
              >
                Confirm stamp issuance
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Stamp Adjustment Dialog */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setSelectedCard(null);
        }}
        title="Manual stamp adjustment"
        description={
          selectedCard
            ? `Adjust loyalty parameters for ${selectedCard.userName}`
            : 'Select adjustment action'
        }
      >
        {selectedCard && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-rose-50/50 dark:bg-[#1A0E15]/90">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-stone-900 dark:text-rose-50 text-sm">
                    {selectedCard.userName}
                  </p>
                  <p className="text-[11px] text-stone-500">{selectedCard.userEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-stone-500">Current balance</span>
                  <p className="font-mono font-medium text-rose-950 dark:text-rose-100 tabular-nums">
                    {selectedCard.stampCount} stamps
                  </p>
                </div>
              </div>
            </div>

            {/* Adjustment Action Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Action type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActionType('ADD_STAMP');
                    setActionAmount(1);
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left text-xs transition-colors',
                    actionType === 'ADD_STAMP'
                      ? 'border-rose-900 bg-rose-900/10 text-stone-900 dark:text-rose-50'
                      : 'border-rose-200/80 dark:border-rose-900/60 text-stone-600 dark:text-stone-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                  )}
                >
                  <p className="font-medium">Add stamps</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Credit stamps to balance</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionType('REMOVE_STAMP');
                    setActionAmount(1);
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left text-xs transition-colors',
                    actionType === 'REMOVE_STAMP'
                      ? 'border-rose-900 bg-rose-900/10 text-stone-900 dark:text-rose-50'
                      : 'border-rose-200/80 dark:border-rose-900/60 text-stone-600 dark:text-stone-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                  )}
                >
                  <p className="font-medium">Remove stamps</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Deduct stamps or redeem</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionType('EXTEND');
                    setActionAmount(6);
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left text-xs transition-colors',
                    actionType === 'EXTEND'
                      ? 'border-rose-900 bg-rose-900/10 text-stone-900 dark:text-rose-50'
                      : 'border-rose-200/80 dark:border-rose-900/60 text-stone-600 dark:text-stone-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                  )}
                >
                  <p className="font-medium">Extend validity</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Add validity months</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionType('RESET');
                    setActionAmount(0);
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left text-xs transition-colors',
                    actionType === 'RESET'
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-rose-200/80 dark:border-rose-900/60 text-stone-600 dark:text-stone-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                  )}
                >
                  <p className="font-medium">Reset card</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Clear stamp balance to 0</p>
                </button>
              </div>
            </div>

            {/* Input fields based on action */}
            {actionType === 'EXTEND' && (
              <Input
                label="Months to extend"
                type="number"
                value={actionAmount}
                onChange={(e) => setActionAmount(parseInt(e.target.value) || 1)}
                min={1}
                max={24}
                className="h-10 text-xs rounded-xl border-rose-200/80 dark:border-rose-900/60"
              />
            )}

            {(actionType === 'ADD_STAMP' || actionType === 'REMOVE_STAMP') && (
              <Input
                label="Number of stamps"
                type="number"
                value={actionAmount}
                onChange={(e) => setActionAmount(parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                className="h-10 text-xs rounded-xl border-rose-200/80 dark:border-rose-900/60"
              />
            )}

            {actionType === 'RESET' && (
              <p className="text-xs text-stone-600 dark:text-stone-400 p-4 rounded-xl bg-rose-50/50 dark:bg-stone-900/60 border border-rose-200/60 dark:border-rose-950/60 leading-relaxed">
                This will reset the member stamp balance to 0 and reset the expiry clock.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-rose-200/60 dark:border-rose-950/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdjustModalOpen(false);
                  setSelectedCard(null);
                }}
                className="h-10 px-5 rounded-full text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'RESET' ? 'destructive' : 'primary'}
                size="sm"
                onClick={() =>
                  selectedCard && handleAction(selectedCard, actionType, actionAmount)
                }
                isLoading={isActionLoading}
                className="h-10 px-6 rounded-full text-xs font-medium"
              >
                Apply adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
