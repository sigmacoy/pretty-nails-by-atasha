'use client';

import { useState } from 'react';
import { ShoppingBag, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@/hooks/useApi';
import { servicesApi } from '@/lib/api';
import { ServiceDto } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, getCategoryColor, getVariantLabel } from '@/lib/utils';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

const SERVICE_CATEGORIES = [
  { value: 'all', label: 'All Services' },
  { value: 'GEL', label: 'Gel Nails' },
  { value: 'EXTENSION', label: 'Extensions' },
  { value: 'PEDICURE', label: 'Pedicure' },
  { value: 'ADDON', label: 'Add-ons' },
] as const;

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
    setExpandedServices(prev => {
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
      <div className="container-padding section-padding">
        <div className="mb-8">
          <Skeleton variant="text" width="30%" className="mb-2" />
          <Skeleton variant="text" width="50%" />
        </div>
        <div className="flex gap-4 mb-8">
          {SERVICE_CATEGORIES.map((cat) => (
            <Skeleton key={cat.value} variant="text" width={cat.label.length * 8 + 20} className="h-10" />
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
      <div className="container-padding section-padding text-center py-16">
        <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Services
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Please try again later or contact support.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container-padding section-padding">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Our Services
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Discover our range of professional nail services. From classic gel manicures to
          stunning nail extensions and relaxing pedicures.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Service categories">
        {SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.value}
            role="tab"
            aria-selected={activeCategory === category.value}
            onClick={() => setActiveCategory(category.value as typeof activeCategory)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === category.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Services Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            No services available in this category at the moment.
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

      {/* CTA */}
      <div className="mt-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ready to book your appointment?
        </p>
        <Link href="/booking">
          <Button size="lg" className="gap-2">
            Book Now
            <Sparkles className="h-4 w-4" />
          </Button>
        </Link>
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
  const minVariantPrice = service.variants.length > 0
    ? Math.min(...service.variants.map(v => v.price))
    : basePrice;

  return (
    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${getCategoryColor(service.category)}`}>
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {service.name}
              </h3>
              <Badge variant="outline" className={getCategoryColor(service.category)}>
                {service.category}
              </Badge>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {service.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Variants */}
        {service.variants.length > 0 && (
          <div className={`space-y-3 transition-all duration-300 ${isExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Available Variants
              </h4>
              <div className="space-y-2">
                {service.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getVariantLabel(variant.name)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {service.duration} min
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(variant.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pricing & Duration */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              {service.duration} min
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(minVariantPrice || basePrice)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400"> starting</span>
          </div>
        </div>

        {/* Book Button */}
        <Link
          href={`/booking?service=${service.id}`}
          className="mt-4 block"
        >
          <Button className="w-full" size="lg">
            Book This Service
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}