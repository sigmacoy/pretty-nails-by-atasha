'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { servicesApi } from '@/lib/api';
import { ServiceDto, ServiceRequest } from '@/types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceSchema, type ServiceInput } from '@/lib/validations';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
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
  SlidersHorizontal,
} from 'lucide-react';

const CATEGORY_NAMES: Record<string, string> = {
  GEL: 'Gel nails',
  EXTENSION: 'Extensions',
  PEDICURE: 'Pedicure',
  ADDON: 'Add-ons',
};

const CATEGORIES: SelectOption[] = [
  { value: 'GEL', label: 'Gel nails' },
  { value: 'EXTENSION', label: 'Extensions' },
  { value: 'PEDICURE', label: 'Pedicure' },
  { value: 'ADDON', label: 'Add-ons' },
];

const VARIANT_OPTIONS: SelectOption[] = [
  { value: 'SMALL', label: 'Small / Short' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LONG', label: 'Long' },
];

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All services' },
  { id: 'GEL', label: 'Gel nails' },
  { id: 'EXTENSION', label: 'Extensions' },
  { id: 'PEDICURE', label: 'Pedicure' },
  { id: 'ADDON', label: 'Add-ons' },
];

const PAGE_SIZE = 8;

export interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceDto | null;
  onSubmit: (data: ServiceRequest) => void;
  isSubmitting: boolean;
}

