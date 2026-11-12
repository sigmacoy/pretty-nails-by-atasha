'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, FilterX, Image as ImageIcon, Loader2 } from 'lucide-react';
import { galleryApi } from '@/lib/api';
import { GalleryDto, GalleryRequest, GalleryCategory, GALLERY_CATEGORIES } from '@/types';
import { useQuery, useMutation } from '@/hooks/useApi';
import { toast } from 'sonner';
import { GalleryGrid, GalleryForm } from '@/components/admin/gallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZE = 12;

const categoryOptions: SelectOption[] = [
  { value: '', label: 'All Categories' },
  ...GALLERY_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' '),
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
  const galleryItems = data?.data as GalleryDto[] | undefined ?? [];
  const totalItems = galleryItems.length;
  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);
  const paginatedItems = galleryItems.slice(
    currentPage * DEFAULT_PAGE_SIZE,
    (currentPage + 1) * DEFAULT_PAGE_SIZE
  );

  // Mutations
  const createMutation = useMutation(
    (data: GalleryRequest) => galleryApi.create(data),
    {
      onSuccess: () => {
        toast.success('Gallery item created successfully');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to create gallery item');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: GalleryRequest }) => galleryApi.update(id, data),
    {
      onSuccess: () => {
        toast.success('Gallery item updated successfully');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to update gallery item');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => galleryApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Gallery item deleted successfully');
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to delete gallery item');
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
    if (confirm('Are you sure you want to delete this gallery item? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle view
  const handleView = (item: GalleryDto) => {
    // The GalleryGrid component handles the preview modal internally
    // This is just a placeholder for potential future use
    console.log('View item:', item);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  // Loading skeleton for the grid
  const gridSkeleton = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gallery Management</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage gallery images and categories</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-destructive">
              <p className="font-medium">Failed to load gallery</p>
              <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4">
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gallery Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage gallery images and categories</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  placeholder="Search by title or description..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                  aria-label="Search gallery items"
                />
              </div>
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category
                </label>
                <Select
                  id="category-filter"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  options={categoryOptions}
                  placeholder="All Categories"
                  aria-label="Filter by category"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="gap-2"
                >
                  <FilterX className="h-4 w-4" aria-hidden="true" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            All Gallery Items
            {data && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalItems} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <GalleryGrid
            items={paginatedItems}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            emptyMessage="No gallery items found. Click 'Add Item' to create your first gallery item."
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </div>
              <nav className="flex items-center gap-2" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  aria-label="Previous page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
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
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
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
