'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { servicesApi } from '@/lib/api';
import { ServiceDto, ServiceRequest } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, Column, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  Clock,
  DollarSign,
  Search,
  X,
} from 'lucide-react';
import { ServiceForm } from '@/components/admin/services';

const CATEGORY_NAMES: Record<string, string> = {
  GEL: 'Gel nails',
  EXTENSION: 'Extensions',
  PEDICURE: 'Pedicure',
  ADDON: 'Add-ons',
};

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All services' },
  { id: 'GEL', label: 'Gel nails' },
  { id: 'EXTENSION', label: 'Extensions' },
  { id: 'PEDICURE', label: 'Pedicure' },
  { id: 'ADDON', label: 'Add-ons' },
];

const PAGE_SIZE = 8;

export default function AdminServicesPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: servicesData, isLoading, refetch } = useQuery(
    () => servicesApi.getAll(),
    { enabled: true }
  );

  const services = useMemo(() => servicesData?.data || [], [servicesData]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        selectedCategory === 'ALL' || service.category === selectedCategory;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        term === '' ||
        service.name.toLowerCase().includes(term) ||
        (service.description && service.description.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const paginatedServices = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredServices.slice(start, start + PAGE_SIZE);
  }, [filteredServices, currentPage]);

  // Mutations
  const createMutation = useMutation(
    (data: ServiceRequest) => servicesApi.create(data),
    {
      onSuccess: () => {
        toast.success('Nail treatment service added to studio menu.');
        setModalOpen(false);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Could not add nail service to studio menu.');
      },
      onSettled: () => setIsSubmitting(false),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: ServiceRequest }) => servicesApi.update(id, data),
    {
      onSuccess: () => {
        toast.success('Nail treatment service updated.');
        setModalOpen(false);
        setEditingService(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Could not update nail service entry.');
      },
      onSettled: () => setIsSubmitting(false),
    }
  );

  const deleteMutation = useMutation(
    (id: string) => servicesApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Nail treatment service removed from studio menu.');
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Could not remove nail service from studio menu.');
      },
    }
  );

  const openCreateModal = () => {
    setEditingService(null);
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceDto) => {
    setEditingService(service);
    setModalOpen(true);
  };

  const handleFormSubmit = (data: ServiceRequest) => {
    setIsSubmitting(true);
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: services.length };
    for (const s of services) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [services]);

  const columns: Column<ServiceDto>[] = [
    {
      key: 'name',
      header: 'Service',
      headerClassName: 'w-[28%]',
      render: (row) => (
        <div className="flex flex-col py-0.5">
          <span className="font-medium text-stone-900 dark:text-rose-100 text-sm">
            {row.name}
          </span>
          {row.description && (
            <span className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 max-w-xs mt-0.5 font-normal">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      headerClassName: 'w-[14%]',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
          <Tag className="h-3 w-3 stroke-[1.5]" />
          {CATEGORY_NAMES[row.category] || row.category}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      headerClassName: 'w-[12%]',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
          <Clock className="h-3.5 w-3.5 stroke-[1.5] text-stone-400" />
          <span className="font-mono tabular-nums">{row.duration} mins</span>
        </span>
      ),
    },
    {
      key: 'basePrice',
      header: 'Base price',
      headerClassName: 'w-[14%]',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5 stroke-[1.5] text-stone-400" />
          <span className="font-mono tabular-nums text-sm font-semibold text-stone-900 dark:text-rose-100">
            {formatPrice(row.basePrice)}
          </span>
        </div>
      ),
    },
    {
      key: 'variants',
      header: 'Length tiers',
      headerClassName: 'w-[22%]',
      render: (row) => {
        if (!row.variants || row.variants.length === 0) {
          return <span className="text-xs text-stone-400 font-normal">Base rate only</span>;
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
            {row.variants.map((v) => {
              const tierCode = v.name === 'SMALL' ? 'S' : v.name === 'MEDIUM' ? 'M' : 'L';
              const tierLabel = v.name === 'SMALL' ? 'Small' : v.name === 'MEDIUM' ? 'Medium' : 'Long';
              return (
                <span
                  key={v.id || `${row.id}-${v.name}`}
                  title={`${tierLabel}: ${formatPrice(v.price)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 dark:bg-stone-900/80 border border-rose-200/80 dark:border-rose-900/60 text-[11px] text-stone-700 dark:text-stone-300"
                >
                  <span className="text-rose-800 dark:text-rose-300 font-sans font-medium">{tierCode}:</span>
                  <span className="font-mono tabular-nums font-medium">{formatPrice(v.price)}</span>
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      headerClassName: 'w-[10%]',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'secondary'} className="text-[11px] rounded-full px-2.5 py-0.5">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-8 -m-4 sm:-m-6 lg:-m-8 p-6 sm:p-8 lg:p-10 min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950 transition-colors pb-16">
      {/* Standard Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-rose-200/80 dark:border-rose-950/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
            Treatment & Service Catalog
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Curate structured BIAB overlays, Japanese apex soft gels, luxury pedicure rituals, and length tier rate cards.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm sm:text-base border border-rose-800/80 shadow-[0_4px_20px_rgba(76,5,25,0.25)] transition-all shrink-0 inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4 stroke-[1.5]" />
          Add service
        </Button>
      </div>

      {/* Filter Toolbar: Category Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="tablist" aria-label="Filter by category">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            const count = categoryCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setCurrentPage(0);
                }}
                className={`inline-flex items-center gap-2 h-11 px-5 text-xs font-medium rounded-full transition-colors whitespace-nowrap border ${
                  isActive
                    ? 'bg-rose-900 text-white border-rose-800 shadow-sm'
                    : 'text-stone-700 dark:text-rose-200 bg-white/80 dark:bg-stone-900/80 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums px-2 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <label htmlFor="services-search-input" className="sr-only">
            Search treatments
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5] text-rose-800/70 dark:text-rose-300/70 pointer-events-none" />
          <input
            id="services-search-input"
            type="text"
            aria-label="Search treatments"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search treatments..."
            className="h-11 w-full rounded-full border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 pl-10 pr-9 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-800/30 focus:border-rose-800/40 transition-colors shadow-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setCurrentPage(0);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded-full"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,14,21,0.04)] overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Table
                columns={columns}
                data={[]}
                keyExtractor={(row) => row.id}
                isLoading={true}
              />
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-xl font-serif font-normal text-stone-900 dark:text-rose-50 mb-2">
                No services cataloged
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-5 max-w-sm mx-auto font-sans">
                Create your first salon service to define treatment durations, base prices, and length tier options.
              </p>
              <Button
                onClick={openCreateModal}
                className="h-12 px-6 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-sans font-medium text-xs shadow-sm gap-2"
              >
                <Plus className="h-4 w-4 stroke-[1.5]" />
                Add service
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-xl font-serif font-normal text-stone-900 dark:text-rose-50 mb-2">
                No matching treatments
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-4 max-w-sm mx-auto font-sans">
                No treatments found matching &ldquo;{search}&rdquo; in {CATEGORY_NAMES[selectedCategory] || 'selected category'}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                }}
                className="h-10 px-5 rounded-full text-xs font-sans gap-2"
              >
                Reset search filter
              </Button>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={paginatedServices}
                keyExtractor={(row) => row.id}
                renderRowActions={(row) => (
                  <div className="flex items-center justify-end gap-1.5 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(row)}
                      className="h-9 w-9 text-stone-600 dark:text-stone-300 hover:text-rose-900 dark:hover:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 rounded-full"
                      title="Edit service"
                      aria-label={`Edit ${row.name}`}
                    >
                      <Edit2 className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(row.id)}
                      className="h-9 w-9 text-stone-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full"
                      title="Delete service"
                      aria-label={`Delete ${row.name}`}
                    >
                      <Trash2 className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                  </div>
                )}
              />
              {filteredServices.length > PAGE_SIZE && (
                <div className="px-6 py-4 border-t border-rose-200/70 dark:border-rose-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <div>
                    Showing <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">{currentPage * PAGE_SIZE + 1}</span> to{' '}
                    <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                      {Math.min((currentPage + 1) * PAGE_SIZE, filteredServices.length)}
                    </span>{' '}
                    of <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">{filteredServices.length}</span> services
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Service Create/Edit Modal */}
      <ServiceForm
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingService(null);
        }}
        service={editingService}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
