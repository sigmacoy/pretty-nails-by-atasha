'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { servicesApi, galleryApi } from '@/lib/api';
import { useQuery } from '@/hooks/useApi';
import { ServiceDto, GalleryDto } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function HomePage() {
  const { data: servicesData, isLoading: servicesLoading } = useQuery(
    () => servicesApi.getActive(),
    { enabled: true }
  );
  const { data: galleryData, isLoading: galleryLoading } = useQuery(
    () => galleryApi.getPublic(),
    { enabled: true }
  );

  // Real studio gallery fallback items with distinct local photography
  const localGalleryFallback: GalleryDto[] = [
    {
      id: 'local-1',
      title: 'Magnetic Velvet Cat-Eye in Bronze Shimmer',
      category: 'CAT-EYE FINISH',
      imageUrl: '/gallery/sample2.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-2',
      title: 'Tortoiseshell Glass & Noir Minimalist',
      category: 'BESPOKE ART',
      imageUrl: '/gallery/sample3.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-3',
      title: 'Burgundy Wave French with Gold Hairline',
      category: 'STRUCTURED BIAB',
      imageUrl: '/gallery/sample4.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-4',
      title: 'Milky Blush Soft Gel with Glass Cushion Top',
      category: 'GEL OVERLAY',
      imageUrl: '/gallery/sample5.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-5',
      title: 'Pastel Buttercup & Metallic Foil Accent',
      category: 'NAIL ART',
      imageUrl: '/gallery/sample6.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-6',
      title: 'Precision Cuticle Prep & Gold Contour Detail',
      category: 'STUDIO CRAFT',
      imageUrl: '/gallery/sample7.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
  ];

  // Dedicated hero visual plate (never duplicated in gallery)
  const heroImage = '/gallery/sample1.jpg';

  // Strict deduplication of lookbook items by imageUrl
  const galleryItems = useMemo(() => {
    const apiItems = galleryData?.data?.filter((item) => item.isActive) || [];
    const seenUrls = new Set<string>();
    
    // Exclude hero image to prevent duplication between hero plate and gallery
    seenUrls.add(heroImage);

    const uniqueItems: GalleryDto[] = [];

    for (const item of [...apiItems, ...localGalleryFallback]) {
      if (!item.imageUrl) continue;
      const normalizedUrl = item.imageUrl.trim();
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        uniqueItems.push(item);
      }
      if (uniqueItems.length === 4) break;
    }

    return uniqueItems;
  }, [galleryData?.data]);

  // Curated studio treatments fallback (active 4 core disciplines)
  const defaultServicesFallback: ServiceDto[] = [
    {
      id: 'service-extension',
      name: 'Soft Gel Extension',
      category: 'EXTENSION',
      description: 'Sculpted length with apex architecture and Japanese soft gel',
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
      description: 'Natural plate reinforcement with Russian dry cuticle prep',
      basePrice: 50000,
      duration: 60,
      isActive: true,
      variants: [
        { id: 'v4', serviceId: 'service-gel', name: 'Classic', price: 50000 },
        { id: 'v5', serviceId: 'service-gel', name: 'French Accent', price: 60000 },
      ],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'service-pedicure',
      name: 'Signature Luxe Gel Pedicure',
      category: 'PEDICURE',
      description: 'Callus softening, gentle dry prep, and high-shine gel finish',
      basePrice: 60000,
      duration: 60,
      isActive: true,
      variants: [
        { id: 'v6', serviceId: 'service-pedicure', name: 'Classic', price: 60000 },
        { id: 'v7', serviceId: 'service-pedicure', name: 'French Finish', price: 70000 },
      ],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'service-cleaning',
      name: 'Studio Dry Cuticle Prep & Hygiene Care',
      category: 'CLEANING',
      description: 'Precision e-file dry manicuring and natural plate conditioning',
      basePrice: 30000,
      duration: 30,
      isActive: true,
      variants: [
        { id: 'v8', serviceId: 'service-cleaning', name: 'Basic', price: 30000 },
        { id: 'v9', serviceId: 'service-cleaning', name: 'Deep Clean', price: 45000 },
      ],
      createdAt: '',
      updatedAt: '',
    },
  ];

  // Curated studio treatments in atelier discipline order
  const displayedServices = useMemo(() => {
    const activeFromApi = servicesData?.data?.filter((s) => s.isActive) || [];
    const source = activeFromApi.length > 0 ? activeFromApi : defaultServicesFallback;
    const categoryOrder: Record<string, number> = {
      EXTENSION: 1,
      GEL: 2,
      BIAB: 2,
      PEDICURE: 3,
      CLEANING: 4,
    };
    return [...source]
      .sort(
        (a, b) =>
          (categoryOrder[a.category?.toUpperCase()] || 99) -
          (categoryOrder[b.category?.toUpperCase()] || 99)
      )
      .slice(0, 4);
  }, [servicesData?.data]);

  return (
    <div className="flex flex-col bg-[#FFF0F3] dark:bg-[#160D12] text-foreground transition-colors selection:bg-rose-200 selection:text-rose-950">
      {/* ========================================================================= */}
      {/* SECTION 1: THE PRIVATE ATELIER HERO                                       */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden border-b border-rose-200/70 dark:border-rose-950/60 pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-[#FFF5F7] via-[#FFF0F3] to-[#FFF0F3] dark:from-[#1A0E15] dark:via-[#160D12] dark:to-[#160D12]">
        {/* Soft Ambient Rose Silk Radiance */}
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-rose-300/30 via-primary-200/15 to-transparent dark:from-rose-950/40 dark:via-transparent blur-3xl pointer-events-none -z-10"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Haute Editorial Typography & Actions */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Integrated Editorial Kicker (No hanging pill, no pulse dot) */}
              <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold">
                Private Atelier · Cebu City
              </span>

              {/* Display Headline with High-Contrast Serif Styling */}
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif tracking-tight text-stone-900 dark:text-rose-50 leading-[1.04]">
                Life is too short to have{' '}
                <span className="italic font-normal text-rose-700 dark:text-rose-300">
                  naked nails
                </span>
                .
              </h1>

              {/* Elevated Narrative Copy */}
              <p className="mt-6 text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-xl font-normal leading-relaxed">
                Pretty Nails by Atasha is a private, appointment-only studio sanctuary dedicated to
                natural nail preservation, Japanese apex gel architecture, and bespoke hand-painted
                finishes. Every treatment is conducted in an unhurried, hygienic setting.
              </p>

              {/* Luxury Tailored Buttons */}
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <Link href="/booking" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 sm:h-16 px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base sm:text-lg tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.28)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.4)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
                  >
                    Reserve an Appointment
                  </button>
                </Link>
                <Link href="/services" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 sm:h-16 px-10 rounded-full bg-white/95 hover:bg-rose-50 dark:bg-stone-900/90 dark:hover:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-medium text-base sm:text-lg border border-rose-300/80 dark:border-rose-800/80 shadow-xs transition-colors duration-200"
                  >
                    Explore Service Catalog
                  </button>
                </Link>
              </div>

            </div>

            {/* Right Column: Clean Editorial Framed Portrait */}
            <div className="lg:col-span-5 w-full">
              <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border border-rose-200/90 dark:border-rose-900/60 shadow-[0_20px_50px_-12px_rgba(244,114,182,0.22)] bg-stone-100 dark:bg-stone-950">
                <img
                  src={heroImage}
                  alt="Pretty Nails by Atasha signature structured BIAB manicure"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02]"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE SERVICE MENU (Clean Haute Atelier Rate Card)               */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-rose-200/70 dark:border-rose-950/60 bg-gradient-to-b from-transparent via-rose-50/30 to-transparent dark:via-rose-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
            <div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold">
                Curated Service Menu
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
                Selected Studio Treatments
              </h2>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-xl font-normal leading-relaxed">
                Structured overlays, Russian dry cuticle prep, and bespoke hand-painted artwork.
                Each tier includes complete hygienic consultation.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-rose-300/80 bg-white/80 dark:bg-stone-900/80 text-rose-950 dark:text-rose-200 text-xs font-medium hover:bg-rose-50 transition-colors shadow-xs"
            >
              View Full Menu & Pricing
            </Link>
          </div>

          {/* Clean Hairline Typographic Table (No chip-cloud tags) */}
          {servicesLoading ? (
            <div className="divide-y divide-rose-200/60 dark:divide-rose-950/60 border-y border-rose-200/70 dark:border-rose-950/70">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-rose-100/60 dark:bg-rose-950/40" />
                    <Skeleton className="h-5 w-56 bg-rose-100/60 dark:bg-rose-950/40" />
                  </div>
                  <div className="flex items-center gap-6">
                    <Skeleton className="h-4 w-16 bg-rose-100/60 dark:bg-rose-950/40" />
                    <Skeleton className="h-6 w-24 bg-rose-100/60 dark:bg-rose-950/40" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-rose-200/60 dark:divide-rose-950/60 border-y border-rose-200/70 dark:border-rose-950/70">
              {displayedServices.map((service: ServiceDto) => (
                <Link
                  key={service.id}
                  href={`/services#${service.id}`}
                  className="group block py-6 px-4 -mx-4 rounded-xl transition-all duration-200 ease-out hover:bg-white/90 dark:hover:bg-rose-950/30 hover:shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                      {/* Quiet Typographic Category Column (No rounded pill chip) */}
                      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-800/80 dark:text-rose-300/80 w-28 shrink-0">
                        {service.category.toLowerCase().replace('_', ' ')}
                      </span>
                      <div>
                        <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-rose-50 group-hover:text-primary transition-colors duration-200">
                          {service.name}
                        </h3>
                        {service.variants && service.variants.length > 1 ? (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                            {service.variants.length} length tiers available · Reinforced apex
                          </p>
                        ) : (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            Standard studio session · Includes prep & cuticle finish
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-100 dark:border-rose-950/60">
                      <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 tabular-nums font-normal">
                        <Clock className="h-3.5 w-3.5 text-rose-500" strokeWidth={1.5} />
                        {service.duration} min
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-lg sm:text-xl font-serif font-semibold text-rose-950 dark:text-rose-200 tabular-nums">
                          {formatPrice(service.basePrice)}
                        </span>
                        <ArrowUpRight
                          className="h-4 w-4 text-rose-400 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200"
                          strokeWidth={1.75}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Editorial Rate Card Notice & Full Menu Link */}
          <div className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left border-t border-rose-100 dark:border-rose-950/60">
            <p className="text-xs text-stone-500 dark:text-stone-400 font-normal max-w-2xl leading-relaxed">
              Base rates include hospital-grade autoclave sterilization, single-use file implements, and thorough Russian dry cuticle refinement.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-900 dark:text-rose-300 hover:text-rose-950 dark:hover:text-rose-200 shrink-0 transition-colors"
            >
              <span>Explore All Tiers & Pricing</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: LOOKBOOK ARCHIVE & MASTERWORK FINISHES                         */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-rose-200/70 dark:border-rose-950/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 text-left">
            <div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold">
                Studio Archive & Lookbook
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
                Recent Studio Finishes
              </h2>
            </div>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-rose-300/80 bg-white/80 dark:bg-stone-900/80 text-rose-950 dark:text-rose-200 text-xs font-medium hover:bg-rose-50 transition-colors shadow-xs"
            >
              View Complete Gallery
            </Link>
          </div>

          {/* Visual Lookbook Grid */}
          {galleryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-2xl overflow-hidden border border-rose-200/80 dark:border-rose-900/60 bg-white dark:bg-stone-900"
                >
                  <Skeleton className="h-full w-full bg-rose-100/60 dark:bg-rose-950/40" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {galleryItems.map((item: GalleryDto) => (
                <div
                  key={item.id}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-rose-200/80 dark:border-rose-900/60 bg-white dark:bg-stone-900 shadow-card hover:shadow-[0_8px_28px_-6px_rgba(244,114,182,0.22)] transition-all duration-300 text-left"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex flex-col justify-end p-4">
                    <span className="text-[10px] text-rose-200 font-semibold uppercase tracking-[0.18em]">
                      {item.category?.toLowerCase() || 'atelier finish'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-serif font-medium text-white leading-snug mt-0.5">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* THE ATELIER PHILOSOPHY & ATASHA'S STATEMENT                               */}
          {/* ========================================================================= */}
          <div className="mt-20 sm:mt-28 pt-16 border-t border-rose-200/70 dark:border-rose-950/70 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left: Founder's Quote Card */}
            <div className="lg:col-span-5 text-left">
              <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white via-rose-50/70 to-pink-50/50 dark:from-stone-900 dark:via-rose-950/30 dark:to-stone-900 border border-rose-200/90 dark:border-rose-900/60 shadow-card">
                <span className="text-[10px] uppercase tracking-[0.25em] text-rose-700 dark:text-rose-400 font-semibold">
                  Atelier Philosophy
                </span>
                <h3 className="mt-4 text-2xl sm:text-3xl font-serif tracking-tight text-stone-900 dark:text-rose-50 leading-tight">
                  Natural nail health, <span className="italic font-normal text-rose-700 dark:text-rose-300">unrushed patience</span>, & precision.
                </h3>
                <blockquote className="mt-6 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal space-y-4">
                  <p>
                    &ldquo;Every appointment at Pretty Nails is a private, one-on-one session where your
                    natural nail bed is nurtured, never degraded. I specialize in BIAB (Builder in a Bottle)
                    and soft gel overlays that reinforce your natural nails without abrasive filing or
                    burning heat spikes.&rdquo;
                  </p>
                  <p>
                    &ldquo;All metal implements undergo hospital-grade dry autoclave sterilization in individual
                    pouches unsealed in your presence, and files are single-use for each client.&rdquo;
                  </p>
                </blockquote>
                <div className="mt-8 pt-5 border-t border-rose-200/70 dark:border-rose-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-stone-900 dark:text-rose-100 font-serif font-medium text-base">
                      Atasha
                    </div>
                    <div className="text-rose-700 dark:text-rose-400 text-xs tracking-wider uppercase font-semibold mt-0.5">
                      Pretty Nails by Atasha · Cebu City
                    </div>
                  </div>
                  <span className="text-2xl font-serif italic text-primary/40">PN</span>
                </div>
              </div>
            </div>

            {/* Right: Studio Standards & Concierge Cards */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900/90 border border-rose-200/80 dark:border-rose-900/50 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/80 text-primary flex items-center justify-center border border-rose-200 dark:border-rose-800">
                    <Check className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50">
                    Hospital-Grade Autoclave Sterilization
                  </h4>
                </div>
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  All cuticle nippers, pushers, and carbide bits undergo ultrasonic cleansing followed
                  by high-temperature medical autoclave cycles. Sealed indicator pouches are inspected
                  and unsealed directly before your treatment begins.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900/90 border border-rose-200/80 dark:border-rose-900/50 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/80 text-primary flex items-center justify-center border border-rose-200 dark:border-rose-800">
                    <Check className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50">
                    Direct Calendar Reservation & Flexible Reschedule
                  </h4>
                </div>
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  A reservation deposit via GCash or Maya guarantees your exclusive appointment slot.
                  Need to change your time? Appointments may be rescheduled up to 24 hours in advance
                  directly from your personal client portal without losing your deposit.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900/90 border border-rose-200/80 dark:border-rose-900/50 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/80 text-primary flex items-center justify-center border border-rose-200 dark:border-rose-800">
                    <Check className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-rose-50">
                    Digital Client Loyalty Card
                  </h4>
                </div>
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  Every completed appointment automatically stamps your digital card. Unlock complimentary
                  apex infills, cuticle oil pens, and bespoke nail art tier rewards.
                </p>
                <div className="mt-4 pt-3 border-t border-rose-100 dark:border-rose-950/80">
                  <Link
                    href="/loyalty"
                    className="inline-flex items-center text-xs font-semibold text-primary hover:text-rose-700 hover:underline transition-colors"
                  >
                    View your digital loyalty card
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: FINAL PRIVATE BOOKING INVITATION                               */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden py-24 lg:py-36 bg-gradient-to-b from-transparent via-[#FFEBF0]/70 to-[#FFF0F3] dark:via-rose-950/25 dark:to-[#160D12]">
        {/* Soft Ambient Rose Background Glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(244,114,182,0.22),transparent)] pointer-events-none"
        />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Understated Editorial Subline (No hanging pill badge) */}
          <span className="text-[11px] uppercase tracking-[0.26em] text-rose-800 dark:text-rose-300 font-semibold mb-3 block">
            Dedicated Appointments · Cebu City
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-stone-900 dark:text-rose-50 leading-[1.08]">
            Reserve your studio appointment
          </h2>

          <p className="mt-5 text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-xl mx-auto leading-relaxed font-normal">
            Step into our calm Cebu atelier. Select your preferred service, choose an available date,
            and enjoy an unhurried, private 1-on-1 experience.
          </p>

          {/* Haute Atelier Button Pair */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/booking" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center h-14 sm:h-16 px-10 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-medium text-base sm:text-lg tracking-normal shadow-[0_6px_24px_rgba(76,5,25,0.3)] hover:shadow-[0_8px_32px_rgba(76,5,25,0.45)] border border-rose-800/80 transition-all duration-300 hover:scale-[1.01]"
              >
                Reserve an Appointment
              </button>
            </Link>
            <Link href="/availability" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-white/95 hover:bg-rose-50 dark:bg-stone-900/90 dark:hover:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-medium text-base sm:text-lg border border-rose-300/80 dark:border-rose-800/80 shadow-xs transition-colors duration-200"
              >
                Check Live Availability
              </button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-rose-800/70 dark:text-rose-300/70 tracking-wide font-normal">
            GCash & Maya reservation deposits · Confirmed by studio upon deposit review · 24-hr advance rescheduling
          </p>
        </div>
      </section>
    </div>
  );
}
