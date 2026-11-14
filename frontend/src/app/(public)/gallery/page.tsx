'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Eye, Calendar, X, Check } from 'lucide-react';
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
  { value: 'GEL', label: 'Structured BIAB & Gel' },
  { value: 'EXTENSION', label: 'Soft Gel Extensions' },
  { value: 'PEDICURE', label: 'Luxe Pedicure' },
  { value: 'NAIL_ART', label: 'Bespoke Nail Art' },
];

function formatCategory(category?: string): string {
  if (!category) return '';
  switch (category.toUpperCase()) {
    case 'GEL':
      return 'Structured BIAB & Gel';
    case 'EXTENSION':
      return 'Soft Gel Extension';
    case 'PEDICURE':
      return 'Luxe Pedicure';
    case 'NAIL_ART':
      return 'Bespoke Nail Art';
    case 'CAT-EYE FINISH':
      return 'Cat-Eye Finish';
    case 'BESPOKE ART':
      return 'Bespoke Nail Art';
    case 'STRUCTURED BIAB':
      return 'Structured BIAB';
    case 'GEL OVERLAY':
      return 'Gel Overlay';
    case 'STUDIO CRAFT':
      return 'Studio Craft';
    default:
      return category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}

// Curated studio lookbook fallback photography (sample2.jpg to sample7.jpg, omitting hero sample1.jpg)
const localGalleryFallback: GalleryDto[] = [
  {
    id: 'lookbook-1',
    title: 'Magnetic Velvet Cat-Eye in Bronze Shimmer',
    category: 'GEL',
    description: 'Deep multidimensional magnetic velvet shimmer over structured BIAB base with glass apex finish.',
    imageUrl: '/gallery/sample2.jpg',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lookbook-2',
    title: 'Tortoiseshell Glass & Noir Minimalist',
    category: 'NAIL_ART',
    description: 'Hand-painted amber tortoiseshell layers accented with delicate noir contours and gold leaf hairline.',
    imageUrl: '/gallery/sample3.jpg',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lookbook-3',
    title: 'Burgundy Wave French with Gold Hairline',
    category: 'GEL',
    description: 'Deep Bordeaux negative-space wave french finished with micro gold gilding and reinforced apex.',
    imageUrl: '/gallery/sample4.jpg',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lookbook-4',
    title: 'Milky Blush Soft Gel with Glass Cushion Top',
    category: 'EXTENSION',
    description: 'Natural almond sculpted extensions with translucent milky blush gradient and ultra-plump cushion top.',
    imageUrl: '/gallery/sample5.jpg',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lookbook-5',
    title: 'Pastel Buttercup & Metallic Foil Accent',
    category: 'NAIL_ART',
    description: 'Subtle spring buttercup monochrome paired with abstract silver foil flakes and satin matte balance.',
    imageUrl: '/gallery/sample6.jpg',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'lookbook-6',
    title: 'Precision Cuticle Prep & Gold Contour Detail',
    category: 'PEDICURE',
    description: 'Russian dry e-file hygienic care paired with seamless high-shine gel finish and micro-metallic lines.',
    imageUrl: '/gallery/sample7.jpg',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

export default function GalleryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryDto | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounced search with 300ms timing
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

  // Strict deduplication of lookbook items by imageUrl with curated local fallbacks
  const gallery = useMemo(() => {
    const apiItems = galleryData?.data?.filter((item) => item.isActive) || [];
    const seenUrls = new Set<string>();
    // Exclude hero image to preserve distinct lookbook content
    seenUrls.add('/gallery/sample1.jpg');

    const combined: GalleryDto[] = [];

    // Add API items first
    for (const item of apiItems) {
      if (!item.imageUrl) continue;
      const normalized = item.imageUrl.trim();
      if (!seenUrls.has(normalized)) {
        seenUrls.add(normalized);
        combined.push(item);
      }
    }

    // Add local fallbacks to ensure full visual collection
    for (const fallback of localGalleryFallback) {
      const normalized = fallback.imageUrl.trim();
      if (!seenUrls.has(normalized)) {
        seenUrls.add(normalized);
        combined.push(fallback);
      }
    }

    // Apply client-side search and category filtering
    return combined.filter((item) => {
      const matchesCategory = !category || item.category?.toUpperCase() === category.toUpperCase() ||
        (category === 'NAIL_ART' && (item.category === 'NAIL_ART' || item.category === 'BESPOKE ART')) ||
        (category === 'GEL' && (item.category === 'GEL' || item.category === 'STRUCTURED BIAB' || item.category === 'CAT-EYE FINISH'));

      const matchesSearch = !debouncedSearch ||
        item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(debouncedSearch.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [galleryData?.data, category, debouncedSearch]);

  const hasFilters = Boolean(search || category);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setDebouncedSearch('');
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-3">
            Studio Archive & Lookbook · Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-stone-900 dark:text-rose-50 leading-[1.08]">
            Studio Lookbook & Custom Art Archive
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
            Browse handcrafted sets, Japanese apex gel architecture, structured BIAB overlays, and bespoke hand-painted artwork by Atasha. Select any design to view details or reserve your appointment.
          </p>
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10">
          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none" role="tablist" aria-label="Lookbook categories">
            {GALLERY_CATEGORIES.map((cat) => {
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-full transition-all duration-200 whitespace-nowrap border select-none',
                    isActive
                      ? 'bg-rose-900 text-white font-medium border-rose-900 shadow-xs'
                      : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200/80 dark:border-rose-950/60 font-normal'
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search input */}
          <div className="flex items-center gap-2 w-full md:w-80 shrink-0">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none"
                strokeWidth={1.5}
              />
              <Input
                placeholder="Search lookbook designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-xs sm:text-sm bg-white/90 dark:bg-stone-900/90 border-rose-200/80 dark:border-rose-950/60 rounded-full focus:ring-rose-800"
              />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-11 px-4 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 gap-1.5 rounded-full shrink-0 border border-rose-200/80 dark:border-rose-950/60"
                title="Clear search and category filters"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-2xl overflow-hidden bg-rose-100/40 dark:bg-stone-900/60 border border-rose-200/80 dark:border-rose-950/60"
              >
                <Skeleton className="h-full w-full bg-rose-200/30 dark:bg-rose-950/40" />
              </div>
            ))}
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 shadow-card max-w-md mx-auto my-12">
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center mx-auto mb-4 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-rose-50 mb-1.5">
              No lookbook designs found
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-sm mx-auto mb-6 font-normal leading-relaxed">
              {hasFilters
                ? 'No studio finishes match your current search or category filter. Reset filters to view all archive sets.'
                : 'No studio lookbook finishes are published currently.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium transition-colors"
                onClick={handleClearFilters}
              >
                Reset Filter Settings
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
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
            <div className="flex flex-col md:flex-row gap-8 items-start p-2 sm:p-4">
              {/* High-res Photo Preview Card */}
              <div className="w-full md:w-3/5 aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-rose-200/80 dark:border-rose-900/60 shadow-card shrink-0">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Design Details Column */}
              <div className="w-full md:w-2/5 flex flex-col justify-between self-stretch py-2 text-left">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800 dark:text-rose-300 block mb-2">
                    {formatCategory(selectedImage.category) || 'Studio Finish'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900 dark:text-rose-50 tracking-tight leading-snug">
                    {selectedImage.title}
                  </h3>
                  {selectedImage.description && (
                    <p className="mt-4 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
                      {selectedImage.description}
                    </p>
                  )}

                  <div className="mt-6 pt-5 border-t border-rose-200/70 dark:border-rose-950/60">
                    <div className="flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-medium">
                      <Check className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={2} />
                      <span>Pretty Nails by Atasha · Cebu City</span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-normal">
                      Hospital-grade autoclave sterilization and custom Japanese apex gel architecture.
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="mt-8 pt-5 border-t border-rose-200/70 dark:border-rose-950/60 flex flex-col gap-3">
                  <Link
                    href={`/booking?design=${encodeURIComponent(selectedImage.title)}`}
                    className="w-full"
                  >
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center h-14 px-8 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 gap-2"
                    >
                      <Calendar className="w-4 h-4" strokeWidth={1.5} />
                      <span>Reserve This Treatment</span>
                    </button>
                  </Link>
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center h-11 px-6 rounded-full border border-rose-300/80 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 text-rose-950 dark:text-rose-200 text-xs font-medium transition-colors"
                    onClick={() => setSelectedImage(null)}
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
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
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-stone-900 border border-rose-200/80 dark:border-rose-900/60 shadow-card hover:shadow-[0_8px_28px_-6px_rgba(244,114,182,0.22)] transition-all duration-300"
    >
      {/* Photography Hero Moment */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        loading="lazy"
      />

      {/* Quiet Dark Scrim Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-between text-left">
        {/* Top Header inside Overlay */}
        <div className="flex items-center justify-between gap-2">
          {item.category ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-200 bg-stone-900/80 border border-rose-900/60">
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
            className="p-2 rounded-full bg-stone-900/80 hover:bg-rose-950 text-rose-100 border border-rose-900/60 transition-colors duration-150"
            aria-label="View design preview"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Bottom Details & Direct Book Action */}
        <div>
          <h3 className="font-serif font-medium text-white text-base sm:text-lg line-clamp-1">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-1 text-xs text-rose-100/80 line-clamp-2 font-normal leading-relaxed">
              {item.description}
            </p>
          )}

          <Link
            href={`/booking?design=${encodeURIComponent(item.title)}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3.5 inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium transition-colors duration-150 border border-rose-800/80 shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Select Design</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
