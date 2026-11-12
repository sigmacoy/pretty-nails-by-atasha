'use client';

import { ShoppingBag, Heart, Sparkles, Truck, Star, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { servicesApi, galleryApi } from '@/lib/api';
import { useQuery } from '@/hooks/useApi';
import { ServiceDto, GalleryDto } from '@/types';
import { formatPrice } from '@/lib/utils';

const features = [
  { icon: Sparkles, title: 'Premium Quality', description: 'Using only the best products for lasting results' },
  { icon: Heart, title: 'Expert Technicians', description: 'Certified nail artists with years of experience' },
  { icon: Truck, title: 'Relaxing Atmosphere', description: 'Enjoy a peaceful environment during your visit' },
  { icon: Star, title: 'Loyalty Rewards', description: 'Earn stamps and get free services' },
];

const steps = [
  { number: '01', title: 'Choose Services', description: 'Browse our services and select your favorites' },
  { number: '02', title: 'Pick Date & Time', description: 'Select an available slot that works for you' },
  { number: '03', title: 'Confirm & Relax', description: 'Book and we\'ll take care of the rest' },
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              New: Gel Extensions now available!
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl">
              Beautiful Nails, <span className="text-primary">Expertly Crafted</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience premium nail care at Pretty Nails by Atasha. From classic gel manicures
              to stunning nail art, our expert technicians deliver beautiful, long-lasting results.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/booking">
                <Button size="xl" className="w-full sm:w-auto gap-2">
                  Book Appointment
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-rose/10 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Why Choose Pretty Nails?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              We're committed to providing the best nail care experience in town.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                Our Services
              </h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                Discover our range of professional nail services
              </p>
            </div>
            <Link href="/services">
              <Button variant="outline" className="gap-2">
                View All Services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton variant="circular" width={64} height={64} className="mx-auto mb-4" />
                    <Skeleton variant="text" width="60%" className="mx-auto mb-2" />
                    <Skeleton variant="text" width="80%" className="mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: ServiceDto) => (
                <Link key={service.id} href={`/services#${service.id}`} className="block">
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                          <ShoppingBag className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {service.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {service.category.toLowerCase()}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(service.basePrice)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {service.duration} min
                          </span>
                        </div>
                        {service.variants.length > 1 && (
                          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                            {service.variants.length} variants available
                          </p>
                        )}
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
      <section className="py-20 lg:py-28 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Book in 3 Easy Steps
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Our simple booking process gets you in and out with beautiful nails.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center relative">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-primary">{step.number}</span>
                  </div>
                  {/* Connecting line */}
                  {step.number !== '03' && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                Our Work
              </h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                See some of our recent nail art creations
              </p>
            </div>
            <Link href="/gallery">
              <Button variant="outline" className="gap-2">
                View Gallery
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {galleryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                  <Skeleton variant="rectangular" className="h-full w-full" />
                </div>
              ))}
            </div>
          ) : gallery.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gallery.map((item: GalleryDto) => (
                <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.category && (
                        <p className="text-sm opacity-80 capitalize">{item.category.toLowerCase()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No gallery images yet</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 lg:p-16 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                Ready for Beautiful Nails?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Book your appointment today and experience the Pretty Nails difference.
                Your perfect nails are just a click away.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/booking">
                  <Button size="xl" variant="secondary" className="w-full sm:w-auto gap-2">
                    Book Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/availability">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto border-primary-foreground/20 hover:bg-primary-foreground/10">
                    Check Availability
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 border-t bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Services Offered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">5★</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Guarantee</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}