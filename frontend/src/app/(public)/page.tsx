'use client';

import {
  Clock,
  ArrowRight,
  ArrowUpRight,
  Sparkle,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
} from 'lucide-react';
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
      {/* 1. HERO SECTION: True Editorial Split with Real Studio Imagery            */}
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
                Handcrafted nail art & structured overlays.
              </h1>

              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl font-normal leading-relaxed">
                Pretty Nails by Atasha is a private, appointment-only nail atelier dedicated to
                natural nail reinforcement, BIAB gel overlays, and bespoke hand-painted finishes.
                Every set is tailored to you in an unhurried, hygienic setting.
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

              {/* Editorial Studio Details Bar */}
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

            {/* Right Column: Hero Visual — High-Impact Studio Photography */}
            <div className="lg:col-span-5 w-full">
              <div className="relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden border border-border/80 bg-muted group">
                <img
                  src={heroImage}
                  alt="Pretty Nails by Atasha signature structured gel manicure"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex flex-col justify-end p-6">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] uppercase tracking-[0.16em] text-stone-200 font-medium">
                      Studio Archive · Atasha
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-white tracking-tight leading-snug">
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
      {/* 2. THE ATELIER & ARTIST NOTE: Authentic Human Voice & Philosophy         */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                The Atelier Philosophy
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-medium tracking-tighter text-foreground leading-tight">
                Focus, patience, & natural nail health.
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-6 text-muted-foreground text-base leading-relaxed">
              <p>
                Too many salon experiences feel rushed, noisy, and damaging to natural nails. At
                Pretty Nails by Atasha, every appointment is a dedicated one-on-one session where your
                comfort and nail integrity come first.
              </p>
              <p>
                I specialize in <strong>BIAB (Builder in a Bottle)</strong> and soft gel overlays.
                Instead of harsh electric filing down to the nail plate, treatments emphasize gentle
                cuticle care, precise structural apex building, and non-destructive fills that allow
                your natural nails to grow long and healthy underneath.
              </p>
              <p>
                Every metal implement goes through a hospital-grade autoclave sterilization cycle,
                sealed in individual pouches opened exclusively in front of you. Single-use disposable
                files and buffers are used for every client.
              </p>

              <div className="pt-6 border-t border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-foreground font-medium text-base tracking-tight">Atasha</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Founder & Studio Artist</div>
                </div>
                <div className="text-right">
                  <div className="text-foreground font-medium text-sm tabular-nums">Cebu City</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Private Studio Location</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CURATED SERVICE MENU: Clean Horizontal Hairline Rows                   */}
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
                View all pricing & tiers
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>

          {/* Interactive Hairline Rows */}
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
                      <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
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
      {/* 4. RECENT STUDIO WORK: Visual-First Nail Art Showcase                      */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Studio Archive
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
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TACTILE LOYALTY CARD: Dedicated Physical Paper Artifact Moment          */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Client Loyalty Program
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tighter text-foreground">
              A physical card for your digital visits.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every completed appointment earns automated digital stamps on your phone. Scan in studio
              after each appointment to track progress toward complimentary refills.
            </p>
          </div>

          {/* Physical Cream Cardstock Representation */}
          <div className="max-w-xl mx-auto rounded-2xl border border-border/90 bg-[#FDFBF7] dark:bg-stone-900 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 font-medium">
                  Studio Loyalty Card
                </div>
                <div className="text-base font-medium text-stone-900 dark:text-stone-100 mt-0.5">
                  Pretty Nails by Atasha
                </div>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded">
                Tier 1
              </span>
            </div>

            {/* Stamp Slots */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-3">
                <span>Earn 1 stamp per completed appointment</span>
                <span className="font-mono tabular-nums">10 stamps total</span>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                  const isSampleEarned = slot <= 4;
                  const isMilestone = slot === 5 || slot === 10;

                  return (
                    <div
                      key={slot}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-colors ${
                        isSampleEarned
                          ? 'bg-primary/15 border border-primary/30 text-primary font-medium'
                          : isMilestone
                          ? 'border border-dashed border-primary/40 bg-primary/5 text-primary'
                          : 'border border-dashed border-stone-300 dark:border-stone-700 text-stone-400'
                      }`}
                    >
                      {isSampleEarned ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : (
                        <span className="text-xs font-mono tabular-nums">{slot}</span>
                      )}
                      {slot === 5 && (
                        <span className="text-[9px] uppercase tracking-tighter text-primary font-medium mt-0.5">
                          -20%
                        </span>
                      )}
                      {slot === 10 && (
                        <span className="text-[9px] uppercase tracking-tighter text-primary font-medium mt-0.5">
                          Free
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
                <p>5 stamps: 20% off your refill · 10 stamps: Complimentary gel set</p>
                <Link
                  href="/loyalty"
                  className="font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-1"
                >
                  View your card
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. STUDIO POLICIES: Transparent, Human Booking Standards                  */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Studio Guidelines
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tighter text-foreground">
              What to expect when booking
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60 border-y border-border/60">
            <div className="py-8 md:py-10 md:px-8 first:md:pl-0 last:md:pr-0">
              <div className="flex items-center gap-2 text-foreground font-medium text-base">
                <CreditCard className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span>Reservation Deposit</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                A small reservation fee is submitted via GCash or Maya upon booking. This secures
                your dedicated time slot on the studio calendar and is deducted from your final bill.
              </p>
            </div>

            <div className="py-8 md:py-10 md:px-8 first:md:pl-0 last:md:pr-0">
              <div className="flex items-center gap-2 text-foreground font-medium text-base">
                <CalendarCheck className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span>24-Hour Reschedule</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Life happens. You can request a reschedule up to 24 hours prior to your appointment
                without forfeiting your deposit through your client portal.
              </p>
            </div>

            <div className="py-8 md:py-10 md:px-8 first:md:pl-0 last:md:pr-0">
              <div className="flex items-center gap-2 text-foreground font-medium text-base">
                <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span>Sanitization Standard</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                All metal implements are autoclave-sterilized in sealed pouches opened in front of you.
                Buffers and files are single-use and disposed of after each client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. QUIET CALL TO ACTION: Refined Luxury Studio Banner                     */}
      {/* ========================================================================= */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Reserve Your Appointment
          </span>

          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tighter text-foreground leading-tight">
            Ready for your next studio set?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Select your preferred treatment, view open calendar dates, and confirm in minutes.
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
