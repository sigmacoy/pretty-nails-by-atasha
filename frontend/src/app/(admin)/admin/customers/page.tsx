'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { CustomerListDto, CustomerNoteDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { Search, Plus, Edit, MessageSquare, X } from 'lucide-react';

export default function AdminCustomersPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListDto | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isNoteLoading, setIsNoteLoading] = useState(false);

  const { data: customersData, isLoading, refetch } = useQuery(
    () => adminApi.getCustomers(search),
    { enabled: true }
  );

  const customers = customersData?.data || [];

  const handleAddNote = async () => {
    if (!selectedCustomer || !noteContent.trim()) return;
    setIsNoteLoading(true);
    try {
      await adminApi.addCustomerNote(selectedCustomer.id, { content: noteContent.trim() });
      toast.success('Note added successfully');
      setNoteModalOpen(false);
      setNoteContent('');
      setSelectedCustomer(null);
      refetch();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to add note');
    } finally {
      setIsNoteLoading(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Customer', render: (row: CustomerListDto) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.name} size="sm" />
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'phone', header: 'Phone', render: (row: CustomerListDto) => row.phone || '—' },
    { key: 'role', header: 'Role', render: (row: CustomerListDto) => (
      <Badge variant={row.role === 'ADMIN' ? 'warning' : 'secondary'}>
        {row.role}
      </Badge>
    )},
    { key: 'createdAt', header: 'Joined', render: (row: CustomerListDto) => formatDate(row.createdAt) },
    { key: 'bookingCount', header: 'Bookings', render: (row: CustomerListDto) => row.bookingCount },
    { key: 'loyaltyStamps', header: 'Stamps', render: (row: CustomerListDto) => row.loyaltyStamps },
  ];

  return (
    <div className="container-padding section-padding">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage customer accounts</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              {customers.length} customer{customers.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardContent>
      </Card>

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
                emptyMessage="Loading customers..."
              />
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No customers found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {search ? 'Try adjusting your search.' : 'No customers registered yet.'}
              </p>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={customers}
                keyExtractor={(row) => row.id}
                renderRowActions={(row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedCustomer(row); setNoteModalOpen(true); }}
                    className="gap-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Add Note
                  </Button>
                )}
              />
              <div className="px-4 py-3 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={1}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Note Modal */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => { setNoteModalOpen(false); setSelectedCustomer(null); setNoteContent(''); }}
        title="Add Customer Note"
        description={selectedCustomer ? `Add a note for ${selectedCustomer.name} (${selectedCustomer.email})` : ''}
      >
        <div className="space-y-4">
          <Textarea
            label="Note Content"
            placeholder="Enter your note here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setNoteModalOpen(false); setSelectedCustomer(null); setNoteContent(''); }}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} isLoading={isNoteLoading}>
              Add Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}