'use client';

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { adminApi, loyaltyApi } from '@/lib/api';
import { LoyaltySettingsDto, AdminLoyaltyCardDto, LoyaltyActionType } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { QrScannerModal } from '@/components/admin/QrScannerModal';
import { toast } from 'sonner';
import {
  QrCode,
  Award,
  Plus,
  Minus,
  Search,
  CheckCircle,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
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

  // Quick Issue helpers (₱500 and ₱1,000 rules)
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Loyalty program
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Customer stamp directory, service rules, and reward redemption verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setIsScannerOpen(true)}
            className="h-9 px-3.5 rounded-lg text-xs font-medium shadow-sm flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" strokeWidth={1.5} />
            <span>Scan member QR</span>
          </Button>
        </div>
      </div>

      {/* Program Rules Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">
              Service rule
            </span>
            <CheckCircle className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
            {settings?.stampsPerService || 1} stamp
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Per completed salon visit
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">
              Spend rules
            </span>
            <Plus className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
            ₱500 and ₱1,000 rules
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            +1 per ₱500 • +2 per ₱1,000
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">
              Reward threshold
            </span>
            <Award className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
            {maxStamps} stamps
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
            {settings?.freeServiceReward || 'Free gel service reward'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">
              Stamp validity
            </span>
            <Clock className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
            {settings?.cardExpiryMonths || 12} months
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Refreshes on stamp activity
          </p>
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
              strokeWidth={1.5}
            />
            <Input
              placeholder="Search by customer name, email, or card ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-9 h-9 text-xs bg-card"
            />
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            Showing {paginatedCards.length} of {filteredCards.length} members
          </div>
        </div>

        {/* Quiet Porcelain Table Surface */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden bg-card shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="sticky top-0 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm border-b border-stone-200/80 dark:border-stone-800/80 z-10">
                  <th className="py-2.5 px-4 font-medium text-stone-600 dark:text-stone-400">
                    Customer
                  </th>
                  <th className="py-2.5 px-4 font-medium text-stone-600 dark:text-stone-400">
                    Stamp balance
                  </th>
                  <th className="py-2.5 px-4 font-medium text-stone-600 dark:text-stone-400">
                    Reward status
                  </th>
                  <th className="py-2.5 px-4 font-medium text-stone-600 dark:text-stone-400">
                    Last stamp
                  </th>
                  <th className="py-2.5 px-4 font-medium text-stone-600 dark:text-stone-400">
                    Expires
                  </th>
                  <th className="py-2.5 px-4 font-medium text-stone-600 dark:text-stone-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="py-2.5 px-4">
                        <Skeleton variant="text" width={120} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Skeleton variant="text" width={80} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Skeleton variant="text" width={70} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Skeleton variant="text" width={90} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Skeleton variant="text" width={90} />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Skeleton variant="text" width={110} />
                      </td>
                    </tr>
                  ))
                ) : paginatedCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Award className="w-8 h-8 text-stone-300 dark:text-stone-600" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                          No loyalty cards found
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {search
                            ? 'Try adjusting your search criteria.'
                            : 'No customer loyalty cards registered yet.'}
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
                        className="h-10 transition-colors duration-150 hover:bg-stone-50/70 dark:hover:bg-stone-900/40"
                      >
                        {/* Customer */}
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-stone-900 dark:text-stone-100">
                            {row.userName}
                          </p>
                          <p className="text-[11px] text-stone-500 font-normal">
                            {row.userEmail}
                          </p>
                        </td>

                        {/* Stamp balance with mini dots */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                              {row.stampCount}
                            </span>
                            <span className="text-stone-400 font-normal">/</span>
                            <span className="text-stone-500 font-mono tabular-nums">
                              {maxStamps}
                            </span>
                            <div className="flex items-center gap-1 ml-1">
                              {Array.from({ length: Math.min(maxStamps, 5) }).map((_, dotIdx) => (
                                <div
                                  key={dotIdx}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    dotIdx < row.stampCount
                                      ? 'bg-primary'
                                      : 'bg-stone-200 dark:bg-stone-800'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Reward status */}
                        <td className="py-2.5 px-4">
                          {isRewardEligible ? (
                            <Badge
                              variant="default"
                              className="text-[10px] font-medium gap-1 text-primary bg-primary/10 border-primary/20"
                            >
                              <Award className="w-3 h-3" strokeWidth={1.5} />
                              Reward ready
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                              <Clock className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                              In progress
                            </Badge>
                          )}
                        </td>

                        {/* Last stamp */}
                        <td className="py-2.5 px-4 text-stone-600 dark:text-stone-400 font-mono tabular-nums">
                          {row.lastStampAt
                            ? new Date(row.lastStampAt).toLocaleDateString()
                            : 'Never'}
                        </td>

                        {/* Expires */}
                        <td className="py-2.5 px-4">
                          <span
                            className={`font-mono tabular-nums ${
                              isExpired
                                ? 'text-destructive font-medium'
                                : 'text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            {expiry.toLocaleDateString()}
                          </span>
                          {isExpired && (
                            <span className="ml-1 text-[10px] text-destructive font-medium">
                              (Expired)
                            </span>
                          )}
                        </td>

                        {/* Action buttons (36px button height, 8px gap) */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openQuickIssue(row)}
                              className="h-8 px-2.5 rounded-lg text-xs font-medium"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                              Issue stamps
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openAdjustModal(row)}
                              className="h-8 px-2.5 rounded-lg text-xs font-medium border border-stone-200/80 dark:border-stone-800/80"
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
            <div className="px-4 py-3 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
              <span className="tabular-nums">
                Page {currentPage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="h-7 px-2 text-xs"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cashier / Staff QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        cards={cards}
        settings={settings}
        onIssueStamps={handleScannerIssueStamps}
        onRedeemReward={handleScannerRedeemReward}
      />

      {/* Quick Stamp Issuance Dialog (₱500 and ₱1,000 rules) */}
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
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                    {selectedCard.userName}
                  </p>
                  <p className="text-[11px] text-stone-500">{selectedCard.userEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500">Current balance</span>
                  <p className="text-sm font-mono font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                    {selectedCard.stampCount} / {maxStamps}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick preset buttons: ₱500 and ₱1,000 rules */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Rule presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuickIssueAmount(1)}
                  className={`h-9 justify-between text-xs border ${
                    quickIssueAmount === 1
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-stone-200/80 dark:border-stone-800/80'
                  }`}
                >
                  <span>₱500 rule</span>
                  <span className="font-mono font-medium tabular-nums">+1 stamp</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuickIssueAmount(2)}
                  className={`h-9 justify-between text-xs border ${
                    quickIssueAmount === 2
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-stone-200/80 dark:border-stone-800/80'
                  }`}
                >
                  <span>₱1,000 rule</span>
                  <span className="font-mono font-medium tabular-nums">+2 stamps</span>
                </Button>
              </div>
            </div>

            {/* Custom Quantity Stepper */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Custom stamp quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickIssueAmount(Math.max(1, quickIssueAmount - 1))}
                  disabled={quickIssueAmount <= 1 || isActionLoading}
                  className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <div className="flex-1 text-center font-mono font-medium text-sm text-stone-900 dark:text-stone-100 tabular-nums">
                  {quickIssueAmount} stamp{quickIssueAmount > 1 ? 's' : ''}
                </div>
                <button
                  type="button"
                  onClick={() => setQuickIssueAmount(Math.min(10, quickIssueAmount + 1))}
                  disabled={quickIssueAmount >= 10 || isActionLoading}
                  className="w-9 h-9 rounded-lg border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuickIssueOpen(false);
                  setSelectedCard(null);
                }}
                className="h-8 text-xs"
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
                className="h-8 px-3.5 text-xs"
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
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/40">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {selectedCard.userName}
                  </p>
                  <p className="text-[11px] text-stone-500">{selectedCard.userEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-stone-500">Current balance</span>
                  <p className="font-mono font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                    {selectedCard.stampCount} stamps
                  </p>
                </div>
              </div>
            </div>

            {/* Adjustment Action Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Action type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionType('ADD_STAMP');
                    setActionAmount(1);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                    actionType === 'ADD_STAMP'
                      ? 'border-primary bg-primary/5 text-stone-900 dark:text-stone-100'
                      : 'border-stone-200/80 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                  }`}
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
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                    actionType === 'REMOVE_STAMP'
                      ? 'border-primary bg-primary/5 text-stone-900 dark:text-stone-100'
                      : 'border-stone-200/80 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                  }`}
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
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                    actionType === 'EXTEND'
                      ? 'border-primary bg-primary/5 text-stone-900 dark:text-stone-100'
                      : 'border-stone-200/80 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                  }`}
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
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                    actionType === 'RESET'
                      ? 'border-destructive bg-destructive/5 text-destructive'
                      : 'border-stone-200/80 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                  }`}
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
                className="h-9 text-xs"
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
                className="h-9 text-xs"
              />
            )}

            {actionType === 'RESET' && (
              <p className="text-xs text-stone-500 dark:text-stone-400 p-3 rounded-lg bg-stone-100 dark:bg-stone-900/60">
                This will reset the member stamp balance to 0 and reset the expiry clock.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdjustModalOpen(false);
                  setSelectedCard(null);
                }}
                className="h-8 text-xs"
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
                className="h-8 px-3.5 text-xs"
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
