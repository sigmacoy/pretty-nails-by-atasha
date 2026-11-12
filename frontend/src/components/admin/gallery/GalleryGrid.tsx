'use client';

import { useState } from 'react';
import { Image as ImageIcon, Trash2, Edit2, Eye, Plus, Tag, Calendar, Sparkles } from 'lucide-react';
import { GalleryDto, GalleryCategory } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateShort, cn } from '@/lib/utils';

export interface GalleryGridProps {
  items: GalleryDto[];
  isLoading: boolean;
  onEdit: (item: GalleryDto) => void;
  onDelete: (id: string) => void;
  onView: (item: GalleryDto) => void;
  onAdd?: () => void;
  emptyMessage?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  GEL: 'Gel nails',
  EXTENSION: 'Extensions',
  PEDICURE: 'Pedicure',
  NAIL_ART: 'Nail art',
  ADDON: 'Add-on',
};

function formatCategory(category?: string): string {
  if (!category) return 'Untagged';
  return (
    CATEGORY_LABELS[category] ||
    category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ')
  );
}

export function GalleryGrid({
  items,
  isLoading,
  onEdit,
  onDelete,
  onView,
  onAdd,
  emptyMessage = 'No nail designs found',
}: GalleryGridProps) {
  const [previewItem, setPreviewItem] = useState<GalleryDto | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-8 sm:p-12 text-center shadow-card">
        <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center mb-4">
          <ImageIcon className="h-6 w-6 text-stone-400 dark:text-stone-500" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 className="text-base font-medium text-stone-900 dark:text-stone-100 mb-1">
          {emptyMessage}
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal max-w-sm mx-auto mb-6">
          Upload portfolio photography with style tags and descriptions for salon clients to discover.
        </p>
        {onAdd && (
          <Button onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            <span>Upload design</span>
          </Button>
        )}
      </div>
    );
  }

  const handleOpenPreview = (item: GalleryDto) => {
    setPreviewItem(item);
    onView(item);
  };

  return (
    <>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Upload Action Card */}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-primary/50 dark:hover:border-primary/50 bg-stone-50/50 dark:bg-stone-900/20 hover:bg-stone-100/40 dark:hover:bg-stone-800/30 p-6 min-h-[280px] transition-colors duration-150 text-center"
          >
            <div className="w-11 h-11 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors duration-150">
              <Plus className="w-5 h-5 text-stone-500 dark:text-stone-400 group-hover:text-primary transition-colors duration-150" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-stone-800 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-100">
              Upload design
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500 mt-1 font-normal max-w-[170px] leading-relaxed">
              Add new photography to the studio portfolio
            </span>
          </button>
        )}

        {/* Gallery items */}
        {items.map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
            onView={() => handleOpenPreview(item)}
          />
        ))}
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'Design preview'}
        description="Studio portfolio design details"
        size="lg"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-stone-950 border border-stone-200/80 dark:border-stone-800/80">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/60">
              <div>
                <span className="text-stone-400 dark:text-stone-500 font-normal block mb-0.5">Style tag</span>
                <span className="inline-flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                  <Tag className="w-3 h-3 text-primary" strokeWidth={1.5} />
                  {formatCategory(previewItem.category)}
                </span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-stone-500 font-normal block mb-0.5">Visibility</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                  <span className={cn('w-1.5 h-1.5 rounded-full', previewItem.isActive ? 'bg-emerald-500' : 'bg-stone-400')} />
                  {previewItem.isActive ? 'Published to gallery' : 'Hidden draft'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-stone-500 font-normal block mb-0.5">Added on</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">
                  {formatDateShort(previewItem.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-stone-500 font-normal block mb-0.5">Design ID</span>
                <span className="font-mono text-stone-500 text-[11px] truncate block">
                  {previewItem.id}
                </span>
              </div>
            </div>

            {previewItem.description && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">Description</span>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-normal leading-relaxed">
                  {previewItem.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewItem(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const target = previewItem;
                  setPreviewItem(null);
                  onEdit(target);
                }}
              >
                <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Edit design</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function GalleryCard({
  item,
  onEdit,
  onDelete,
  onView,
}: {
  item: GalleryDto;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden bg-card transition-shadow duration-150 hover:shadow-soft flex flex-col justify-between',
        !item.isActive && 'opacity-70'
      )}
    >
      {/* Photo Area with Quiet Hover Overlay */}
      <div className="aspect-[4/3] relative overflow-hidden bg-stone-100 dark:bg-stone-900">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover select-none"
          loading="lazy"
        />

        {/* Inactive draft label */}
        {!item.isActive && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            <span className="inline-flex items-center rounded-[6px] bg-stone-900/85 backdrop-blur-sm text-stone-300 text-[11px] font-normal px-2 py-0.5 border border-stone-700/60">
              Draft
            </span>
          </div>
        )}

        {/* Quiet Dark Overlay with Action Buttons */}
        <div className="absolute inset-0 bg-stone-950/65 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-3">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700/80 transition-colors duration-150"
            title="View details"
            aria-label="View details"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700/80 transition-colors duration-150"
            title="Edit design"
            aria-label="Edit design"
          >
            <Edit2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-800/80 transition-colors duration-150"
            title="Delete design"
            aria-label="Delete design"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100 line-clamp-1 flex-1">
              {item.title}
            </h3>
            {item.category && (
              <span className="inline-flex items-center gap-1 rounded-[6px] bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 text-[11px] font-normal px-2 py-0.5 shrink-0">
                <Tag className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                {formatCategory(item.category)}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-xs text-stone-500 dark:text-stone-400 font-normal line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-800/60 pt-3 font-normal">
          <span className="font-mono text-[11px]">{formatDateShort(item.createdAt)}</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                item.isActive ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
              )}
            />
            {item.isActive ? 'Published' : 'Hidden'}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden bg-card animate-pulse shadow-card">
      <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-800/50" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div className="h-4 w-1/2 bg-stone-200/60 dark:bg-stone-700/60 rounded-md" />
          <div className="h-4 w-16 bg-stone-200/60 dark:bg-stone-700/60 rounded-[6px]" />
        </div>
        <div className="h-3 w-4/5 bg-stone-100 dark:bg-stone-800/60 rounded" />
        <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-stone-800/60">
          <div className="h-3 w-16 bg-stone-100 dark:bg-stone-800/60 rounded" />
          <div className="h-3 w-14 bg-stone-100 dark:bg-stone-800/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}
