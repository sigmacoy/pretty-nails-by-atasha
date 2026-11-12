'use client';

import {
  ShieldCheck,
  Heart,
  Clock,
  Award,
  ArrowRight,
  Sparkle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { servicesApi, galleryApi } from '@/lib/api';
import { useQuery } from '@/hooks/useApi';
import { ServiceDto, GalleryDto } from '@/types';
import { formatPrice } from '@/lib/utils';

const features = [
  {
    icon: ShieldCheck,
    title: 'Medical-grade sanitization',
    description: 'Hospital-grade autoclave sterilization with single-use disposable files for every client',
  },
  {
    icon: Heart,
    title: 'Expert nail artistry',
    description: 'Certified technicians specializing in BIAB overlays, soft gel extensions, and custom hand-painted art',
  },
  {
    icon: Clock,
    title: 'Private studio care',
    description: 'A calm, unhurried appointment dedicated solely to your hands in a quiet, hygienic setting',
  },
  {
    icon: Award,
    title: 'Digital stamp rewards',
    description: 'Automated digital loyalty card with rewards on your 5th visit and complimentary gel refills',
  },
];

const steps = [
  {
    number: '01',
    title: 'Choose services',
    description: 'Select your preferred treatments, nail length tier, and custom art add-ons from our menu',
  },
  {
    number: '02',
    title: 'Pick date and time',
    description: 'View real-time salon calendar availability and select an open slot that fits your schedule',
  },
  {
    number: '03',
    title: 'Confirm appointment',
    description: 'Submit your contact information and reservation deposit for immediate booking confirmation',
  },
];

const guarantees = [
  {
    icon: ShieldCheck,
    title: 'Medical-grade sanitization',
    detail: 'Hospital-grade autoclave sterilization and single-use disposable files',
  },
  {
    icon: Sparkle,
    title: 'Custom nail art inspiration',
    detail: 'Bring your reference photo or choose from curated studio palettes',
  },
  {
    icon: Award,
    title: 'Digital stamp rewards',
    detail: 'Automated loyalty tracking with rewards on your 5th and 10th appointments',
  },
  {
    icon: Clock,
    title: 'Flexible scheduling',
    detail: 'Real-time slot reservation with 24-hour advance reschedule requests',
  },
];

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

  return (
    <div className="flex flex-col">
      {/* Hero Section: Asymmetric Editorial Split */}
      <section className="relative overflow-hidden bg-background py-12 lg:py-16 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Editorial Value Proposition & Actions */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Gel extensions now available</span>
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.12]">
                Beautiful nails, <span className="text-primary font-semibold">expertly crafted</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl font-normal leading-relaxed">
                Experience considered nail care at Pretty Nails by Atasha. From structured gel overlays
                to bespoke hand-painted nail art, our studio delivers lasting finishes in a calm, dedicated space.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link href="/booking">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Book appointment
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View services
                  </Button>
                </Link>
              </div>

              {/* Quiet studio guarantees row */}
              <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-3 gap-4 w-full text-left">
                <div>
                  <div className="text-xs text-muted-foreground">Hygiene</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">Autoclave sterile</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Technique</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">BIAB & soft gel</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">Talisay City studio</div>
                </div>
              </div>
            </div>

            {/* Right Column: Appointment Booking Preview Card (Product Moment) */}
            <div className="lg:col-span-5 w-full">
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-muted-foreground">Studio booking preview</span>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Open for booking
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
                    <div className="text-xs text-muted-foreground">Featured service</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">BIAB Gel Overlay</span>
                      <span className="text-sm font-medium text-primary tabular-nums">₱650</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="tabular-nums">90 min</span>
                      </span>
                      <span>·</span>
                      <span>Medium length tier</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5">
                      <div className="text-[11px] text-muted-foreground">Artist</div>
                      <div className="text-xs font-medium text-foreground mt-0.5">Atasha</div>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5">
                      <div className="text-[11px] text-muted-foreground">Reservation</div>
                      <div className="text-xs font-medium text-foreground mt-0.5">GCash / Maya</div>
                    </div>
                  </div>

                  {/* Digital Stamp Loyalty Card Snippet */}
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-foreground">Loyalty rewards</div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">4 of 5 stamps</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"
                        >
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      ))}
                      <div className="flex-1 h-8 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <Sparkle className="h-3 w-3 opacity-40" strokeWidth={1.5} />
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      1 more stamp earns 20% off your next gel refill
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Quick schedule</span>
                  <Link href="/availability" className="text-xs font-medium text-primary hover:underline">
                    Check upcoming calendar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Why choose Pretty Nails
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Thoughtful salon standards focused on hygiene, precision, and client care
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full border border-border bg-card">
                <CardContent className="p-5 flex flex-col items-start">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary mb-3">
                    <feature.icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-12 lg:py-16 bg-muted/30 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Our services
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Handcrafted nail enhancements, structured overlays, and essential nail care
              </p>
            </div>
            <Link href="/services">
              <Button variant="outline" size="sm" className="gap-2">
                View all services
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border border-border bg-card">
                  <CardContent className="p-5">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-5 w-3/4 mb-6" />
                    <div className="pt-3 border-t border-border/60 flex justify-between items-center">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: ServiceDto) => (
                <Link key={service.id} href={`/services#${service.id}`} className="block group">
                  <Card className="h-full border border-border bg-card hover:border-stone-400 dark:hover:border-stone-600 transition-colors duration-150">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            {service.category.toLowerCase()}
                          </span>
                          {service.variants.length > 1 && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {service.variants.length} length tiers
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors duration-150">
                          {service.name}
                        </h3>
                      </div>

                      <div className="mt-5 pt-3 border-t border-border/60 flex items-baseline justify-between">
                        <span className="text-base font-semibold text-foreground tabular-nums">
                          {formatPrice(service.basePrice)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                          <Clock className="h-3 w-3" strokeWidth={1.5} />
                          {service.duration} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Book in three steps
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              A straightforward appointment flow designed for clarity and convenience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-semibold tabular-nums text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      {step.number}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Step {parseInt(step.number, 10)}</span>
                  </div>
                  <h3 className="text-base font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-12 lg:py-16 bg-muted/30 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Recent studio work
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Handcrafted nail art, structured overlays, and custom designs created in studio
              </p>
            </div>
            <Link href="/gallery">
              <Button variant="outline" size="sm" className="gap-2">
                View full gallery
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>

          {galleryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border bg-card">
                  <Skeleton className="h-full w-full" />
                </div>
              ))}
            </div>
          ) : gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {gallery.map((item: GalleryDto) => (
                <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-card">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-opacity duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5">
                    <h4 className="text-xs sm:text-sm font-medium text-white leading-snug">{item.title}</h4>
                    {item.category && (
                      <p className="text-[11px] text-stone-300 capitalize mt-0.5">{item.category.toLowerCase()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No gallery images available yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Quiet Call to Action */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Appointments open</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Ready for your next set?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Reserve your appointment online in minutes, or explore our services menu to find your ideal design and length tier.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/booking">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Book appointment
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </Link>
              <Link href="/availability">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Check availability
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Verifiable Salon Service Guarantees (Replacing Fake Vanity Stats) */}
      <section className="py-12 lg:py-16 border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((item) => (
              <div key={item.title} className="flex flex-col items-start p-4 rounded-xl border border-border/60 bg-card">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-primary mb-2.5">
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground leading-normal">
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
