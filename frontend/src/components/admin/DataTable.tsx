'use client';

import { ReactNode, useState, useMemo } from 'react';
import { Columns, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** Whether this column is visible by default on mobile cards */
  showOnMobile?: boolean;
  /** Priority for column hiding on desktop (lower = hidden first) */
  hidePriority?: number;
  /** Accessor key for getting raw value (for sorting/filtering) */
  accessor?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  renderRowActions?: (row: T) => ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  /** Enable column visibility toggle on desktop */
  enableColumnToggle?: boolean;
  /** Title for the column toggle dropdown */
  columnToggleTitle?: string;
  /** Custom render for mobile card - if not provided, uses column render functions */
  renderMobileCard?: (row: T, visibleColumns: DataTableColumn<T>[]) => ReactNode;
  /** Key of the column to use as the main identifier on mobile cards */
  mobileCardTitleKey?: string;
  /** Subtitle key for mobile cards */
  mobileCardSubtitleKey?: string;
}

interface ColumnToggleState {
  [key: string]: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = 'No records available',
  renderRowActions,
  className,
  striped = false,
  hoverable = true,
  enableColumnToggle = true,
  columnToggleTitle = 'Columns',
  renderMobileCard,
  mobileCardTitleKey,
  mobileCardSubtitleKey,
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<ColumnToggleState>(
    useMemo(() => {
      const initial: ColumnToggleState = {};
      columns.forEach((col) => {
        initial[col.key] = true;
      });
      return initial;
    }, [columns])
  );

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  const visibleColumns = useMemo(
    () => columns.filter((col) => columnVisibility[col.key]),
    [columns, columnVisibility]
  );

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetColumns = () => {
    setColumnVisibility(
      columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
    );
  };

  // Loading state
  if (isLoading) {
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
                    <span className="h-4 bg-stone-200/50 dark:bg-stone-800/50 rounded animate-pulse inline-block" style={{ width: `${col.header.length * 8}px` }} />
                  </th>
                ))}
                {renderRowActions && (
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-stone-600 dark:text-stone-400">
                    <span className="h-4 w-12 bg-stone-200/50 dark:bg-stone-800/50 rounded animate-pulse inline-block" />
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={cn(striped && i % 2 === 0 && 'bg-stone-50/40 dark:bg-stone-900/20')}>
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      <span className="h-4 w-24 bg-stone-200/50 dark:bg-stone-800/50 rounded animate-pulse inline-block" />
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-3 text-right">
                      <span className="h-4 w-12 bg-stone-200/50 dark:bg-stone-800/50 rounded animate-pulse inline-block" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile card loading skeleton */}
        <div className="md:hidden space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm p-4 space-y-3 animate-pulse">
              <div className="h-5 w-3/4 bg-stone-200/50 dark:bg-stone-800/50 rounded" />
              <div className="h-4 w-1/2 bg-stone-200/50 dark:bg-stone-800/50 rounded" />
              <div className="h-4 w-full bg-stone-200/50 dark:bg-stone-800/50 rounded" />
              <div className="h-4 w-2/3 bg-stone-200/50 dark:bg-stone-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('rounded-2xl border border-rose-200/80 dark:border-rose-950/60 p-12 text-center bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-card', className)}>
        <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-rose-50 mb-1">
          {emptyMessage}
        </h3>
        <p className="font-sans text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto font-normal">
          No records are currently cataloged in this table view.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        {/* Column Toggle Toolbar */}
        {enableColumnToggle && columns.some((c) => c.hidePriority !== undefined) && (
          <div className="mb-3 flex items-center justify-end">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className="h-9 px-3 gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
                aria-label={columnToggleTitle}
                aria-expanded={isColumnMenuOpen}
                aria-haspopup="true"
              >
                <Columns className="h-3.5 w-3.5 stroke-[1.5]" />
                <span className="hidden sm:inline">{columnToggleTitle}</span>
                {isColumnMenuOpen ? <ChevronUp className="h-3.5 w-3.5 stroke-[1.5]" /> : <ChevronDown className="h-3.5 w-3.5 stroke-[1.5]" />}
              </Button>

              {isColumnMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsColumnMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-stone-950/95 backdrop-blur-sm shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-900 dark:text-rose-50 uppercase tracking-wider">
                        {columnToggleTitle}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetColumns}
                        className="h-6 w-6 text-[10px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                        aria-label="Reset all columns"
                      >
                        <Eye className="h-3.5 w-3.5 stroke-[1.5]" />
                      </Button>
                    </div>
                    <div className="py-2 space-y-1 max-h-64 overflow-y-auto">
                      {columns
                        .filter((c) => c.hidePriority !== undefined)
                        .sort((a, b) => (a.hidePriority ?? 99) - (b.hidePriority ?? 99))
                        .map((col) => (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={columnVisibility[col.key]}
                              onChange={() => toggleColumn(col.key)}
                              className="h-4 w-4 rounded border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 focus:ring-rose-500 focus:ring-2"
                              aria-label={col.header}
                            />
                            <span className="text-sm text-stone-700 dark:text-stone-300 truncate">
                              {col.header}
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-rose-200/80 dark:border-rose-950/60 overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rose-200/80 dark:border-rose-950/60 bg-stone-50/80 dark:bg-stone-900/60">
                  {visibleColumns.map((col) => (
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
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-4 py-3 text-sm text-stone-800 dark:text-stone-200 tabular-nums', col.className)}
                      >
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, rowIndex) => (
          <div
            key={keyExtractor(row)}
            className="rounded-xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm p-4 space-y-3"
          >
            {renderMobileCard ? (
              renderMobileCard(row, visibleColumns.filter((c) => c.showOnMobile))
            ) : (
              <>
                {/* Card Header with Title/Subtitle */}
                {(mobileCardTitleKey || mobileCardSubtitleKey) && (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {mobileCardTitleKey && (
                        <p className="font-medium text-sm text-stone-900 dark:text-rose-50 truncate">
                          {String((row as Record<string, unknown>)[mobileCardTitleKey] ?? '')}
                        </p>
                      )}
                      {mobileCardSubtitleKey && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {String((row as Record<string, unknown>)[mobileCardSubtitleKey] ?? '')}
                        </p>
                      )}
                    </div>
                    {renderRowActions && (
                      <div className="shrink-0">
                        {renderRowActions(row)}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Fields */}
                <div className="space-y-2">
                  {visibleColumns
                    .filter((c) => c.showOnMobile)
                    .map((col) => (
                      <div key={col.key} className="flex items-start gap-3">
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400 shrink-0 w-24">
                          {col.header}
                        </span>
                        <span className="text-sm text-stone-800 dark:text-stone-200 flex-1 min-w-0">
                          {col.render ? col.render(row, rowIndex) : String((row as Record<string, unknown>)[col.key] ?? '')}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Actions at bottom if not in header */}
                {renderRowActions && !mobileCardTitleKey && !mobileCardSubtitleKey && (
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-950/50 flex justify-end">
                    {renderRowActions(row)}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataTable;