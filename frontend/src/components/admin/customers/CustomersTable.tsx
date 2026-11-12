'use client';

import { CustomerListDto } from '@/types';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateShort, getInitials } from '@/lib/utils';
import {
  FileText,
  Ban,
  CheckCircle,
  Phone,
  Mail,
  Users,
} from 'lucide-react';

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
  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-10 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/60">
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400">Customer</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden sm:table-cell">Contact</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400">Status</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden md:table-cell">Visit count</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden md:table-cell">Stamps</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden lg:table-cell">Registered</th>
                <th className="px-4 text-right text-xs font-medium text-stone-500 dark:text-stone-400">Owner notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="h-10">
                  <td className="px-4 py-0 align-middle">
                    <div className="flex items-center gap-2.5">
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="text" width={110} />
                    </div>
                  </td>
                  <td className="px-4 py-0 align-middle hidden sm:table-cell">
                    <Skeleton variant="text" width={130} />
                  </td>
                  <td className="px-4 py-0 align-middle">
                    <Skeleton variant="rectangular" width={60} height={20} className="rounded-md" />
                  </td>
                  <td className="px-4 py-0 align-middle hidden md:table-cell">
                    <Skeleton variant="text" width={50} />
                  </td>
                  <td className="px-4 py-0 align-middle hidden md:table-cell">
                    <Skeleton variant="text" width={50} />
                  </td>
                  <td className="px-4 py-0 align-middle hidden lg:table-cell">
                    <Skeleton variant="text" width={75} />
                  </td>
                  <td className="px-4 py-0 align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Skeleton variant="rectangular" width={80} height={26} className="rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-10 text-center shadow-card">
        <div className="mx-auto w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mb-3">
          <Users className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
          {emptyMessage}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          No customer accounts match your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-10 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/60">
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400">Customer</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden sm:table-cell">Contact</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400">Status</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden md:table-cell">Visit count</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden md:table-cell">Stamps</th>
                <th className="px-4 text-xs font-medium text-stone-500 dark:text-stone-400 hidden lg:table-cell">Registered</th>
                <th className="px-4 text-right text-xs font-medium text-stone-500 dark:text-stone-400">Owner notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
              {customers.map((row) => {
                const isBlocked = blockedCustomerIds
                  ? blockedCustomerIds.has(row.id)
                  : row.role === 'BLOCKED';
                const nickname = customerNicknames[row.id];

                return (
                  <tr
                    key={row.id}
                    className="h-10 hover:bg-stone-50/70 dark:hover:bg-stone-850/50 transition-colors duration-150"
                  >
                    {/* Customer Info */}
                    <td className="px-4 py-0 align-middle">
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
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-0 align-middle hidden sm:table-cell">
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
                    </td>

                    {/* Status Tag */}
                    <td className="px-4 py-0 align-middle">
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
                    </td>

                    {/* Visit Count */}
                    <td className="px-4 py-0 align-middle hidden md:table-cell text-xs tabular-nums text-stone-800 dark:text-stone-200">
                      <span className="font-semibold">{row.bookingCount ?? 0}</span>
                      <span className="text-stone-400 dark:text-stone-500 ml-1">visits</span>
                    </td>

                    {/* Loyalty Stamps */}
                    <td className="px-4 py-0 align-middle hidden md:table-cell text-xs tabular-nums text-stone-800 dark:text-stone-200">
                      <span className="font-semibold">{row.loyaltyStamps ?? 0}</span>
                      <span className="text-stone-400 dark:text-stone-500 ml-1">stamps</span>
                    </td>

                    {/* Registered Date */}
                    <td className="px-4 py-0 align-middle hidden lg:table-cell text-xs tabular-nums text-stone-500 dark:text-stone-400">
                      {formatDateShort(row.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-0 align-middle text-right">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
