'use client';

import { useState, useMemo } from 'react';
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

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Real studio gallery fallback items
  const localGalleryFallback: GalleryDto[] = [
    {
      id: 'local-1',
      title: 'Structured BIAB with Micro French Hairline',
      category: 'BIAB OVERLAY',
      imageUrl: '/gallery/sample2.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-2',
      title: 'Rose Quartz Glaze & Dimensional Micro Pearls',
      category: 'NAIL ART',
      imageUrl: '/gallery/sample3.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-3',
      title: 'Champagne Chrome Mirror over Sheer Blush',
      category: 'CHROME FINISH',
      imageUrl: '/gallery/sample4.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'local-4',
      title: 'Botanical Hand-Painted Miniatures on Linen',
      category: 'BESPOKE ART',
      imageUrl: '/gallery/sample5.jpg',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const galleryItems = useMemo(() => {
    const apiItems = galleryData?.data?.filter((item) => item.isActive) || [];
    if (apiItems.length >= 4) {
      return apiItems.slice(0, 4);
    }
    return [...apiItems, ...localGalleryFallback].slice(0, 4);
  }, [galleryData?.data]);

  // Primary hero visual plate
  const heroImage = galleryItems[0]?.imageUrl || '/gallery/sample1.jpg';

  // Categories extracted from real service data
  const categories = useMemo(() => {
    const list = servicesData?.data || [];
    const set = new Set<string>();
    list.forEach((s) => {
      if (s.category) set.add(s.category.toUpperCase());
    });
    return ['ALL', ...Array.from(set)];
  }, [servicesData?.data]);

  // Filtered services for interactive showcase
  const displayedServices = useMemo(() => {
    const all = servicesData?.data || [];
    if (selectedCategory === 'ALL') {
      return all.slice(0, 6);
    }
    return all.filter((s) => s.category?.toUpperCase() === selectedCategory).slice(0, 6);
  }, [servicesData?.data, selectedCategory]);

  // Haute studio finishes and pigment curation
  const studioFinishes = [
    {
      name: 'Rosewater Glaze',
      formula: 'Translucent Petal Sheer',
      description: 'High-refraction glass skin effect with a whisper of natural blush.',
      swatchClass: 'bg-gradient-to-br from-rose-200 via-rose-100 to-pink-50 border-rose-300/80',
      opacityNote: 'Customizable sheer opacity',
    },
    {
      name: 'Ballet Slipper BIAB',
      formula: 'Reinforced Milky Blush',
      description: 'Structural apex architecture reinforcing natural nails for 4+ weeks.',
      swatchClass: 'bg-gradient-to-br from-rose-300 via-pink-200 to-rose-100 border-rose-400/80',
      opacityNote: 'High-strength apex overlay',
    },
    {
      name: 'Champagne Chrome',
      formula: 'Soft Mirror Micro-Pearl',
      description: 'Ultra-fine rose-gold pigment burnished into gel for liquid silk lustre.',
      swatchClass: 'bg-gradient-to-br from-amber-200/90 via-rose-200 to-pink-200 border-amber-300/80',
      opacityNote: 'Mirror-finish burnish',
    },
    {
      name: 'Velvet Noir Rose',
      formula: 'Deep Lacquer Berry',
      description: 'Couture deep cherry-wine pigment sealed under high-gloss cushion topcoat.',
      swatchClass: 'bg-gradient-to-br from-rose-950 via-rose-900 to-primary-950 border-rose-800/80',
      opacityNote: 'Rich opaque pigment',
    },
  ];

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
                Haute nail artistry &{' '}
                <span className="italic font-normal text-rose-700 dark:text-rose-300">
                  structured BIAB
                </span>{' '}
                overlays.
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

              {/* Studio Atelier Standards Strip */}
              <div className="mt-12 pt-8 border-t border-rose-200/70 dark:border-rose-950/70 grid grid-cols-3 gap-6 sm:gap-8 w-full text-left">
                <div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-rose-700 dark:text-rose-400 font-semibold">
                    The Suite
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 mt-1">
                    Private 1-on-1 Studio
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-rose-700 dark:text-rose-400 font-semibold">
                    The Craft
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 mt-1">
                    Structured BIAB Gel
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-rose-700 dark:text-rose-400 font-semibold">
                    Hygiene
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 mt-1">
                    Autoclave Sterile
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Editorial Lookbook Plate (Zero hanging sticker badges) */}
            <div className="lg:col-span-5 w-full">
              <div className="relative p-2.5 sm:p-3 rounded-3xl bg-gradient-to-b from-rose-200/60 via-white to-rose-100/50 dark:from-rose-950/60 dark:via-stone-900 dark:to-stone-950 border border-rose-200/90 dark:border-rose-900/60 shadow-[0_16px_48px_-12px_rgba(244,114,182,0.22)]">
                <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 group">
                  <img
                    src={heroImage}
                    alt="Pretty Nails by Atasha signature structured BIAB manicure"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    loading="eager"
                  />

                  {/* Clean Lookbook Gallery Plate (No floating sticker) */}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent">
                    <div className="p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-left">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-rose-200/90 font-medium">
                        Atelier Archive · Signature Manicure
                      </div>
                      <h2 className="mt-1 text-base sm:text-lg font-serif font-normal text-white tracking-tight leading-snug">
                        Structured BIAB overlay with hand-painted micro art
                      </h2>
                      <div className="mt-2.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-rose-100/90">
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <Clock className="h-3.5 w-3.5 text-rose-300" strokeWidth={1.5} />
                          90 min session
                        </span>
                        <Link
                          href="/booking"
                          className="inline-flex items-center gap-1 text-white font-medium hover:text-rose-200 transition-colors"
                        >
                          Book this style
                          <ArrowUpRight className="h-3.5 w-3.5 stroke-[1.5]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE HAUTE PIGMENT & FINISH ARCHIVE                             */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 border-b border-rose-200/70 dark:border-rose-950/60 bg-white/50 dark:bg-rose-950/15 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 text-left">
            <div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800 dark:text-rose-300 font-semibold">
                Studio Materiality & Palette
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-serif tracking-tight text-stone-900 dark:text-rose-50">
                Signature Finishes & Japanese Gels
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md font-normal leading-relaxed">
              Formulated with Japanese 5-free soft gels and apex builders for 4+ week chip-resistant
              wear without abrasive natural plate filing.
            </p>
          </div>

          {/* Minimalist Cosmetic Compact Swatches (Zero hanging chip stickers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {studioFinishes.map((finish, i) => (
              <div
                key={i}
                className="group relative p-5 rounded-2xl bg-white dark:bg-stone-900/90 border border-rose-200/80 dark:border-rose-900/50 shadow-card hover:shadow-[0_8px_28px_-6px_rgba(244,114,182,0.18)] hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div>
                  {/* Clean Tactile Color Sample (No floating sticker) */}
                  <div
                    className={`h-14 w-full rounded-xl border ${finish.swatchClass} mb-4 transition-transform duration-300 group-hover:scale-[1.01]`}
                  />

                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-rose-100 group-hover:text-primary transition-colors">
                    {finish.name}
                  </h3>
                  <div className="text-xs text-rose-800 dark:text-rose-300 font-medium mt-0.5">
                    {finish.formula}
                  </div>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-normal">
                    {finish.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-rose-100 dark:border-rose-950/80 flex items-center justify-between text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                  <span>{finish.opacityNote}</span>
                  <span className="tabular-nums">Atelier Standard</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: THE SERVICE MENU (Clean Haute Atelier Rate Card)               */}
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

          {/* Interactive Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-[0.12em] uppercase transition-all duration-200 shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-rose-900 text-white shadow-xs font-semibold'
                      : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-300 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-900'
                  }`}
                >
                  {cat === 'ALL' ? 'All Treatments' : cat.toLowerCase().replace('_', ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Clean Hairline Typographic Table (No chip-cloud tags) */}
          {servicesLoading ? (
            <div className="divide-y divide-rose-200/60 dark:divide-rose-950/60 border-y border-rose-200/70 dark:border-rose-950/70">
              {Array.from({ length: 5 }).map((_, i) => (
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
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: LOOKBOOK ARCHIVE & MASTERWORK FINISHES                         */}
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
      {/* SECTION 5: FINAL PRIVATE BOOKING INVITATION                               */}
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
            GCash & Maya reservation deposits · Instant confirmation · 24-hr advance rescheduling
          </p>
        </div>
      </section>
    </div>
  );
}
