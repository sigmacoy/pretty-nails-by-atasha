'use client';

import { useState } from 'react';
import { Image, Trash2, Edit, Eye, Check, X } from 'lucide-react';
import { GalleryDto, GalleryCategory } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface GalleryGridProps {
  items: GalleryDto[];
  isLoading: boolean;
  onEdit: (item: GalleryDto) => void;
  onDelete: (id: string) => void;
  onView: (item: GalleryDto) => void;
  emptyMessage?: string;
}

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  GEL: 'Gel',
  EXTENSION: 'Extension',
  PEDICURE: 'Pedicure',
  NAIL_ART: 'Nail Art',
};

export function GalleryGrid({
  items,
  isLoading,
  onEdit,
  onDelete,
  onView,
  emptyMessage = 'No gallery items found',
}: GalleryGridProps) {
  const [previewItem, setPreviewItem] = useState<GalleryDto | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Image className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
            onView={() => onView(item)}
          />
        ))}
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title}
        size="lg"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Category:</span>{' '}
                {previewItem.category ? CATEGORY_LABELS[previewItem.category as GalleryCategory] : '—'}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <Badge variant={previewItem.isActive ? 'success' : 'secondary'}>
                  {previewItem.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </p>
              <p>
                <span className="font-medium">Created:</span>{' '}
                {formatDateShort(previewItem.createdAt)}
              </p>
              {previewItem.description && (
                <p>
                  <span className="font-medium">Description:</span>{' '}
                  {previewItem.description}
                </p>
              )}
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
    <div className={cn('group relative rounded-xl border overflow-hidden bg-card transition-shadow hover:shadow-lg', !item.isActive && 'opacity-60')}>
      {/* Image */}
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Status overlay */}
        {!item.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Inactive
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 flex-1 min-w-0">
            {item.title}
          </h3>
          {item.category && (
            <Badge variant="outline" className="text-xs shrink-0">
              {CATEGORY_LABELS[item.category as GalleryCategory]}
            </Badge>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <span>{formatDateShort(item.createdAt)}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onView}
              aria-label="View full size"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onEdit}
              aria-label="Edit"
            >
              <Edit className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border overflow-hidden bg-card animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="flex justify-end pt-3 border-t">
          <div className="h-8 w-24 bg-muted rounded flex gap-2 items-center justify-end px-2" />
        </div>
      </div>
    </div>
  );
}
