'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
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
  emptyMessage = 'No data available',
  renderRowActions,
  className,
  striped = true,
  hoverable = true,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border', className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((col) => (
                  <th key={col.key} className={cn('px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider', col.headerClassName)}>
                    <Skeleton variant="text" width={col.header.length * 8} />
                  </th>
                ))}
                {renderRowActions && (
                  <th className="px-4 py-3 text-right">
                    <Skeleton variant="text" width={60} />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={cn('border-b', striped && i % 2 === 0 && 'bg-muted/50')}>
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-4', col.className)}>
                      <Skeleton variant="text" width={80} />
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-4 text-right">
                      <Skeleton variant="text" width={60} />
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
      <div className={cn('rounded-lg border p-8 text-center', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider', col.headerClassName)}
                >
                  {col.header}
                </th>
              ))}
              {renderRowActions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'border-b transition-colors',
                  striped && rowIndex % 2 === 0 && 'bg-muted/30',
                  hoverable && 'hover:bg-muted/50'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-4', col.className)}>
                    {col.render ? col.render(row, rowIndex) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
                {renderRowActions && (
                  <td className="px-4 py-4 text-right">
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
    <nav className={cn('flex items-center justify-center gap-2', className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="btn-ghost h-10 w-10 p-0 disabled:opacity-50"
        aria-label="Previous page"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'h-10 min-w-10 px-3 text-sm font-medium rounded-md transition-colors',
              page === currentPage
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
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
        className="btn-ghost h-10 w-10 p-0 disabled:opacity-50"
        aria-label="Next page"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}