export function ServiceForm({
  isOpen,
  onClose,
  service,
  onSubmit,
  isSubmitting,
}: ServiceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      category: 'GEL',
      description: '',
      basePrice: 50000,
      duration: 60,
      variants: [
        { name: 'SMALL', price: 50000 },
        { name: 'MEDIUM', price: 65000 },
        { name: 'LONG', price: 80000 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const watchBasePrice = watch('basePrice') || 0;
  const watchDuration = watch('duration') || 0;
  const watchVariants = watch('variants') || [];

  useEffect(() => {
    if (isOpen) {
      if (service) {
        const initialVariants =
          service.variants && service.variants.length > 0
            ? service.variants.map((v) => ({
                name: (['SMALL', 'MEDIUM', 'LONG'].includes(v.name)
                  ? v.name
                  : 'SMALL') as 'SMALL' | 'MEDIUM' | 'LONG',
                price: Number(v.price) || 0,
              }))
            : [{ name: 'SMALL' as const, price: Number(service.basePrice) || 0 }];

        reset({
          name: service.name || '',
          category: (['GEL', 'EXTENSION', 'PEDICURE', 'ADDON'].includes(service.category)
            ? service.category
            : 'GEL') as 'GEL' | 'EXTENSION' | 'PEDICURE' | 'ADDON',
          description: service.description || '',
          basePrice: Number(service.basePrice) || 0,
          duration: Number(service.duration) || 60,
          variants: initialVariants,
        });
      } else {
        reset({
          name: '',
          category: 'GEL',
          description: '',
          basePrice: 50000,
          duration: 60,
          variants: [
            { name: 'SMALL', price: 50000 },
            { name: 'MEDIUM', price: 65000 },
            { name: 'LONG', price: 80000 },
          ],
        });
      }
    }
  }, [isOpen, service, reset]);

  const onFormSubmit = (data: ServiceInput) => {
    const requestData: ServiceRequest = {
      name: data.name.trim(),
      category: data.category,
      description: data.description?.trim() || undefined,
      basePrice: Number(data.basePrice),
      duration: Number(data.duration),
      variants: data.variants.map((v) => ({
        name: v.name,
        price: Number(v.price),
      })),
    };
    onSubmit(requestData);
  };

  const addVariantTier = () => {
    const existingNames = watchVariants.map((v) => v.name);
    let nextName: 'SMALL' | 'MEDIUM' | 'LONG' = 'MEDIUM';
    if (!existingNames.includes('SMALL')) nextName = 'SMALL';
    else if (!existingNames.includes('MEDIUM')) nextName = 'MEDIUM';
    else if (!existingNames.includes('LONG')) nextName = 'LONG';

    append({
      name: nextName,
      price: watchBasePrice || 50000,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? 'Edit service' : 'Add service'}
      description={
        service
          ? 'Update service catalog details, base rate, and length tier pricing'
          : 'Configure a new salon service with base rate and length tier pricing'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <Input
            label="Service name"
            placeholder="e.g. Russian Gel Manicure"
            {...register('name')}
            error={errors.name?.message}
            required
          />

          <Select
            label="Category"
            options={CATEGORIES}
            {...register('category')}
            error={errors.category?.message}
          />

          <Textarea
            label="Description (optional)"
            placeholder="Describe the service steps, finish, and recommended maintenance..."
            rows={2}
            className="min-h-[72px]"
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* Pricing & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Base price (centavos)"
              type="number"
              step={100}
              min={0}
              placeholder="50000"
              {...register('basePrice', { valueAsNumber: true })}
              error={errors.basePrice?.message}
              helperText={`Equivalent: ${formatPrice(watchBasePrice)}`}
              required
            />
          </div>

          <div>
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              step={5}
              placeholder="60"
              {...register('duration', { valueAsNumber: true })}
              error={errors.duration?.message}
              helperText={`${watchDuration} mins (${(watchDuration / 60).toFixed(1)} hrs)`}
              required
            />
          </div>
        </div>

        {/* Length Tiers & Variant Rates Configuration */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 stroke-[1.5] text-stone-500 dark:text-stone-400" />
              <div>
                <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                  Length tiers
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Tier rates for nail lengths (Small, Medium, Long)
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariantTier}
              className="gap-1.5 h-7 px-2.5 text-xs rounded-md"
              disabled={fields.length >= 3}
            >
              <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
              Add tier
            </Button>
          </div>

          {errors.variants?.message && (
            <p className="text-xs text-destructive font-normal" role="alert">
              {errors.variants.message}
            </p>
          )}

          <div className="space-y-2.5 pt-1">
            {fields.map((field, index) => {
              const currentPrice = watchVariants[index]?.price || 0;
              return (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-card border border-stone-200/60 dark:border-stone-800/60"
                >
                  <div className="w-full sm:w-44 shrink-0">
                    <Select
                      options={VARIANT_OPTIONS}
                      {...register(`variants.${index}.name` as const)}
                      error={errors.variants?.[index]?.name?.message}
                      className="h-8 text-xs py-1"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Input
                      type="number"
                      step={100}
                      min={0}
                      placeholder="Price (centavos)"
                      {...register(`variants.${index}.price` as const, { valueAsNumber: true })}
                      error={errors.variants?.[index]?.price?.message}
                      className="h-8 text-xs py-1 font-mono tabular-nums"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-sm bg-stone-100 dark:bg-stone-800 text-[11px] font-mono tabular-nums text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 min-w-[70px] justify-center">
                      {formatPrice(currentPrice)}
                    </span>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md shrink-0"
                        title="Remove tier"
                        aria-label={`Remove tier ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 stroke-[1.5]" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="rounded-md shadow-sm"
          >
            {service ? 'Save changes' : 'Add service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

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
        toast.success('Service created');
        setModalOpen(false);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to create service');
      },
      onSettled: () => setIsSubmitting(false),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: ServiceRequest }) => servicesApi.update(id, data),
    {
      onSuccess: () => {
        toast.success('Service updated');
        setModalOpen(false);
        setEditingService(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update service');
      },
      onSettled: () => setIsSubmitting(false),
    }
  );

  const deleteMutation = useMutation(
    (id: string) => servicesApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Service deleted');
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to delete service');
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
          <span className="font-medium text-stone-900 dark:text-stone-100 text-sm">
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80">
          <Tag className="h-3 w-3 stroke-[1.5] text-stone-400" />
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
          <span className="font-mono tabular-nums text-sm font-medium text-stone-900 dark:text-stone-100">
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
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-stone-100 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300"
                >
                  <span className="text-stone-400 dark:text-stone-500 font-sans font-medium">{tierCode}:</span>
                  <span className="font-mono tabular-nums">{formatPrice(v.price)}</span>
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
        <Badge variant={row.isActive ? 'success' : 'secondary'} className="text-[11px] rounded-sm">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Service catalog
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-normal">
            Manage salon services, base pricing, and length tiers
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shrink-0 shadow-sm">
          <Plus className="h-4 w-4 stroke-[1.5]" />
          Add service
        </Button>
      </div>

      {/* Filter Toolbar: Category Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-850'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-sm ${
                    isActive
                      ? 'bg-stone-800 text-stone-200 dark:bg-stone-200 dark:text-stone-800'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5] text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search services..."
            className="h-9 w-full rounded-md border border-stone-200/80 dark:border-stone-800 bg-background dark:bg-stone-900/60 pl-9 pr-8 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-primary focus-visible:border-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setCurrentPage(0);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded-sm"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-stone-200/80 dark:border-stone-800/80 shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Table
                columns={columns}
                data={[]}
                keyExtractor={(row) => row.id}
                isLoading={true}
              />
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <Tag className="h-5 w-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-medium text-stone-900 dark:text-stone-100 mb-1">
                No services cataloged
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-4 max-w-sm mx-auto font-normal">
                Create your first salon service to define treatment durations, base prices, and length tier options.
              </p>
              <Button onClick={openCreateModal} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4 stroke-[1.5]" />
                Add service
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <Search className="h-5 w-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-medium text-stone-900 dark:text-stone-100 mb-1">
                No matching services
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-4 max-w-sm mx-auto font-normal">
                No services found matching &ldquo;{search}&rdquo; in {CATEGORY_NAMES[selectedCategory] || 'selected filter'}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                }}
                className="gap-2 text-xs"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={paginatedServices}
                keyExtractor={(row) => row.id}
                renderRowActions={(row) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(row)}
                      className="h-8 w-8 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-md"
                      title="Edit service"
                      aria-label={`Edit ${row.name}`}
                    >
                      <Edit2 className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(row.id)}
                      className="h-8 w-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md"
                      title="Delete service"
                      aria-label={`Delete ${row.name}`}
                    >
                      <Trash2 className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                  </div>
                )}
              />
              {filteredServices.length > PAGE_SIZE && (
                <div className="px-4 py-3 border-t border-stone-200/60 dark:border-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <div>
                    Showing <span className="font-mono tabular-nums font-medium text-stone-700 dark:text-stone-300">{currentPage * PAGE_SIZE + 1}</span> to{' '}
                    <span className="font-mono tabular-nums font-medium text-stone-700 dark:text-stone-300">
                      {Math.min((currentPage + 1) * PAGE_SIZE, filteredServices.length)}
                    </span>{' '}
                    of <span className="font-mono tabular-nums font-medium text-stone-700 dark:text-stone-300">{filteredServices.length}</span> services
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
