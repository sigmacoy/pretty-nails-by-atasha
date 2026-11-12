'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkle, Eye, Calendar, X } from 'lucide-react';
import { useQuery } from '@/hooks/useApi';
import { galleryApi } from '@/lib/api';
import { GalleryDto } from '@/types';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface CategoryOption {
  value: string;
  label: string;
}

const GALLERY_CATEGORIES: CategoryOption[] = [
  { value: '', label: 'All designs' },
  { value: 'GEL', label: 'Gel nails' },
  { value: 'EXTENSION', label: 'Extensions' },
  { value: 'PEDICURE', label: 'Pedicure' },
  { value: 'NAIL_ART', label: 'Nail art' },
];

function formatCategory(category?: string): string {
  if (!category) return '';
  switch (category) {
    case 'GEL':
      return 'Gel nails';
    case 'EXTENSION':
      return 'Extensions';
    case 'PEDICURE':
      return 'Pedicure';
    case 'NAIL_ART':
      return 'Nail art';
    case 'ADDON':
      return 'Add-on';
    default:
      return category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}

export default function GalleryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryDto | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Synchronize debounced search with 300ms timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: galleryData, isLoading } = useQuery(
    () => galleryApi.getPublic({ search: debouncedSearch, category: category || undefined }),
    { enabled: true }
  );

  const gallery = galleryData?.data || [];
  const hasFilters = Boolean(search || category);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setDebouncedSearch('');
  };

  return (
    <div className="container-padding section-padding">
      {/* Header */}
      <div className="mb-8 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 text-xs font-normal mb-3">
          <Sparkle className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.5} />
          <span>Studio portfolio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Nail art gallery
        </h1>
        <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-normal leading-relaxed">
          Browse handcrafted sets, custom gel art, and sculpted extensions by Atasha. Select any design to view details or book an appointment.
        </p>
      </div>

      {/* Search & Category Filter Row with fixed 8px rhythm */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-8">
        {/* Category tabs with fixed 8px gap */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {GALLERY_CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'inline-flex items-center px-3.5 py-1.5 text-xs sm:text-sm rounded-lg transition-colors duration-150 whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200/70 dark:border-stone-800 font-normal'
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search input with fixed 8px gap */}
        <div className="flex items-center gap-2 w-full md:w-72 shrink-0">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
              strokeWidth={1.5}
            />
            <Input
              placeholder="Search designs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm bg-card border-stone-200/80 dark:border-stone-800/80 rounded-lg"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 px-2.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 gap-1.5 rounded-lg shrink-0"
              title="Clear search and category filters"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800/60"
            >
              <Skeleton variant="rectangular" className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : gallery.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20">
          <div className="h-12 w-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400 dark:text-stone-500">
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-medium text-stone-900 dark:text-stone-100 mb-1">
            No designs found
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4 font-normal">
            {hasFilters
              ? 'No nail art matches your current search or category filter. Try clearing filters to view all designs.'
              : 'No nail art designs have been published to the gallery yet.'}
          </p>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {gallery.map((item: GalleryDto) => (
            <GalleryItem
              key={item.id}
              item={item}
              onClick={() => setSelectedImage(item)}
            />
          ))}
        </div>
      )}

      {/* Image Modal Preview */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        size="xl"
        showClose
      >
        {selectedImage && (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* High-res Photo Preview Card (12px nested radius) */}
            <div className="w-full md:w-3/5 aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shrink-0">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Design Details Column */}
            <div className="w-full md:w-2/5 flex flex-col justify-between self-stretch py-1">
              <div>
                {selectedImage.category && (
                  <span className="inline-block px-2.5 py-0.5 rounded-[6px] text-xs font-normal bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 mb-2">
                    {formatCategory(selectedImage.category)}
                  </span>
                )}
                <h3 className="text-xl font-medium text-stone-900 dark:text-stone-100 tracking-tight">
                  {selectedImage.title}
                </h3>
                {selectedImage.description && (
                  <p className="mt-2.5 text-sm text-stone-600 dark:text-stone-400 font-normal leading-relaxed">
                    {selectedImage.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-stone-200/60 dark:border-stone-800/60">
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <Sparkle className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.5} />
                    <span>Custom studio creation by Pretty Nails</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex flex-col gap-2">
                <Link
                  href={`/booking?design=${encodeURIComponent(selectedImage.title)}`}
                  className="w-full"
                >
                  <Button className="w-full rounded-lg gap-2" size="md">
                    <Calendar className="w-4 h-4" strokeWidth={1.5} />
                    <span>Book this design</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full rounded-lg text-xs"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                >
                  Close preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface GalleryItemProps {
  item: GalleryDto;
  onClick: () => void;
}

function GalleryItem({ item, onClick }: GalleryItemProps) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-stone-100 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800/70"
    >
      {/* Photography Hero Moment — stable, crisp image without artificial zoom scale */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />

      {/* Quiet Dark Scrim Overlay — 200ms opacity transition */}
      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between">
        {/* Top Header inside Overlay */}
        <div className="flex items-center justify-between gap-2">
          {item.category ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-normal text-stone-300 bg-stone-900/80 border border-stone-700/60">
              {formatCategory(item.category)}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 transition-colors duration-150"
            aria-label="View design preview"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Bottom Details & Direct Book Action */}
        <div>
          <h3 className="font-medium text-stone-100 text-sm sm:text-base line-clamp-1">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-0.5 text-xs text-stone-300 line-clamp-1 font-normal">
              {item.description}
            </p>
          )}

          <Link
            href={`/booking?design=${encodeURIComponent(item.title)}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          >
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Book this design</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
