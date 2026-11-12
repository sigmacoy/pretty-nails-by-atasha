'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { servicesApi } from '@/lib/api';
import { ServiceDto, ServiceRequest, ServiceVariantDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, getCategoryColor, getVariantLabel } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceSchema, type ServiceInput } from '@/lib/validations';

const CATEGORIES: SelectOption[] = [
  { value: 'GEL', label: 'Gel Nails' },
  { value: 'EXTENSION', label: 'Extensions' },
  { value: 'PEDICURE', label: 'Pedicure' },
  { value: 'ADDON', label: 'Add-ons' },
];

const VARIANT_OPTIONS: SelectOption[] = [
  { value: 'SMALL', label: 'Small/Short' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LONG', label: 'Long' },
];

export default function AdminServicesPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: servicesData, isLoading, refetch } = useQuery(
    () => servicesApi.getAll(),
    { enabled: true }
  );

  const services = servicesData?.data || [];

  const serviceForm = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      category: 'GEL',
      description: '',
      basePrice: 0,
      duration: 60,
      variants: [{ name: 'SMALL', price: 0 }],
    },
  });

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
    serviceForm.reset({
      name: '',
      category: 'GEL',
      description: '',
      basePrice: 0,
      duration: 60,
      variants: [{ name: 'SMALL', price: 0 }],
    });
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceDto) => {
    setEditingService(service);
    serviceForm.reset({
      name: service.name,
      category: service.category as 'GEL' | 'EXTENSION' | 'PEDICURE' | 'ADDON',
      description: service.description || '',
      basePrice: service.basePrice,
      duration: service.duration,
      variants: service.variants.map(v => ({
        name: v.name as 'SMALL' | 'MEDIUM' | 'LONG',
        price: v.price
      })),
    });
    setModalOpen(true);
  };

  const handleSubmit = (data: ServiceInput) => {
    const requestData: ServiceRequest = {
      name: data.name,
      category: data.category,
      description: data.description,
      basePrice: data.basePrice,
      duration: data.duration,
      variants: data.variants,
    };

    setIsSubmitting(true);
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: requestData });
    } else {
      createMutation.mutate(requestData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const addVariant = () => {
    const current = serviceForm.getValues('variants');
    serviceForm.setValue('variants', [...current, { name: 'SMALL', price: 0 }]);
  };

  const removeVariant = (index: number) => {
    const current = serviceForm.getValues('variants');
    if (current.length <= 1) return;
    serviceForm.setValue('variants', current.filter((_, i) => i !== index));
  };

  const columns = [
    { key: 'name', header: 'Service' },
    { key: 'category', header: 'Category', render: (row: ServiceDto) => (
      <Badge variant="outline" className={getCategoryColor(row.category)}>{row.category}</Badge>
    )},
    { key: 'basePrice', header: 'Base Price', render: (row: ServiceDto) => formatPrice(row.basePrice) },
    { key: 'duration', header: 'Duration', render: (row: ServiceDto) => `${row.duration} min` },
    { key: 'variants', header: 'Variants', render: (row: ServiceDto) => (
      <span className="text-sm text-gray-500">{row.variants.length} variant{row.variants.length !== 1 ? 's' : ''}</span>
    )},
    { key: 'isActive', header: 'Status', render: (row: ServiceDto) => (
      <Badge variant={row.isActive ? 'success' : 'secondary'}>
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
  ];

  return (
    <div className="container-padding section-padding">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Service Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage services and variants</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      <Card>
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No services yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first service to get started.</p>
              <Button onClick={openCreateModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={services}
                keyExtractor={(row) => row.id}
                renderRowActions={(row) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              />
              <div className="px-4 py-3 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={1}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingService(null); }}
        title={editingService ? 'Edit Service' : 'Create Service'}
        size="lg"
      >
        <form onSubmit={serviceForm.handleSubmit(handleSubmit)} className="space-y-4">
          <Input
            label="Service Name"
            placeholder="Gel Manicure"
            {...serviceForm.register('name')}
            error={serviceForm.formState.errors.name?.message}
          />

          <Select
            label="Category"
            options={CATEGORIES}
            {...serviceForm.register('category')}
            error={serviceForm.formState.errors.category?.message}
          />

          <Input
            label="Description (Optional)"
            placeholder="Service description..."
            {...serviceForm.register('description')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Price (Centavos)"
              type="number"
              placeholder="50000"
              {...serviceForm.register('basePrice', { valueAsNumber: true })}
              error={serviceForm.formState.errors.basePrice?.message}
              required
            />
            <Input
              label="Duration (Minutes)"
              type="number"
              placeholder="60"
              {...serviceForm.register('duration', { valueAsNumber: true })}
              error={serviceForm.formState.errors.duration?.message}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Variants</h4>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1">
                <Plus className="h-3 w-3" />
                Add Variant
              </Button>
            </div>

            {serviceForm.getValues('variants').map((variant, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  label={`Variant ${index + 1}`}
                  options={VARIANT_OPTIONS}
                  {...serviceForm.register(`variants.${index}.name`)}
                  className="flex-1"
                />
                <Input
                  label="Price (Centavos)"
                  type="number"
                  placeholder="50000"
                  {...serviceForm.register(`variants.${index}.price`, { valueAsNumber: true })}
                  className="flex-1"
                />
                {serviceForm.getValues('variants').length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingService(null); }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingService ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}