'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceSchema, type ServiceInput } from '@/lib/validations';
import { ServiceDto, ServiceRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { formatPrice } from '@/lib/utils';
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react';

export const CATEGORIES: SelectOption[] = [
  { value: 'GEL', label: 'Gel nails' },
  { value: 'EXTENSION', label: 'Extensions' },
  { value: 'PEDICURE', label: 'Pedicure' },
  { value: 'ADDON', label: 'Add-ons' },
];

export const VARIANT_OPTIONS: SelectOption[] = [
  { value: 'SMALL', label: 'Small / Short' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LONG', label: 'Long' },
];

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
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 stroke-[1.5] text-rose-800 dark:text-rose-300" />
              <div>
                <h3 className="text-xs font-serif font-semibold text-rose-950 dark:text-rose-100 uppercase tracking-wide">
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
              className="gap-1.5 h-9 px-4 text-xs rounded-full border-rose-300/80 dark:border-rose-800/80 text-rose-900 dark:text-rose-200"
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
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-rose-200/60 dark:border-rose-800/60"
                >
                  <div className="w-full sm:w-44 shrink-0">
                    <Select
                      aria-label={`Tier variant length for tier ${index + 1}`}
                      options={VARIANT_OPTIONS}
                      {...register(`variants.${index}.name` as const)}
                      error={errors.variants?.[index]?.name?.message}
                      className="h-9 text-xs py-1"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Input
                      aria-label={`Tier rate in centavos for tier ${index + 1}`}
                      type="number"
                      step={100}
                      min={0}
                      placeholder="Price (centavos)"
                      {...register(`variants.${index}.price` as const, { valueAsNumber: true })}
                      error={errors.variants?.[index]?.price?.message}
                      className="h-9 text-xs py-1 font-mono tabular-nums"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-xs font-mono tabular-nums text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/60 min-w-[70px] justify-center">
                      {formatPrice(currentPrice)}
                    </span>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full shrink-0"
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
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-rose-200/70 dark:border-rose-950/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full px-5 h-11 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="rounded-full px-7 h-11 bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium shadow-sm"
          >
            {service ? 'Save changes' : 'Add service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
