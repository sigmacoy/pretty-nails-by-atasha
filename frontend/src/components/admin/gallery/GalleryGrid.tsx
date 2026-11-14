'use client';

import { useState } from 'react';
import { Image as ImageIcon, Trash2, Edit2, Eye, Plus, Tag } from 'lucide-react';
import { GalleryDto } from '@/types';
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
  GEL: 'Structured BIAB Overlay',
  EXTENSION: 'Japanese Soft Gel Extension',
  VELVET_CAT_EYE: 'Velvet Cat-Eye Finish',
  NAIL_ART: 'Bespoke Hand-Painted Art',
  FRENCH_CONTOUR: 'French Hairline Contour',
  PEDICURE: 'Dry Cuticle Hygiene Care',
  ADDON: 'Atelier Add-on',
};

function formatCategory(category?: string): string {
  if (!category) return 'Untagged Atelier Work';
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
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm p-8 sm:p-12 text-center shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center mb-4 text-rose-800 dark:text-rose-300">
          <ImageIcon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50 mb-1">
          {emptyMessage}
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal max-w-sm mx-auto mb-6 leading-relaxed">
          Upload portfolio photography with style discipline tags and descriptions for atelier clients to discover.
        </p>
        {onAdd && (
          <Button
            onClick={onAdd}
            className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] flex items-center gap-2 mx-auto"
          >
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
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Upload Action Card */}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200/80 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-700 bg-white/40 dark:bg-[#1A0E15]/40 hover:bg-white/80 dark:hover:bg-[#1A0E15]/80 p-6 min-h-[300px] transition-colors duration-200 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 group-hover:bg-rose-900 group-hover:text-white text-rose-900 dark:text-rose-200 flex items-center justify-center mb-3 transition-colors duration-200">
              <Plus className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-stone-900 dark:text-rose-100">
              Upload design
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-normal max-w-[180px] leading-relaxed">
              Add new photography to the atelier portfolio
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
        description="Atelier lookbook design curation details"
        size="lg"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-stone-950 border border-rose-200/80 dark:border-rose-950/60">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-white/60 dark:bg-stone-900/60 border border-rose-200/70 dark:border-rose-950/60">
              <div>
                <span className="text-stone-500 dark:text-stone-400 font-normal block mb-1">
                  Atelier discipline
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-rose-950 dark:text-rose-200">
                  <Tag className="w-3.5 h-3.5 text-rose-800 dark:text-rose-300" strokeWidth={1.5} />
                  {formatCategory(previewItem.category)}
                </span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 font-normal block mb-1">
                  Publication status
                </span>
                <span className="font-mono text-stone-800 dark:text-stone-200">
                  {previewItem.isActive ? 'Published to lookbook' : 'Hidden draft'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 font-normal block mb-1">
                  Curated date
                </span>
                <span className="font-mono text-stone-800 dark:text-stone-200 tabular-nums">
                  {formatDateShort(previewItem.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 font-normal block mb-1">
                  Portfolio design ID
                </span>
                <span className="font-mono text-stone-600 dark:text-stone-400 text-[11px] truncate block">
                  {previewItem.id}
                </span>
              </div>
            </div>

            {previewItem.description && (
              <div className="space-y-1.5 p-4 rounded-xl bg-white/40 dark:bg-stone-900/40 border border-rose-200/60 dark:border-rose-950/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Technique & notes
                </span>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-normal leading-relaxed">
                  {previewItem.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-rose-200/60 dark:border-rose-950/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewItem(null)}
                className="h-10 px-5 rounded-full border-rose-200/80 dark:border-rose-800/60 text-xs font-medium"
              >
                Close
              </Button>
              <Button
                size="sm"
                className="h-10 px-5 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium gap-2 border border-rose-800/80 shadow-xs"
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
        'group relative rounded-2xl border border-rose-200/80 dark:border-rose-950/60 overflow-hidden bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm shadow-sm transition-all duration-200 hover:border-rose-300 dark:hover:border-rose-800 flex flex-col justify-between',
        !item.isActive && 'opacity-75'
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
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="inline-flex items-center rounded-full bg-stone-950/85 backdrop-blur-sm text-rose-200 text-[11px] font-mono px-2.5 py-0.5 border border-rose-900/60">
              Draft
            </span>
          </div>
        )}

        {/* Quiet Dark Overlay with Circular Action Buttons */}
        <div className="absolute inset-0 bg-stone-950/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 p-3">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-900/90 hover:bg-stone-950 text-rose-100 border border-rose-300/40 hover:scale-105 transition-all duration-150"
            title="View details"
            aria-label="View details"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-900/90 hover:bg-stone-950 text-rose-100 border border-rose-300/40 hover:scale-105 transition-all duration-150"
            title="Edit design"
            aria-label="Edit design"
          >
            <Edit2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-800/80 hover:scale-105 transition-all duration-150"
            title="Delete design"
            aria-label="Delete design"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-serif font-medium text-base text-stone-900 dark:text-rose-50 line-clamp-1 flex-1">
              {item.title}
            </h3>
          </div>

          {item.category && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-[11px] font-medium px-2.5 py-0.5">
                <Tag className="w-3 h-3 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                {formatCategory(item.category)}
              </span>
            </div>
          )}

          {item.description && (
            <p className="text-xs text-stone-600 dark:text-stone-400 font-normal line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-t border-rose-100 dark:border-rose-950/60 pt-3 font-normal">
          <span className="font-mono text-[11px] tabular-nums">{formatDateShort(item.createdAt)}</span>
          <span className="font-mono text-[11px] text-rose-900 dark:text-rose-300">
            {item.isActive ? 'Published' : 'Hidden'}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 overflow-hidden bg-white/60 dark:bg-[#1A0E15]/60 shadow-sm">
      <div className="aspect-[4/3] bg-rose-100/50 dark:bg-stone-900/60" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div className="h-4 w-1/2 bg-rose-200/50 dark:bg-stone-800/60 rounded-md" />
          <div className="h-4 w-16 bg-rose-200/50 dark:bg-stone-800/60 rounded-full" />
        </div>
        <div className="h-3 w-4/5 bg-rose-100/60 dark:bg-stone-800/40 rounded" />
        <div className="flex justify-between items-center pt-3 border-t border-rose-100 dark:border-rose-950/60">
          <div className="h-3 w-16 bg-rose-100/60 dark:bg-stone-800/40 rounded" />
          <div className="h-3 w-14 bg-rose-100/60 dark:bg-stone-800/40 rounded-full" />
        </div>
      </div>
    </div>
  );
}
