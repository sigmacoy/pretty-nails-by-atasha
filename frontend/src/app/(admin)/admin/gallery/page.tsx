'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  Search,
  FilterX,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { galleryApi } from '@/lib/api';
import { GalleryDto, GalleryRequest } from '@/types';
import { useQuery, useMutation } from '@/hooks/useApi';
import { GALLERY_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';
import { GalleryGrid, GalleryForm } from '@/components/admin/gallery';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Paginated response type (matching AdminBookingPage pattern)
interface AdminGalleryPage {
  content: GalleryDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

const DEFAULT_PAGE_SIZE = 12;

const categoryOptions: SelectOption[] = [
  { value: '', label: 'All studio disciplines' },
  { value: GALLERY_CATEGORIES.GEL, label: 'Structured BIAB Overlay' },
  { value: GALLERY_CATEGORIES.EXTENSION, label: 'Japanese Soft Gel Extension' },
  { value: GALLERY_CATEGORIES.PEDICURE, label: 'Dry Cuticle Hygiene Care' },
  { value: GALLERY_CATEGORIES.NAIL_ART, label: 'Bespoke Hand-Painted Art' },
];

export default function AdminGalleryPage() {
  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Build API params - include pagination for server-side pagination
  const params = useMemo(() => ({
    search: search || undefined,
    category: category || undefined,
    page: currentPage,
    size: DEFAULT_PAGE_SIZE,
  }), [search, category, currentPage]);

  // Fetch gallery items - API returns AxiosResponse<GalleryDto[] | AdminGalleryPage>
  const { data, isLoading, isError, error, refetch } = useQuery(
    () => galleryApi.getAdmin(params),
    { enabled: true }
  );

  // Handle both array response (GalleryDto[]) and paginated response (AdminGalleryPage)
  // Check if response has pagination properties (content, totalElements, totalPages)
  const responseData = data?.data;
  const isPaginatedResponse = responseData && typeof responseData === 'object' && 'content' in responseData && 'totalElements' in responseData && 'totalPages' in responseData;

  // Define the paginated response shape inline for casting
  type PaginatedGalleryResponse = {
    content: GalleryDto[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
  };

  const galleryItems = isPaginatedResponse ? (responseData as PaginatedGalleryResponse).content : (responseData ?? []);
  const totalItems = isPaginatedResponse ? (responseData as PaginatedGalleryResponse).totalElements : galleryItems.length;
  const totalPages = isPaginatedResponse ? (responseData as PaginatedGalleryResponse).totalPages : Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  // For paginated response, items are already paginated server-side
  // For array response, we need client-side pagination
  const paginatedItems = isPaginatedResponse ? galleryItems : galleryItems.slice(
    currentPage * DEFAULT_PAGE_SIZE,
    (currentPage + 1) * DEFAULT_PAGE_SIZE
  );

  // Mutations
  const createMutation = useMutation(
    (formData: GalleryRequest) => galleryApi.create(formData),
    {
      onSuccess: () => {
        toast.success('Nail art design added to studio lookbook.');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Could not upload nail art design. Check image format and retry.');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data: updateData }: { id: string; data: GalleryRequest }) =>
      galleryApi.update(id, updateData),
    {
      onSuccess: () => {
        toast.success('Studio lookbook design updated.');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Could not update lookbook design. Check connection and retry.');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => galleryApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Design removed from studio lookbook.');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Could not remove lookbook design. Check connection and retry.');
      },
    }
  );

  // Modal states
  const [editingItem, setEditingItem] = useState<GalleryDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = Boolean(search || category);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setCurrentPage(0);
  };

  // Handle filter changes
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(0);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value);
    setCurrentPage(0);
  }, []);

  // Handle form submit
  const handleFormSubmit = async (formData: GalleryRequest) => {
    if (editingItem) {
      await updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      await createMutation.mutate(formData);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // Handle edit
  const handleEdit = (item: GalleryDto) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this gallery design? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle view
  const handleView = () => {
    // Handled by GalleryGrid preview modal
  };

  // Open create modal
  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  if (isError) {
    return (
      <div className="space-y-8 bg-[#FFF0F3] dark:bg-[#160D12] text-foreground min-h-screen p-6 sm:p-8 lg:p-10 transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
              Lookbook & Portfolio Curation
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
              Curate high-resolution studio photography, apex gel architecture, bespoke hand-painted nail art, and public lookbook displays.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] transition-all flex items-center gap-2.5 shrink-0"
          >
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            <span>Upload design</span>
          </Button>
        </div>

        <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-[#1A0E15]/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-destructive mx-auto flex items-center justify-center border border-rose-200/60 dark:border-rose-900/60">
                <RotateCcw className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
                Failed to load portfolio works
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
                {error?.message || 'A network error occurred while loading portfolio items.'}
              </p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-2 h-10 px-5 rounded-full border-rose-200/80 dark:border-rose-800/60 text-xs font-medium gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Retry connection</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <GalleryForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingItem}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#FFF0F3] dark:bg-[#160D12] text-foreground min-h-screen p-6 sm:p-8 lg:p-10 transition-colors selection:bg-rose-200 selection:text-rose-950">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Lookbook & Portfolio Curation
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Curate high-resolution studio photography, apex gel architecture, bespoke hand-painted nail art, and public lookbook displays.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] transition-all flex items-center gap-2.5 shrink-0"
          >
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            <span>Upload design</span>
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-black/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <label htmlFor="admin-gallery-search" className="sr-only">
              Search gallery items
            </label>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400 dark:text-rose-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <Input
              id="admin-gallery-search"
              type="search"
              placeholder="Search designs by title, technique, or shade..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-11 h-12 rounded-full border-rose-200/80 dark:border-rose-900/60 bg-white/90 dark:bg-stone-900/90 text-sm"
              aria-label="Search gallery items"
            />
          </div>
          <div>
            <label htmlFor="category-filter" className="sr-only">
              Filter by studio discipline
            </label>
            <Select
              id="category-filter"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              options={categoryOptions}
              placeholder="All studio disciplines"
              aria-label="Filter by studio discipline"
            />
          </div>
        </div>

        {/* Clear Filters Row */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-3 border-t border-rose-100 dark:border-rose-950/60 text-xs text-stone-500 dark:text-stone-400">
            <span>Filtering active portfolio designs</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1.5 h-9 px-4 rounded-full text-stone-700 dark:text-stone-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/50"
            >
              <FilterX className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              <span>Clear filters</span>
            </Button>
          </div>
        )}
      </div>

      {/* Gallery Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="h-4 w-4 text-rose-800 dark:text-rose-300" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-rose-50">
              Curated portfolio works
            </h2>
            {data && (
              <span className="font-mono text-xs text-rose-900 dark:text-rose-200 bg-rose-100/70 dark:bg-rose-950/60 px-3 py-0.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 tabular-nums">
                {totalItems} {totalItems === 1 ? 'curated piece' : 'curated pieces'}
              </span>
            )}
          </div>
        </div>

        <GalleryGrid
          items={paginatedItems}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onAdd={handleCreate}
          emptyMessage="No designs match your search or filter criteria"
        />

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-rose-200/80 dark:border-rose-950/60">
            <div className="text-xs font-mono text-stone-500 dark:text-stone-400 tabular-nums">
              Page {currentPage + 1} of {totalPages}
            </div>
            <nav className="flex items-center gap-2" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                aria-label="Previous page"
                className="h-10 px-4 rounded-full border-rose-200/80 dark:border-rose-800/60 text-xs font-medium"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i;
                if (totalPages > 5) {
                  if (currentPage <= 2) {
                    pageNum = i;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                    aria-label={`Page ${pageNum + 1}`}
                    className={cn(
                      'h-10 w-10 p-0 rounded-full text-xs font-mono tabular-nums',
                      currentPage === pageNum
                        ? 'bg-rose-900 text-white border-rose-800'
                        : 'border-rose-200/80 dark:border-rose-800/60'
                    )}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                aria-label="Next page"
                className="h-10 px-4 rounded-full border-rose-200/80 dark:border-rose-800/60 text-xs font-medium"
              >
                Next
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <GalleryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
