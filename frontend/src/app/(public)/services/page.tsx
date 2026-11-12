'use client';

import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Layers, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@/hooks/useApi';
import { servicesApi } from '@/lib/api';
import { ServiceDto } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, getVariantLabel, cn } from '@/lib/utils';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

const SERVICE_CATEGORIES = [
  { value: 'all', label: 'All services' },
  { value: 'GEL', label: 'BIAB gel' },
  { value: 'EXTENSION', label: 'Soft gel extension' },
  { value: 'PEDICURE', label: 'Pedicure' },
  { value: 'ADDON', label: 'Add-on' },
] as const;

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'GEL':
      return 'BIAB gel';
    case 'EXTENSION':
      return 'Soft gel extension';
    case 'PEDICURE':
      return 'Pedicure';
    case 'ADDON':
      return 'Add-on';
    default:
      return category.charAt(0) + category.slice(1).toLowerCase();
  }
}

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'GEL' | 'EXTENSION' | 'PEDICURE' | 'ADDON'>('all');
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const { data: servicesData, isLoading, error } = useQuery(
    () => servicesApi.getActive(),
    { enabled: true }
  );

  const services = servicesData?.data || [];
  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter((s: ServiceDto) => s.category === activeCategory);

  const toggleExpand = (serviceId: string) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="container-padding section-padding max-w-7xl mx-auto">
        <div className="mb-10 space-y-2">
          <Skeleton variant="text" width="220px" className="h-8 mb-2" />
          <Skeleton variant="text" width="420px" className="h-4" />
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {SERVICE_CATEGORIES.map((cat) => (
            <Skeleton key={cat.value} variant="rectangular" width={cat.label.length * 8 + 24} className="h-9 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-padding section-padding max-w-7xl mx-auto">
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-10 sm:p-12 text-center max-w-md mx-auto shadow-card">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center mx-auto mb-4 border border-stone-200/80 dark:border-stone-700/80">
            <AlertCircle className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-medium text-stone-900 dark:text-stone-100 mb-1.5">
            Unable to load services
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-6 font-normal">
            We could not retrieve the service catalog. Please refresh the page or try again shortly.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-padding section-padding max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-xs font-medium tracking-wide text-stone-500 dark:text-stone-400 uppercase">
            Service menu
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Services and treatments
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-2xl font-normal leading-relaxed">
          Structured BIAB gel overlays, soft gel extensions, pedicures, and nail art.
          All services include professional nail preparation and cuticular care.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8" role="tablist" aria-label="Service categories">
        {SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.value}
            role="tab"
            aria-selected={activeCategory === category.value}
            onClick={() => setActiveCategory(category.value as typeof activeCategory)}
            className={cn(
              'inline-flex items-center px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150 select-none',
              activeCategory === category.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-700/70 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200/60 dark:border-stone-700/60'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-12 text-center max-w-md mx-auto shadow-card my-12">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center mx-auto mb-4 border border-stone-200/80 dark:border-stone-700/80">
            <Layers className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-medium text-stone-900 dark:text-stone-100 mb-1.5">
            No services found
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal">
            No services are currently available under this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: ServiceDto) => (
            <ServiceCard
              key={service.id}
              service={service}
              isExpanded={expandedServices.has(service.id)}
              onToggle={() => toggleExpand(service.id)}
            />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-16 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-8 sm:p-10 text-center shadow-card max-w-2xl mx-auto">
        <h2 className="text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 tracking-tight">
          Ready to book your appointment?
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal max-w-md mx-auto">
          Reserve your preferred date and time online. We confirm bookings with real-time slot verification.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/booking">
            <Button size="lg" className="gap-2">
              Book appointment
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ServiceCardProps {
  service: ServiceDto;
  isExpanded: boolean;
  onToggle: () => void;
}

function ServiceCard({ service, isExpanded, onToggle }: ServiceCardProps) {
  const basePrice = service.basePrice;
  const hasVariants = service.variants && service.variants.length > 0;
  const minVariantPrice = hasVariants
    ? Math.min(...service.variants.map((v) => v.price))
    : basePrice;

  return (
    <Card className="flex flex-col justify-between h-full rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card shadow-card hover:border-stone-300 dark:hover:border-stone-700 transition-colors duration-150">
      <CardContent className="p-5 sm:p-6 flex flex-col h-full justify-between">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="space-y-1.5">
              <Badge variant="secondary" className="text-[11px] font-normal text-stone-600 dark:text-stone-400 rounded-sm px-2 py-0.5">
                {getCategoryLabel(service.category)}
              </Badge>
              <h3 className="text-base font-medium text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
                {service.name}
              </h3>
            </div>
            {hasVariants && (
              <button
                type="button"
                onClick={onToggle}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-150 shrink-0"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse length tiers' : 'Expand length tiers'}
                title={isExpanded ? 'Collapse length tiers' : 'Expand length tiers'}
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform duration-150', isExpanded && 'rotate-180')}
                  strokeWidth={1.5}
                />
              </button>
            )}
          </div>

          {/* Description */}
          {service.description && (
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-normal leading-relaxed line-clamp-2 mb-4">
              {service.description}
            </p>
          )}

          {/* Tiered Pricing / Variant Details */}
          {hasVariants && (
            <div className="mb-4">
              {!isExpanded ? (
                <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800/80">
                  <button
                    type="button"
                    onClick={onToggle}
                    className="w-full flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 py-1 transition-colors duration-150 group text-left"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex items-center gap-1.5 font-normal">
                      <span className="font-medium text-stone-800 dark:text-stone-200">
                        {service.variants.length} length tiers:
                      </span>{' '}
                      {service.variants.map((v) => getVariantLabel(v.name)).join(' · ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 shrink-0">
                      View rates
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-150" strokeWidth={1.5} />
                    </span>
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Length tiers & rates
                    </span>
                    <button
                      type="button"
                      onClick={onToggle}
                      className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors duration-150"
                    >
                      Hide
                      <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {service.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/60 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800 dark:text-stone-200">
                            {getVariantLabel(variant.name)}
                          </span>
                          <span className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
                            · {service.duration} mins
                          </span>
                        </div>
                        <span className="font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                          {formatPrice(variant.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add-on Rate List display when category is ADDON and has no variants */}
          {!hasVariants && service.category === 'ADDON' && (
            <div className="mb-4 pt-3 border-t border-stone-200/80 dark:border-stone-800/80">
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/60">
                <span className="text-stone-600 dark:text-stone-400 font-medium">Add-on rate</span>
                <span className="font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                  {formatPrice(service.basePrice)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing, Duration & Action Footer */}
        <div>
          <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <Clock className="h-4 w-4 text-stone-400 dark:text-stone-500 shrink-0" strokeWidth={1.5} />
              <span className="tabular-nums">{service.duration} mins</span>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                {hasVariants && (
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">from</span>
                )}
                <span className="text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                  {formatPrice(hasVariants ? minVariantPrice : basePrice)}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 font-normal">
                {hasVariants ? 'starting rate' : service.category === 'ADDON' ? 'add-on rate' : 'standard rate'}
              </span>
            </div>
          </div>

          <Link
            href={`/booking?service=${service.id}`}
            className="mt-4 block"
          >
            <Button variant="primary" className="w-full text-xs sm:text-sm font-medium" size="md">
              Book service
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
