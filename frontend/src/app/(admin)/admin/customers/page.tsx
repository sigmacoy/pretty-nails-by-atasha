'use client';

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { CustomerListDto } from '@/types';
import { CustomersTable, CustomerNoteModal } from '@/components/admin/customers';
import { Search, X, Users, CheckCircle, Ban, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'active' | 'blocked';

const PAGE_SIZE = 10;

export default function AdminCustomersPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListDto | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [blockedCustomers, setBlockedCustomers] = useState<Set<string>>(new Set());
  const [customerNicknames, setCustomerNicknames] = useState<Record<string, string>>({});

  const { data: customersData, isLoading, refetch } = useQuery(
    () => adminApi.getCustomers(search),
    { enabled: true }
  );

  const rawData = customersData?.data;
  const customersList: CustomerListDto[] = Array.isArray(rawData)
    ? rawData
    : (rawData as unknown as { content?: CustomerListDto[] })?.content || [];

  // Filter by status
  const filteredCustomers = customersList.filter((customer) => {
    const isBlocked = blockedCustomers.has(customer.id) || customer.role === 'BLOCKED';
    if (statusFilter === 'active') return !isBlocked;
    if (statusFilter === 'blocked') return isBlocked;
    return true;
  });

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = filteredCustomers.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // Directory statistics
  const totalVisits = customersList.reduce((acc, c) => acc + (c.bookingCount || 0), 0);
  const blockedCount = customersList.filter(
    (c) => blockedCustomers.has(c.id) || c.role === 'BLOCKED'
  ).length;
  const activeCount = Math.max(0, customersList.length - blockedCount);

  const handleToggleBlock = (customer: CustomerListDto) => {
    setBlockedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(customer.id)) {
        next.delete(customer.id);
        toast.success(`${customer.name} unblocked`);
      } else {
        next.add(customer.id);
        toast.success(`${customer.name} marked as blocked`);
      }
      return next;
    });
  };

  const handleOpenNoteModal = (customer: CustomerListDto) => {
    setSelectedCustomer(customer);
    setNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveNoteSuccess = (customer: CustomerListDto, nickname?: string) => {
    if (nickname) {
      setCustomerNicknames((prev) => ({
        ...prev,
        [customer.id]: nickname,
      }));
    }
    refetch();
  };

  return (
    <div className="container-padding py-8 space-y-6">
      {/* Header with Title and Overview Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Customer directory
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 tabular-nums">
              {customersList.length} total
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal">
            Directory of registered salon clients, visit counts, and private owner notes.
          </p>
        </div>

        {/* Directory Stat Chips */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-card text-xs">
            <Calendar className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
            <span className="text-stone-500 dark:text-stone-400">Total visits:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
              {totalVisits}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-card text-xs">
            <CheckCircle className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
            <span className="text-stone-500 dark:text-stone-400">Active:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
              {activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input: exactly 36px height (h-9) */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            className="h-9 w-full rounded-md border border-stone-200 dark:border-stone-700 bg-background dark:bg-stone-900/60 pl-9 pr-9 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-primary focus-visible:border-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(0);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-stone-100/70 dark:bg-stone-900/60 p-0.5">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(0);
            }}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-card text-stone-900 dark:text-stone-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('active');
              setCurrentPage(0);
            }}
            className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-card text-stone-900 dark:text-stone-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <CheckCircle className="h-3 w-3 text-stone-500" strokeWidth={1.5} />
            <span>Active</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('blocked');
              setCurrentPage(0);
            }}
            className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
              statusFilter === 'blocked'
                ? 'bg-card text-stone-900 dark:text-stone-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Ban className="h-3 w-3 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
            <span>Blocked</span>
            {blockedCount > 0 && (
              <span className="tabular-nums text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-1 rounded-full">
                {blockedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <CustomersTable
        customers={paginatedCustomers}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onAddNote={handleOpenNoteModal}
        blockedCustomerIds={blockedCustomers}
        onToggleBlock={handleToggleBlock}
        customerNicknames={customerNicknames}
        emptyMessage={
          search
            ? 'No customer accounts match your search'
            : statusFilter !== 'all'
            ? `No ${statusFilter} customers found`
            : 'No registered customers found'
        }
      />

      {/* Customer Note Modal */}
      <CustomerNoteModal
        isOpen={noteModalOpen}
        onClose={handleCloseNoteModal}
        customer={selectedCustomer}
        initialNickname={selectedCustomer ? customerNicknames[selectedCustomer.id] || '' : ''}
        onSaveSuccess={handleSaveNoteSuccess}
      />
    </div>
  );
}
