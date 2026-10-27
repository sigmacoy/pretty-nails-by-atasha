"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Sparkles, Calendar, Award, ImageIcon, MapPin, Phone, Mail, Facebook, Instagram, User, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";

export default function HomePage() {
  const { data: session } = useSession();
  const [currentBooking, setCurrentBooking] = useState<any | null>(null);

  useEffect(() => {
    if (session?.user && session.user.role !== "ADMIN") {
      fetch("/api/bookings")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            const active = data.find((b: any) => b.status === "PENDING" || b.status === "CONFIRMED");
            setCurrentBooking(active || null);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const services = [
    {
      name: "Nail Gel",
      variants: [
        { name: "Small", price: 300 },
        { name: "Medium", price: 350 },
        { name: "Long", price: 400 },
      ],
      icon: Sparkles,
    },
    {
      name: "Soft Gel Extension",
      variants: [
        { name: "Small", price: 400 },
        { name: "Medium", price: 450 },
        { name: "Long", price: 500 },
      ],
      icon: Sparkles,
    },
    {
      name: "Nail Gel Pedicure",
      price: 300,
      icon: Sparkles,
    },
  ];

  const addOns = [
    { name: "Nail Art", price: "50-100" },
    { name: "French Tip", price: 10 },
    { name: "Ombre", price: 10 },
    { name: "Marble", price: 20 },
    { name: "Polka Dots", price: 10 },
    { name: "Gold/Silver Flakes", price: 20 },
    { name: "Cat Eye", price: 20 },
    { name: "Glitters", price: 20 },
    { name: "Metallic", price: 20 },
    { name: "Embossed Flower", price: 30 },
    { name: "Embossed", price: 20 },
    { name: "3D Effect", price: 30 },
    { name: "3D Mermaid/Shell", price: 30 },
    { name: "Big Stone", price: 20 },
    { name: "Pearl", price: 5 },
    { name: "Rhinestone", price: 5 },
    { name: "Blooming Gel", price: 20 },
    { name: "Matte Coat", price: 10 },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 tracking-tight">
              Pretty Nails{" "}
              <span className="text-primary-600">by Atasha</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
              "Life is too short to have naked nails"
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              {currentBooking ? (
                <Link
                  href="/appointments"
                  className="btn-primary px-8 py-3 text-lg w-full sm:w-auto flex items-center justify-center gap-2 shadow-md"
                >
                  <Clock className="h-5 w-5" />
                  View Current Appointment
                </Link>
              ) : (
                <Link
                  href="/booking"
                  className="btn-primary px-8 py-3 text-lg w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Calendar className="h-5 w-5" />
                  Book Appointment
                </Link>
              )}
              <Link
                href="/gallery"
                className="btn-outline px-8 py-3 text-lg w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-5 w-5" />
                View Gallery
              </Link>
            </div>

            {/* Prototype Quick Access / Account Banner */}
            <div className="mb-10 p-3.5 max-w-md mx-auto bg-white/90 backdrop-blur-sm border border-primary-200 rounded-xl shadow-xs text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary-800">
                  {session ? "Active Account" : "Quick Sign-In"}
                </span>
                <span className="text-[10px] bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full font-semibold">
                  {session ? "Logged In" : "Prototype Testing"}
                </span>
              </div>

              {session ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 text-primary-600 shrink-0" />
                      <span className="text-xs text-gray-800 font-medium truncate">
                        {session.user.name || session.user.email} ({session.user.role === "ADMIN" ? "Owner" : "Customer"})
                      </span>
                    </div>
                    <Link
                      href={session.user.role === "ADMIN" ? "/admin/dashboard" : "/profile"}
                      className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline shrink-0"
                    >
                      {session.user.role === "ADMIN" ? "Admin Portal →" : "My Profile →"}
                    </Link>
                  </div>

                  {/* Logged in customer: Current Appointment Notification */}
                  {currentBooking && (
                    <div className="mt-2 pt-2 border-t border-primary-100 bg-pink-50/80 p-2.5 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {formatDate(currentBooking.appointmentDate)} • {currentBooking.startTime}
                          </p>
                          <p className="text-[10px] text-primary-700 font-medium truncate">
                            {currentBooking.status === "PENDING" ? "Pending Confirmation" : "Confirmed Appointment"}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/appointments"
                        className="text-[11px] font-bold text-primary-800 bg-white px-2.5 py-1 rounded border border-primary-200 hover:bg-primary-50 shrink-0"
                      >
                        View Appointment
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login?callbackUrl=/booking"
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-pink-50 hover:bg-pink-100 text-primary-950 border border-primary-200 text-xs font-semibold text-center transition-colors"
                  >
                    Sign in as Client
                  </Link>
                  <Link
                    href="/login?callbackUrl=/admin/dashboard"
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold text-center transition-colors"
                  >
                    Sign in as Owner
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-500" />
                <span>Cebu City, Cebu, Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-500" />
                <span>0977 284 6167</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <Sparkles className="h-6 w-6 text-primary-400" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional nail care with personalized service and loyalty rewards
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Calendar}
              title="Easy Booking"
              description="Book your appointment online. Choose your preferred weekend date, time, and service with instant queue confirmation."
            />
            <FeatureCard
              icon={Award}
              title="Loyalty Rewards"
              description="Earn stamps with every visit. 9 stamps = 1 free nail set! Track your progress digitally with our QR code system."
            />
            <FeatureCard
              icon={ImageIcon}
              title="Design Gallery"
              description="Browse our portfolio of nail designs for inspiration. From classic gel to intricate 3D art - see what's possible."
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-pinkish/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional nail services tailored to your style. All prices in PHP.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {services.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>

          {/* Add-ons */}
          <div>
            <h3 className="font-display text-2xl font-bold text-gray-900 text-center mb-8">
              Add-ons (Per Nail)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {addOns.map((addon) => (
                <div
                  key={addon.name}
                  className="card p-4 text-center hover:shadow-md transition-shadow"
                >
                  <p className="font-medium text-gray-900 text-sm">{addon.name}</p>
                  <p className="text-primary-600 font-semibold mt-1">
                    ₱{typeof addon.price === "number" ? addon.price : addon.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Loyalty Program */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Loyalty Program
            </h2>
            <div className="card p-8 gradient-pinkish/50 border-primary-200">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600">9</div>
                  <div className="text-gray-600 font-medium">Stamps</div>
                </div>
                <div className="w-1 h-16 bg-gradient-to-b from-primary-300 to-primary-500 hidden md:block" />
                <div className="text-center">
                  <Award className="h-16 w-16 text-primary-500 mx-auto mb-2" />
                  <div className="font-bold text-gray-900 text-lg">Free Nail Set</div>
                </div>
              </div>
              <ul className="text-left space-y-3 max-w-md mx-auto text-gray-700 text-sm">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-500 shrink-0" />
                  <span>1 stamp per nail set service</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-500 shrink-0" />
                  <span>Or 1 stamp per ₱500 spent</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-500 shrink-0" />
                  <span>2 stamps for ₱1,000+ services</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-500 shrink-0" />
                  <span>Stamps valid for 12 months</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-500 shrink-0" />
                  <span>Scan shop QR code to add stamps to your account</span>
                </li>
              </ul>

              {/* Dynamic Loyalty CTA Button */}
              <div className="mt-8 flex items-center justify-center">
                {session ? (
                  <Link
                    href="/loyalty"
                    className="btn-primary px-6 py-2.5 inline-flex items-center gap-2 shadow-xs"
                  >
                    <Award className="h-5 w-5" />
                    View My Loyalty Card & Stamps
                  </Link>
                ) : (
                  <Link
                    href="/login?callbackUrl=/loyalty"
                    className="btn-primary px-6 py-2.5 inline-flex items-center gap-2 shadow-xs"
                  >
                    <Award className="h-5 w-5" />
                    Sign in to Check Your Stamps
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="font-display text-2xl font-bold text-white mb-4">
                Pretty Nails by Atasha
              </h3>
              <p className="text-gray-400 mb-6">
                "Life is too short to have naked nails"
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/prettynailsbyatasha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a
                  href="https://www.instagram.com/prettynailsbyatasha/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary-500" />
                  <span>0977 284 6167</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary-500" />
                  <span>prettynailsbyatasha@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  <span>Cebu City, Cebu, Philippines</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Hours</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <div>Saturday: 8:00 AM - 10:00 PM</div>
                <div>Sunday: 8:00 AM - 10:00 PM</div>
                <div className="text-primary-300 font-medium">Appointment Only</div>
                <div className="text-primary-300 font-medium">Max 4 clients per day</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-xs">
            <p>&copy; 2026 Pretty Nails by Atasha. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 text-center hover:shadow-lg transition-shadow h-full">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-600 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function ServiceCard({
  service,
}: {
  service: {
    name: string;
    variants?: { name: string; price: number }[];
    price?: number;
    icon: React.ComponentType<{ className?: string }>;
  };
}) {
  const Icon = service.icon;
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow h-full flex flex-col justify-between">
      <div>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-xl text-gray-900 mb-4 text-center">{service.name}</h3>
        {service.variants ? (
          <div className="space-y-2.5">
            {service.variants.map((variant) => (
              <div key={variant.name} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0 text-sm">
                <span className="text-gray-600">{variant.name}</span>
                <span className="font-semibold text-primary-600">₱{variant.price}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-3xl font-bold text-primary-600">₱{service.price}</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <Link
          href="/booking"
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
        >
          Book this service
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
