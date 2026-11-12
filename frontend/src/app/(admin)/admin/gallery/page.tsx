'use client';

import { useState, useCallback } from 'react';
import {
  Upload,
  Plus,
  Search,
  FilterX,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { galleryApi } from '@/lib/api';
import { GalleryDto, GalleryRequest, GALLERY_CATEGORIES } from '@/types';
import { useQuery, useMutation } from '@/hooks/useApi';
import { toast } from 'sonner';
import { GalleryGrid, GalleryForm } from '@/components/admin/gallery';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const DEFAULT_PAGE_SIZE = 12;

const categoryOptions: SelectOption[] = [
  { value: '', label: 'All style tags' },
  ...GALLERY_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_/g, ' '),
  })),
];

export default function AdminGalleryPage() {
  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Build API params
  const params = {
    search: search || undefined,
    category: category || undefined,
  };

  // Fetch gallery items
  const { data, isLoading, isError, error, refetch } = useQuery(
    () => galleryApi.getAdmin(params),
    { enabled: true }
  );

  // Handle pagination - API returns array directly
  const galleryItems = (data?.data as GalleryDto[] | undefined) ?? [];
  const totalItems = galleryItems.length;
  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);
  const paginatedItems = galleryItems.slice(
    currentPage * DEFAULT_PAGE_SIZE,
    (currentPage + 1) * DEFAULT_PAGE_SIZE
  );

  // Mutations
  const createMutation = useMutation(
    (formData: GalleryRequest) => galleryApi.create(formData),
    {
      onSuccess: () => {
        toast.success('Gallery design uploaded successfully');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to upload gallery design');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data: updateData }: { id: string; data: GalleryRequest }) =>
      galleryApi.update(id, updateData),
    {
      onSuccess: () => {
        toast.success('Gallery design updated successfully');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to update gallery design');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => galleryApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Gallery design deleted successfully');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to delete gallery design');
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
  const handleView = (item: GalleryDto) => {
    // Handled by GalleryGrid preview modal
  };

  // Open create modal
  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  if (isError) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 text-xs font-normal mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.5} />
              <span>Studio portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
              Nail design gallery
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal">
              Manage, categorize, and upload portfolio designs showcased to studio clients
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 shrink-0">
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            <span>Upload design</span>
          </Button>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-destructive mx-auto flex items-center justify-center">
                <RotateCcw className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-stone-900 dark:text-stone-100">
                Failed to load gallery designs
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal">
                {error?.message || 'A network error occurred while loading portfolio items.'}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2 gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Retry</span>
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
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header (Pass 4 & 5: sentence case, font-medium title, quiet porcelain tokens) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 text-xs font-normal mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.5} />
            <span>Studio portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            Nail design gallery
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal">
            Manage, categorize, and upload portfolio designs showcased to studio clients
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 shrink-0">
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          <span>Upload design</span>
        </Button>
      </div>

      {/* Filters Toolbar (Pass 1 & 2: 4px grid, porcelain surface, warm 8% hairlines) */}
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-4 sm:p-5 shadow-card space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search designs by title or style..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              aria-label="Search gallery items"
            />
          </div>
          <div>
            <Select
              id="category-filter"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              options={categoryOptions}
              placeholder="All style tags"
              aria-label="Filter by style tag"
            />
          </div>
        </div>

        {/* Clear Filters Row */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800/60 text-xs text-stone-500 dark:text-stone-400">
            <span>Filtering active designs</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1.5 h-7 px-2.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              <FilterX className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              <span>Clear filters</span>
            </Button>
          </div>
        )}
      </div>

      {/* Gallery Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="text-sm sm:text-base font-medium text-stone-900 dark:text-stone-100">
              All designs
            </h2>
            {data && (
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-[6px] border border-stone-200/60 dark:border-stone-700/60">
                {totalItems} {totalItems === 1 ? 'design' : 'designs'}
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
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800/60">
            <div className="text-xs text-stone-500 dark:text-stone-400 font-normal">
              Page {currentPage + 1} of {totalPages}
            </div>
            <nav className="flex items-center gap-1.5" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                aria-label="Previous page"
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
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
                    className="h-8 w-8 p-0 text-xs font-normal"
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
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
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
