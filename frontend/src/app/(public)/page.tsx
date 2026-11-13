'use client';

import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
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

  const services = servicesData?.data?.slice(0, 6) || [];
  const gallery = galleryData?.data?.slice(0, 4) || [];

  // Hero showcase image fallback from real gallery assets
  const heroImage = gallery[0]?.imageUrl || '/gallery/sample1.jpg';

  return (
    <div className="flex flex-col bg-background text-foreground">
      {/* ========================================================================= */}
      {/* CHAPTER 1: THE STUDIO HERO & EDITORIAL FEATURE                            */}
      {/* ========================================================================= */}
      <section className="relative border-b border-border/60 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Studio Narrative & Booking Actions */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Boutique Nail Studio · Cebu City
              </span>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-normal sm:font-medium tracking-tighter text-foreground leading-[1.08]">
                Handcrafted nail art & structured gel overlays.
              </h1>

              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl font-normal leading-relaxed">
                Pretty Nails by Atasha is a private, appointment-only atelier dedicated to natural
                nail reinforcement, BIAB gel overlays, and bespoke hand-painted finishes. Every set is
                crafted in an unhurried, hygienic setting.
              </p>

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link href="/booking">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-sm font-medium">
                    Reserve an appointment
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm font-medium">
                    Explore service menu
                  </Button>
                </Link>
              </div>

              {/* Quiet Studio Metadata Strip */}
              <div className="mt-12 pt-8 border-t border-border/60 grid grid-cols-3 gap-6 w-full text-left">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                    Setting
                  </div>
                  <div className="text-sm font-medium text-foreground mt-1">Private 1-on-1</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                    Specialty
                  </div>
                  <div className="text-sm font-medium text-foreground mt-1">Structured BIAB</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                    Access
                  </div>
                  <div className="text-sm font-medium text-foreground mt-1">By reservation</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual — Real Studio Photography */}
            <div className="lg:col-span-5 w-full">
              <div className="relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden border border-border/80 bg-muted group">
                <img
                  src={heroImage}
                  alt="Pretty Nails by Atasha signature structured gel manicure"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-medium">
                    Studio Archive · Atasha
                  </span>
                  <h3 className="mt-1 text-lg font-medium text-white tracking-tight leading-snug">
                    Structured BIAB overlay with hand-painted micro art
                  </h3>
                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-stone-300">
                    <span>90 min session</span>
                    <Link
                      href="/booking"
                      className="inline-flex items-center gap-1 text-white font-medium hover:underline"
                    >
                      Book this style
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CHAPTER 2: THE SERVICE MENU (Clean Horizontal Typographic List)           */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Service Catalog
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tighter text-foreground">
                Selected studio treatments
              </h2>
            </div>
            <Link href="/services">
              <Button variant="outline" size="sm" className="gap-2 text-xs font-medium">
                Full service pricing & tiers
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>

          {/* Clean Hairline Typographic Rows */}
          {servicesLoading ? (
            <div className="divide-y divide-border/60 border-y border-border/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-5 sm:py-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <div className="flex items-center gap-6">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/60 border-y border-border/60">
              {services.map((service: ServiceDto) => (
                <Link
                  key={service.id}
                  href={`/services#${service.id}`}
                  className="group block py-5 sm:py-6 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-lg transition-colors duration-200 ease-out hover:bg-background/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground w-28 shrink-0">
                        {service.category.toLowerCase()}
                      </span>
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                          {service.name}
                        </h3>
                        {service.variants.length > 1 && (
                          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            {service.variants.length} length tiers available
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {service.duration} min
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-base sm:text-lg font-semibold text-foreground tabular-nums">
                          {formatPrice(service.basePrice)}
                        </span>
                        <ArrowUpRight
                          className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                          strokeWidth={1.5}
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
      {/* CHAPTER 3: LOOKBOOK ARCHIVE, ATELIER PRACTICE & VISITING                   */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Part A: Visual Lookbook Archive */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Lookbook Archive
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tighter text-foreground">
                Recent studio finishes
              </h2>
            </div>
            <Link href="/gallery">
              <Button variant="outline" size="sm" className="gap-2 text-xs font-medium">
                View complete gallery
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>

          {galleryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-xl overflow-hidden border border-border/60 bg-card"
                >
                  <Skeleton className="h-full w-full" />
                </div>
              ))}
            </div>
          ) : gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {gallery.map((item: GalleryDto) => (
                <div
                  key={item.id}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border/60 bg-card"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out flex flex-col justify-end p-4">
                    <h4 className="text-xs sm:text-sm font-medium text-white leading-snug">
                      {item.title}
                    </h4>
                    {item.category && (
                      <p className="text-[11px] text-stone-300 uppercase tracking-wider mt-1">
                        {item.category.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {['/gallery/sample1.jpg', '/gallery/sample2.jpg', '/gallery/sample3.jpg', '/gallery/sample4.jpg'].map(
                (src, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border/60 bg-card"
                  >
                    <img
                      src={src}
                      alt="Nail art finish"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                )
              )}
            </div>
          )}

          {/* Part B: The Atelier Practice & Human Studio Voice */}
          <div className="mt-20 sm:mt-24 pt-16 border-t border-border/60 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                The Atelier Practice
              </span>
              <h3 className="mt-3 text-2xl sm:text-3xl font-medium tracking-tighter text-foreground leading-tight">
                Natural nail health, patience, & precision.
              </h3>
              <div className="mt-6 text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed">
                <p>
                  Every appointment at Pretty Nails is a private, one-on-one session where your
                  natural nail health comes first. I specialize in BIAB (Builder in a Bottle) and
                  soft gel overlays that reinforce your nails without abrasive filing.
                </p>
                <p>
                  All metal implements undergo hospital-grade autoclave sterilization in individual
                  pouches, and files are single-use for each client.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40">
                <span className="text-foreground font-medium text-sm">Atasha</span>
                <span className="text-muted-foreground text-xs ml-2">Studio Artist & Founder</span>
              </div>
            </div>

            {/* Part C: Visiting Guidelines (Typography-First, Zero Icons) */}
            <div className="lg:col-span-7 space-y-8 divide-y divide-border/60">
              <div className="pt-0">
                <h4 className="text-base font-medium text-foreground tracking-tight">
                  Reservation Deposit
                </h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  A small reservation deposit via GCash or Maya secures your dedicated time slot on
                  the calendar. This amount is automatically credited toward your final bill upon
                  checkout.
                </p>
              </div>

              <div className="pt-6">
                <h4 className="text-base font-medium text-foreground tracking-tight">
                  24-Hour Reschedule
                </h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Appointments can be rescheduled up to 24 hours in advance directly through your
                  client portal without forfeiting your reservation deposit.
                </p>
              </div>

              <div className="pt-6">
                <h4 className="text-base font-medium text-foreground tracking-tight">
                  Studio Loyalty Card
                </h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Every completed appointment automatically accrues digital stamps toward
                  complimentary refills and tier rewards.
                </p>
                <div className="mt-3">
                  <Link
                    href="/loyalty"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    View your digital loyalty card
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL QUIET BOOKING INVITATION                                             */}
      {/* ========================================================================= */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Appointments
          </span>

          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tighter text-foreground leading-tight">
            Reserve your studio appointment
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Select your service, choose an open date, and enjoy a quiet, considered appointment.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/booking">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-sm font-medium">
                Book appointment
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </Link>
            <Link href="/availability">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm font-medium">
                Check calendar availability
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
