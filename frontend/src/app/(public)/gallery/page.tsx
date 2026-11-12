'use client';

import { useState } from 'react';
import { Search, Filter, X, Expand, Loader2 } from 'lucide-react';
import { useQuery } from '@/hooks/useApi';
import { galleryApi } from '@/lib/api';
import { GalleryDto } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { getCategoryColor } from '@/lib/utils';

const GALLERY_CATEGORIES: SelectOption[] = [
  { value: '', label: 'All Categories' },
  { value: 'GEL', label: 'Gel Nails' },
  { value: 'EXTENSION', label: 'Extensions' },
  { value: 'PEDICURE', label: 'Pedicure' },
  { value: 'NAIL_ART', label: 'Nail Art' },
];

export default function GalleryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryDto | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: galleryData, isLoading, refetch } = useQuery(
    () => galleryApi.getPublic({ search: debouncedSearch, category: category || undefined }),
    { enabled: true }
  );

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const gallery = galleryData?.data || [];
  const hasFilters = search || category;

  return (
    <div className="container-padding section-padding">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Our Gallery
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Browse our collection of nail art creations and get inspired for your next appointment.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by title or description..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4">
              <Select
                placeholder="Category"
                options={GALLERY_CATEGORIES}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-48"
              />
              {hasFilters && (
                <Button variant="outline" onClick={() => { setSearch(''); setCategory(''); setDebouncedSearch(''); }} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
              <Skeleton variant="rectangular" className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : gallery.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Images Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {hasFilters ? 'Try adjusting your filters or search terms.' : 'No gallery images available yet.'}
          </p>
          {hasFilters && (
            <Button variant="outline" onClick={() => { setSearch(''); setCategory(''); setDebouncedSearch(''); }}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {gallery.map((item: GalleryDto) => (
            <GalleryItem
              key={item.id}
              item={item}
              onClick={() => setSelectedImage(item)}
            />
          ))}
        </div>
      )}

      {/* Image Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        size="lg"
        showClose
      >
        {selectedImage && (
          <div className="flex flex-col items-center">
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.title}
              className="max-h-[70vh] w-auto rounded-lg shadow-lg"
            />
            <div className="mt-4 text-center w-full">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedImage.title}
              </h3>
              {selectedImage.category && (
                <Badge className={`${getCategoryColor(selectedImage.category!)} mt-2`}>
                  {selectedImage.category}
                </Badge>
              )}
              {selectedImage.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {selectedImage.description}
                </p>
              )}
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
    <div className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer">
      <img
        src={item.imageUrl}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <div className="w-full">
          <h3 className="font-semibold text-white text-sm sm:text-base">
            {item.title}
          </h3>
          {item.category && (
            <Badge className={`${getCategoryColor(item.category)} mt-1 text-xs`}>
              {item.category}
            </Badge>
          )}
        </div>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="p-2 rounded-full bg-white/90 text-gray-900 hover:bg-white shadow-lg"
          aria-label="View full size"
        >
          <Expand className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}