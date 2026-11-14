'use client';

import { useState } from 'react';
import { useQuery } from '@/hooks/useApi';
import { adminApi } from '@/lib/api';
import { CustomerListDto } from '@/types';
import { CustomersTable, CustomerNoteModal } from '@/components/admin/customers';
import { Search, X, CheckCircle, Ban, Calendar, Users } from 'lucide-react';
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
    <div className="space-y-8 -m-4 sm:-m-6 lg:-m-8 p-6 sm:p-8 lg:p-10 min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950 transition-colors pb-16">
      {/* Standard Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Client Atelier Directory
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Client treatment history, visit logs, structured BIAB overlay notes, and private atelier client records.
          </p>
        </div>

        {/* Directory Stat Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-white/80 dark:bg-stone-900/80 text-xs shadow-xs">
            <Users className="h-4 w-4 text-rose-800 dark:text-rose-300 stroke-[1.5]" />
            <span className="text-stone-500 dark:text-stone-400">Total registered:</span>
            <span className="font-semibold text-stone-900 dark:text-rose-100 tabular-nums font-mono">
              {customersList.length}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-white/80 dark:bg-stone-900/80 text-xs shadow-xs">
            <Calendar className="h-4 w-4 text-rose-800 dark:text-rose-300 stroke-[1.5]" />
            <span className="text-stone-500 dark:text-stone-400">Total visits:</span>
            <span className="font-semibold text-stone-900 dark:text-rose-100 tabular-nums font-mono">
              {totalVisits}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-white/80 dark:bg-stone-900/80 text-xs shadow-xs">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
            <span className="text-stone-500 dark:text-stone-400">Active clients:</span>
            <span className="font-semibold text-stone-900 dark:text-rose-100 tabular-nums font-mono">
              {activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input: generous luxury touch target */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-800/70 dark:text-rose-300/70 pointer-events-none stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search clients by name, email, or telephone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            className="h-12 sm:h-14 w-full rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90 pl-11 pr-11 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:border-rose-800 shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(0);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-full"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-white/80 dark:bg-stone-900/80 p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(0);
            }}
            className={`h-11 px-5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            All clients
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('active');
              setCurrentPage(0);
            }}
            className={`h-11 px-4 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Active</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('blocked');
              setCurrentPage(0);
            }}
            className={`h-11 px-4 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
              statusFilter === 'blocked'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Ban className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Blocked</span>
            {blockedCount > 0 && (
              <span className="tabular-nums font-mono text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-1.5 py-0.2 rounded-full">
                {blockedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)] overflow-hidden">
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
              ? 'No client accounts match your search query'
              : statusFilter !== 'all'
              ? `No ${statusFilter} client accounts found`
              : 'No registered atelier clients found'
          }
        />
      </div>

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
