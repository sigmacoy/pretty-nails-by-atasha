'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@/hooks/useApi';
import { adminApi, loyaltyApi } from '@/lib/api';
import { LoyaltySettingsDto, AdminLoyaltyCardDto, LoyaltyActionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Eye, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminLoyaltyPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<AdminLoyaltyCardDto | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
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

  // Filter cards by search
  const filteredCards = cards.filter(card =>
    card.userName.toLowerCase().includes(search.toLowerCase()) ||
    card.userEmail.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async () => {
    if (!selectedCard) return;
    setIsActionLoading(true);
    try {
      await loyaltyApi.loyaltyAction({
        userId: selectedCard.userId,
        action: actionType,
        amount: actionType === 'EXTEND' ? actionAmount * 30 : actionAmount, // days for extend
      });
      toast.success(`Loyalty ${actionType.toLowerCase().replace('_', ' ')} successful`);
      setActionModalOpen(false);
      refetch();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openActionModal = (card: AdminLoyaltyCardDto, type: LoyaltyActionType) => {
    setSelectedCard(card);
    setActionType(type);
    setActionAmount(1);
    setActionModalOpen(true);
  };

  const columns = [
    { key: 'userName', header: 'Customer', render: (row: AdminLoyaltyCardDto) => (
      <div>
        <p className="font-medium">{row.userName}</p>
        <p className="text-sm text-gray-500">{row.userEmail}</p>
      </div>
    )},
    { key: 'stampCount', header: 'Stamps', render: (row: AdminLoyaltyCardDto) => (
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">{row.stampCount}</span>
        {settings && (
          <span className="text-sm text-gray-500">/ {settings.stampsPerService * 10 || 10}</span>
        )}
      </div>
    )},
    { key: 'lastStampAt', header: 'Last Stamp', render: (row: AdminLoyaltyCardDto) =>
      row.lastStampAt ? new Date(row.lastStampAt).toLocaleDateString() : 'Never'
    },
    { key: 'expiresAt', header: 'Expires', render: (row: AdminLoyaltyCardDto) => {
      const expiry = new Date(row.expiresAt);
      const isExpired = expiry < new Date();
      return (
        <span className={isExpired ? 'text-red-600 dark:text-red-400' : ''}>
          {expiry.toLocaleDateString()}
          {isExpired && <span className="ml-1 text-xs">(Expired)</span>}
        </span>
      );
    }},
  ];

  return (
    <div className="container-padding section-padding">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Loyalty Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage customer loyalty cards and stamps</p>
      </div>

      {/* Settings Summary */}
      {settings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Loyalty Program Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">Stamps per Service:</span> <span className="font-medium ml-2">{settings.stampsPerService}</span></div>
              <div><span className="text-gray-500">Stamps per Amount:</span> <span className="font-medium ml-2">{settings.stampsPerAmount} per ₱{settings.amountThreshold / 100}</span></div>
              <div><span className="text-gray-500">Free Service:</span> <span className="font-medium ml-2">{settings.freeServiceReward}</span></div>
              <div><span className="text-gray-500">Card Expiry:</span> <span className="font-medium ml-2">{settings.cardExpiryMonths} months</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Table
                columns={columns}
                data={[]}
                keyExtractor={(row) => row.id}
                isLoading={true}
                emptyMessage="Loading loyalty cards..."
              />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No loyalty cards found</h3>
              <p className="text-gray-500 dark:text-gray-400">{search ? 'Try adjusting your search.' : 'No customers have loyalty cards yet.'}</p>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={filteredCards}
                keyExtractor={(row) => row.id}
                renderRowActions={(row) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openActionModal(row, 'ADD_STAMP')} className="text-green-600 hover:bg-green-50">
                      <Plus className="h-4 w-4 mr-1" /> Add Stamp
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openActionModal(row, 'REMOVE_STAMP')} className="text-yellow-600 hover:bg-yellow-50">
                      <AlertCircle className="h-4 w-4 mr-1" /> Remove
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openActionModal(row, 'EXTEND')} className="text-blue-600 hover:bg-blue-50">
                      <Clock className="h-4 w-4 mr-1" /> Extend
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openActionModal(row, 'RESET')} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-1" /> Reset
                    </Button>
                  </div>
                )}
              />
              <div className="px-4 py-3 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={1} // Would need total pages from API
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => { setActionModalOpen(false); setSelectedCard(null); }}
        title={`${actionType.replace('_', ' ')} Stamp`}
        description={selectedCard ? `Perform ${actionType.toLowerCase().replace('_', ' ')} on ${selectedCard.userName}'s loyalty card` : ''}
      >
        <div className="space-y-4">
          <p>Customer: <strong>{selectedCard?.userName}</strong> ({selectedCard?.userEmail})</p>
          <p>Current stamps: <strong>{selectedCard?.stampCount}</strong></p>

          {actionType === 'EXTEND' && (
            <Input
              label="Months to Extend"
              type="number"
              value={actionAmount}
              onChange={(e) => setActionAmount(parseInt(e.target.value) || 1)}
              min={1}
              max={12}
            />
          )}

          {actionType === 'ADD_STAMP' || actionType === 'REMOVE_STAMP' && (
            <Input
              label="Number of Stamps"
              type="number"
              value={actionAmount}
              onChange={(e) => setActionAmount(parseInt(e.target.value) || 1)}
              min={1}
              max={10}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setActionModalOpen(false); setSelectedCard(null); }}>
              Cancel
            </Button>
            <Button onClick={handleAction} isLoading={isActionLoading}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}