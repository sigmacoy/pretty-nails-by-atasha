'use client';

import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Layers, AlertCircle, Check, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@/hooks/useApi';
import { servicesApi } from '@/lib/api';
import { ServiceDto } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { formatPrice, getVariantLabel, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

const SERVICE_CATEGORIES = [
  { value: 'all', label: 'All treatments' },
  { value: 'GEL', label: 'Structured BIAB & Gel' },
  { value: 'EXTENSION', label: 'Soft Gel Extensions' },
  { value: 'PEDICURE', label: 'Luxe Pedicure' },
  { value: 'ADDON', label: 'Add-Ons & Art' },
] as const;

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'GEL':
      return 'Structured BIAB & Gel';
    case 'EXTENSION':
      return 'Soft Gel Extension';
    case 'PEDICURE':
      return 'Luxe Pedicure';
    case 'ADDON':
      return 'Add-On & Art';
    case 'CLEANING':
      return 'Hygienic Prep & Care';
    default:
      return category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}

// Curated studio treatments fallback (active atelier disciplines)
const defaultServicesFallback: ServiceDto[] = [
  {
    id: 'service-extension',
    name: 'Soft Gel Sculpted Extensions',
    category: 'EXTENSION',
    description: 'Sculpted length with apex architecture and Japanese soft gel. Unrushed structural balance designed for high durability.',
    basePrice: 80000,
    duration: 90,
    isActive: true,
    variants: [
      { id: 'v1', serviceId: 'service-extension', name: 'Short', price: 80000 },
      { id: 'v2', serviceId: 'service-extension', name: 'Medium', price: 95000 },
      { id: 'v3', serviceId: 'service-extension', name: 'Long', price: 110000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-gel',
    name: 'Structured BIAB & Gel Overlay',
    category: 'GEL',
    description: 'Natural plate reinforcement with Russian dry cuticle prep and high-shine Japanese apex finish.',
    basePrice: 50000,
    duration: 60,
    isActive: true,
    variants: [
      { id: 'v4', serviceId: 'service-gel', name: 'Classic Single-Tone', price: 50000 },
      { id: 'v5', serviceId: 'service-gel', name: 'French Accent Hairline', price: 60000 },
      { id: 'v6', serviceId: 'service-gel', name: 'Magnetic Velvet Cat-Eye', price: 65000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-pedicure',
    name: 'Signature Luxe Gel Pedicure',
    category: 'PEDICURE',
    description: 'Callus softening, gentle dry prep, natural foot soak, and high-shine long-wearing gel finish.',
    basePrice: 60000,
    duration: 60,
    isActive: true,
    variants: [
      { id: 'v7', serviceId: 'service-pedicure', name: 'Classic Luxe', price: 60000 },
      { id: 'v8', serviceId: 'service-pedicure', name: 'French Finish', price: 70000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-cleaning',
    name: 'Studio Dry Cuticle Prep & Hygiene Care',
    category: 'GEL',
    description: 'Precision e-file dry manicuring, cuticle refinement, and natural plate conditioning without abrasive soaking.',
    basePrice: 30000,
    duration: 30,
    isActive: true,
    variants: [
      { id: 'v9', serviceId: 'service-cleaning', name: 'Standard Care', price: 30000 },
      { id: 'v10', serviceId: 'service-cleaning', name: 'Deep Restorative Care', price: 45000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-nail-art',
    name: 'Bespoke Hand-Painted Nail Art',
    category: 'ADDON',
    description: 'Custom fine-line artwork, tortoiseshell glass, metallic foil accents, or tailored editorial aesthetics.',
    basePrice: 15000,
    duration: 30,
    isActive: true,
    variants: [
      { id: 'v11', serviceId: 'service-nail-art', name: 'Minimalist Accent (2 nails)', price: 15000 },
      { id: 'v12', serviceId: 'service-nail-art', name: 'Full Set Bespoke Concept', price: 35000 },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'service-removal',
    name: 'Gentle Gel Removal & Plate Conditioning',
    category: 'ADDON',
    description: 'Safe electric-file debulking and gentle wrap soak-off without scraping or damaging natural keratin layers.',
    basePrice: 20000,
    duration: 30,
    isActive: true,
    variants: [],
    createdAt: '',
    updatedAt: '',
  },
];

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'GEL' | 'EXTENSION' | 'PEDICURE' | 'ADDON'>('all');
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const { data: servicesData, isLoading, error } = useQuery(
    () => servicesApi.getActive(),
    { enabled: true }
  );

  const rawServices = servicesData?.data || [];
  const services = rawServices.length > 0 ? rawServices : defaultServicesFallback;
  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter((s: ServiceDto) => {
        if (activeCategory === 'GEL') {
          return s.category === 'GEL' || s.category === 'CLEANING';
        }
        return s.category === activeCategory;
      });

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
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="mb-10 space-y-3">
            <Skeleton className="h-4 w-48 bg-rose-200/50 dark:bg-rose-950/40 rounded-full" />
            <Skeleton className="h-10 w-96 bg-rose-200/50 dark:bg-rose-950/40 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-xl bg-rose-200/40 dark:bg-rose-950/30 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2 mb-10">
            {SERVICE_CATEGORIES.map((cat) => (
              <Skeleton key={cat.value} className="h-10 w-36 bg-rose-200/40 dark:bg-rose-950/30 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-6 space-y-4">
                <Skeleton className="h-4 w-28 bg-rose-100 dark:bg-rose-950/50" />
                <Skeleton className="h-6 w-48 bg-rose-100 dark:bg-rose-950/50" />
                <Skeleton className="h-12 w-full bg-rose-100/60 dark:bg-rose-950/30" />
                <div className="pt-8 flex justify-between items-center">
                  <Skeleton className="h-4 w-20 bg-rose-100 dark:bg-rose-950/50" />
                  <Skeleton className="h-8 w-24 bg-rose-100 dark:bg-rose-950/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && rawServices.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-10 sm:p-12 text-center max-w-md mx-auto shadow-card">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 flex items-center justify-center mx-auto mb-4 border border-rose-200/80 dark:border-rose-900/60">
              <AlertCircle className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-rose-50 mb-2">
              Unable to load services
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-6 font-normal leading-relaxed">
              We could not retrieve live updates from the service catalog. You can reload or continue to booking.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                className="rounded-full px-6 border-rose-300/80 hover:bg-rose-50 dark:border-rose-800"
                onClick={() => window.location.reload()}
              >
                Reload Catalog
              </Button>
              <Link href="/booking">
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-rose-900 hover:bg-rose-950 text-white text-sm font-medium transition-colors"
                >
                  Direct Booking
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="mb-12">
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-3">
            Service Menu · Pretty Nails by Atasha · Cebu City
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-stone-900 dark:text-rose-50 leading-[1.08]">
            Curated Services & Treatment Rates
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed">
            Structured BIAB gel overlays, Japanese apex gel architecture, soft gel extensions, and hospital-grade dry cuticle prep. Every treatment is private, unhurried, and dedicated to natural nail plate preservation.
          </p>
        </div>

        {/* Studio Hygiene Notice Card */}
        <div className="mb-10 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-6 sm:p-7 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 flex items-center justify-center border border-rose-200 dark:border-rose-800 shrink-0 mt-0.5">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50">
                  Hospital-Grade Dry Autoclave Sterilization & Hygiene Protocol
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal max-w-3xl">
                  Pretty Nails by Atasha · Cebu City adheres to hospital-grade dry autoclave sterilization for all metal instruments (nippers, pushers, carbide bits), individual sealed medical indicator pouches unsealed in your presence, and single-use files and buffers. Natural nail plate preservation without abrasive drilling or heat spikes.
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-rose-800 dark:text-rose-300 shrink-0 px-3.5 py-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30">
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Medical pouches verified</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-10" role="tablist" aria-label="Service categories">
          {SERVICE_CATEGORIES.map((category) => (
            <button
              key={category.value}
              role="tab"
              aria-selected={activeCategory === category.value}
              onClick={() => setActiveCategory(category.value as typeof activeCategory)}
              className={cn(
                'inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-all duration-200 select-none border',
                activeCategory === category.value
                  ? 'bg-rose-900 text-white font-medium border-rose-900 shadow-xs'
                  : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200/80 dark:border-rose-950/60 font-normal'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 p-12 text-center max-w-md mx-auto shadow-card my-12">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 flex items-center justify-center mx-auto mb-4 border border-rose-200/80 dark:border-rose-900/60">
              <Layers className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50 mb-1.5">
              No services found
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-normal">
              No treatments are currently available under this specific category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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

        {/* Bottom Reservation Invitation CTA */}
        <div className="mt-16 sm:mt-20 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-gradient-to-br from-white via-rose-50/50 to-pink-50/30 dark:from-stone-900 dark:via-rose-950/20 dark:to-stone-900 p-8 sm:p-12 text-center shadow-card max-w-3xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold block mb-2">
            Private 1-on-1 Atelier Sanctuary
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-stone-900 dark:text-rose-50 tracking-tight">
            Reserve your private atelier session
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal max-w-lg mx-auto leading-relaxed">
            A reservation deposit via GCash or Maya guarantees your exclusive appointment slot. Atasha manually verifies each deposit before confirming your appointment. Rescheduling is available up to 24 hours in advance via your client portal.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/booking" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center h-14 sm:h-16 px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base sm:text-lg tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
              >
                Reserve an Appointment
              </button>
            </Link>
            <Link href="/availability" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-white/95 hover:bg-rose-50 dark:bg-stone-900/90 dark:hover:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-medium text-base sm:text-lg border border-rose-300/80 dark:border-rose-800/80 shadow-xs transition-colors duration-200"
              >
                Check Calendar Dates
              </button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-rose-800/70 dark:text-rose-300/70 font-normal tracking-wide">
            GCash and Maya downpayment review · Dedicated private atelier · Cebu City
          </p>
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
    <Card className="flex flex-col justify-between h-full rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white/90 dark:bg-stone-900/90 shadow-card hover:border-rose-300 dark:hover:border-rose-800 transition-all duration-200">
      <CardContent className="p-6 sm:p-7 flex flex-col h-full justify-between">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 block">
                {getCategoryLabel(service.category)}
              </span>
              <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-rose-50 tracking-tight leading-snug">
                {service.name}
              </h3>
            </div>
            {hasVariants && (
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors duration-150 shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse length tiers' : 'Expand length tiers'}
                title={isExpanded ? 'Collapse length tiers' : 'Expand length tiers'}
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')}
                  strokeWidth={1.5}
                />
              </button>
            )}
          </div>

          {/* Description */}
          {service.description && (
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-normal leading-relaxed line-clamp-3 mb-4">
              {service.description}
            </p>
          )}

          {/* Tiered Pricing / Variant Details */}
          {hasVariants && (
            <div className="mb-4">
              {!isExpanded ? (
                <div className="pt-3 border-t border-rose-100 dark:border-rose-950/60">
                  <button
                    type="button"
                    onClick={onToggle}
                    className="w-full flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 hover:text-rose-950 dark:hover:text-rose-100 py-1 transition-colors duration-150 group text-left"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex items-center gap-1.5 font-normal">
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {service.variants.length} length tiers:
                      </span>{' '}
                      {service.variants.map((v) => getVariantLabel(v.name)).join(' · ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-400 group-hover:underline shrink-0">
                      View rates
                      <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </span>
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-rose-100 dark:border-rose-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                      Length tiers & rates
                    </span>
                    <button
                      type="button"
                      onClick={onToggle}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-400 hover:underline transition-colors duration-150"
                    >
                      Hide
                      <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {service.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50/40 dark:bg-stone-900/50 border border-rose-200/60 dark:border-rose-950/60 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            {getVariantLabel(variant.name)}
                          </span>
                          <span className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
                            · {service.duration} mins
                          </span>
                        </div>
                        <span className="font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums">
                          {formatPrice(variant.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add-on Rate display when category is ADDON and has no variants */}
          {!hasVariants && service.category === 'ADDON' && (
            <div className="mb-4 pt-3 border-t border-rose-100 dark:border-rose-950/60">
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-rose-50/40 dark:bg-stone-900/50 border border-rose-200/60 dark:border-rose-950/60">
                <span className="text-stone-700 dark:text-stone-300 font-medium">Add-on rate</span>
                <span className="font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums">
                  {formatPrice(service.basePrice)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing, Duration & Action Footer */}
        <div>
          <div className="pt-4 border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <Clock className="h-4 w-4 text-rose-500 shrink-0" strokeWidth={1.5} />
              <span className="tabular-nums">{service.duration} mins</span>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                {hasVariants && (
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">from</span>
                )}
                <span className="text-lg sm:text-xl font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums">
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
            className="mt-5 block"
          >
            <button
              type="button"
              className="w-full h-12 sm:h-14 px-6 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-sm tracking-normal shadow-xs transition-colors duration-200 inline-flex items-center justify-center border border-rose-800/80"
            >
              Select Treatment
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
