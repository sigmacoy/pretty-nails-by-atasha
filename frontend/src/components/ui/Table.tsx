'use client';

import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  renderRowActions?: (row: T) => ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = 'No records available',
  renderRowActions,
  className,
  striped = false,
  hoverable = true,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden bg-card', className)}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/60">
                {columns.map((col) => (
                  <th key={col.key} className={cn('px-4 py-2.5 text-xs font-medium text-stone-600 dark:text-stone-400', col.headerClassName)}>
                    <Skeleton variant="text" width={col.header.length * 8} />
                  </th>
                ))}
                {renderRowActions && (
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-stone-600 dark:text-stone-400">
                    <Skeleton variant="text" width={48} />
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={cn(striped && i % 2 === 0 && 'bg-stone-50/40 dark:bg-stone-900/20')}>
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      <Skeleton variant="text" width={80} />
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-3 text-right">
                      <Skeleton variant="text" width={48} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('rounded-xl border border-stone-200/80 dark:border-stone-800/80 p-8 text-center bg-card', className)}>
        <p className="text-sm text-stone-500 dark:text-stone-400 font-normal">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 text-xs font-medium text-stone-600 dark:text-stone-400',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
              {renderRowActions && (
                <th className="px-4 py-2.5 text-right text-xs font-medium text-stone-600 dark:text-stone-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'transition-colors',
                  striped && rowIndex % 2 === 0 && 'bg-stone-50/40 dark:bg-stone-900/20',
                  hoverable && 'hover:bg-stone-50/80 dark:hover:bg-stone-850/60'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-sm text-stone-800 dark:text-stone-200 tabular-nums', col.className)}>
                    {col.render ? col.render(row, rowIndex) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
                {renderRowActions && (
                  <td className="px-4 py-3 text-right text-sm">
                    {renderRowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxPageNumbers = 5,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];

  if (showPageNumbers) {
    const half = Math.floor(maxPageNumbers / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, start + maxPageNumbers - 1);

    if (end - start + 1 < maxPageNumbers) {
      start = Math.max(0, end - maxPageNumbers + 1);
    }

    if (start > 0) {
      pages.push(0);
      if (start > 1) pages.push('ellipsis');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      if (end < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages - 1);
    }
  }

  return (
    <nav className={cn('flex items-center justify-center gap-1.5 tabular-nums', className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="h-8 w-8 rounded-md flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
      </button>

      {pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-stone-400">
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'h-8 min-w-8 px-2.5 text-xs font-medium rounded-md transition-colors',
              page === currentPage
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Page ${page + 1}`}
          >
            {page + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="h-8 w-8 rounded-md flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4 stroke-[1.5]" />
      </button>
    </nav>
  );
}
