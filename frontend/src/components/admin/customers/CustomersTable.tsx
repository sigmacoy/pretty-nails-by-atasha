'use client';

import { DataTable, DataTableColumn } from '@/components/admin/DataTable';
import { Pagination } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateShort, getInitials } from '@/lib/utils';
import { CustomerListDto } from '@/types';
import {
  FileText,
  Ban,
  CheckCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CustomersTableProps {
  customers: CustomerListDto[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddNote: (customer: CustomerListDto) => void;
  blockedCustomerIds?: Set<string>;
  onToggleBlock?: (customer: CustomerListDto) => void;
  customerNicknames?: Record<string, string>;
  emptyMessage?: string;
}

export function CustomersTable({
  customers,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onAddNote,
  blockedCustomerIds,
  onToggleBlock,
  customerNicknames = {},
  emptyMessage = 'No customers found',
}: CustomersTableProps) {
  // Render Customer Name column
  const renderCustomer = (row: CustomerListDto) => {
    const isBlocked = blockedCustomerIds
      ? blockedCustomerIds.has(row.id)
      : row.role === 'BLOCKED';
    const nickname = customerNicknames[row.id];

    return (
      <div className="flex items-center gap-2.5 min-w-[170px]">
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-[11px] shrink-0 select-none">
          {getInitials(row.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
              {row.name}
            </span>
            {nickname && (
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-normal bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                {nickname}
              </span>
            )}
          </div>
          {row.role === 'ADMIN' && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 block leading-tight">
              Studio admin
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render Contact column
  const renderContact = (row: CustomerListDto) => (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 truncate max-w-[190px]">
        <Mail className="h-3 w-3 text-stone-400 shrink-0" strokeWidth={1.5} />
        <span className="truncate">{row.email}</span>
      </div>
      {row.phone ? (
        <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-500 tabular-nums font-mono">
          <Phone className="h-3 w-3 text-stone-400 shrink-0" strokeWidth={1.5} />
          <span>{row.phone}</span>
        </div>
      ) : null}
    </div>
  );

  // Render Status column
  const renderStatus = (row: CustomerListDto) => {
    const isBlocked = blockedCustomerIds
      ? blockedCustomerIds.has(row.id)
      : row.role === 'BLOCKED';

    return isBlocked ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50 select-none">
        <Ban className="h-3 w-3 text-rose-600 dark:text-rose-400 shrink-0" strokeWidth={1.5} />
        Blocked
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 select-none">
        <CheckCircle className="h-3 w-3 text-stone-500 dark:text-stone-400 shrink-0" strokeWidth={1.5} />
        Active
      </span>
    );
  };

  // Render Visit Count column
  const renderVisitCount = (row: CustomerListDto) => (
    <span className="text-xs tabular-nums text-stone-800 dark:text-stone-200">
      <span className="font-semibold">{row.bookingCount ?? 0}</span>
      <span className="text-stone-400 dark:text-stone-500 ml-1">visits</span>
    </span>
  );

  // Render Loyalty Stamps column
  const renderStamps = (row: CustomerListDto) => (
    <span className="text-xs tabular-nums text-stone-800 dark:text-stone-200">
      <span className="font-semibold">{row.loyaltyStamps ?? 0}</span>
      <span className="text-stone-400 dark:text-stone-500 ml-1">stamps</span>
    </span>
  );

  // Render Registered Date column
  const renderRegistered = (row: CustomerListDto) => (
    <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
      {formatDateShort(row.createdAt)}
    </span>
  );

  // Render Actions column
  const renderActions = (row: CustomerListDto) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAddNote(row)}
        className="h-7 px-2 text-xs font-medium gap-1 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md"
      >
        <FileText className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
        <span>Owner notes</span>
      </Button>

      {onToggleBlock && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleBlock(row)}
          title={blockedCustomerIds?.has(row.id) || row.role === 'BLOCKED' ? 'Unblock customer' : 'Block customer'}
          className="h-7 w-7 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-md"
          aria-label={(blockedCustomerIds?.has(row.id) || row.role === 'BLOCKED') ? `Unblock ${row.name}` : `Block ${row.name}`}
        >
          {(blockedCustomerIds?.has(row.id) || row.role === 'BLOCKED') ? (
            <CheckCircle className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
          ) : (
            <Ban className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
        </Button>
      )}
    </div>
  );

  // Mobile card render
  const renderMobileCard = (row: CustomerListDto) => {
    const isBlocked = blockedCustomerIds
      ? blockedCustomerIds.has(row.id)
      : row.role === 'BLOCKED';
    const nickname = customerNicknames[row.id];

    return (
      <div className="space-y-3">
        {/* Header with customer name and status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-[11px] shrink-0 select-none">
                {getInitials(row.name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                    {row.name}
                  </span>
                  {nickname && (
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-normal bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                      {nickname}
                    </span>
                  )}
                </div>
                {row.role === 'ADMIN' && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 block leading-tight">
                    Studio admin
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {isBlocked ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50 select-none">
                <Ban className="h-3 w-3 text-rose-600 dark:text-rose-400 shrink-0" strokeWidth={1.5} />
                Blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 select-none">
                <CheckCircle className="h-3 w-3 text-stone-500 dark:text-stone-400 shrink-0" strokeWidth={1.5} />
                Active
              </span>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0 stroke-[1.5]" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-stone-500 dark:text-stone-400">Email</p>
              <p className="text-sm text-stone-800 dark:text-stone-200 truncate">{row.email}</p>
            </div>
          </div>

          {row.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0 stroke-[1.5]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500 dark:text-stone-400">Phone</p>
                <p className="text-sm text-stone-800 dark:text-stone-200 tabular-nums font-mono">{row.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0 w-20">Visits</span>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 tabular-nums font-mono">
              {row.bookingCount ?? 0} visits
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0 w-20">Stamps</span>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 tabular-nums font-mono">
              {row.loyaltyStamps ?? 0} stamps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0 w-20">Registered</span>
            <p className="text-sm text-stone-800 dark:text-stone-200 tabular-nums font-mono">
              {formatDateShort(row.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-rose-200/60 dark:border-rose-950/50 flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddNote(row)}
            className="h-7 px-2 text-xs font-medium gap-1 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md"
          >
            <FileText className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
            <span>Owner notes</span>
          </Button>

          {onToggleBlock && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleBlock(row)}
              title={isBlocked ? 'Unblock customer' : 'Block customer'}
              className="h-7 w-7 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-md"
              aria-label={isBlocked ? `Unblock ${row.name}` : `Block ${row.name}`}
            >
              {isBlocked ? (
                <CheckCircle className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
              ) : (
                <Ban className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const columns: DataTableColumn<CustomerListDto>[] = [
    {
      key: 'customer',
      header: 'Customer',
      render: renderCustomer,
      showOnMobile: true,
      hidePriority: 99,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: renderContact,
      className: 'hidden sm:table-cell',
      showOnMobile: true,
      hidePriority: 2,
    },
    {
      key: 'status',
      header: 'Status',
      render: renderStatus,
      showOnMobile: true,
      hidePriority: 99,
    },
    {
      key: 'visits',
      header: 'Visit count',
      render: renderVisitCount,
      className: 'hidden md:table-cell',
      showOnMobile: true,
      hidePriority: 3,
    },
    {
      key: 'stamps',
      header: 'Stamps',
      render: renderStamps,
      className: 'hidden md:table-cell',
      showOnMobile: true,
      hidePriority: 4,
    },
    {
      key: 'registered',
      header: 'Registered',
      render: renderRegistered,
      className: 'hidden lg:table-cell',
      showOnMobile: true,
      hidePriority: 5,
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={customers}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        renderRowActions={renderActions}
        enableColumnToggle
        columnToggleTitle="Columns"
        renderMobileCard={renderMobileCard}
        mobileCardTitleKey="name"
        mobileCardSubtitleKey="email"
      />
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            Page {currentPage + 1} of {totalPages}
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}