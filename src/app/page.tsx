import Link from "next/link";
import { Sparkles, Calendar, Award, ImageIcon, MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";

export default function HomePage() {
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
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg mb-8 border border-primary-100">
              <span className="text-primary-600 font-medium">Appointment Only</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary-600 font-medium">Saturday & Sunday</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary-600 font-medium">8:00 AM - 10:00 PM</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 tracking-tight">
              Pretty Nails{" "}
              <span className="text-primary-600">by Atasha</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              "Life is too short to have naked nails"
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/booking"
                className="btn-primary px-8 py-3 text-lg w-full sm:w-auto"
              >
                Book Appointment
                <Calendar className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/gallery"
                className="btn-outline px-8 py-3 text-lg w-full sm:w-auto"
              >
                View Gallery
                <ImageIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-500" />
                <span>Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-500" />
                <span>0977 284 6167</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <Sparkles className="h-8 w-8 text-primary-400" />
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
              description="Book your appointment online 24/7. Choose your preferred date, time, and service. We'll confirm within hours."
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
          <div className="mb-16">
            <h3 className="font-display text-2xl font-bold text-gray-900 text-center mb-8">
              Add-ons (Per Nail)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {addOns.map((addon) => (
                <div
                  key={addon.name}
                  className="card p-4 text-center hover:shadow-md transition-shadow"
                >
                  <p className="font-medium text-gray-900">{addon.name}</p>
                  <p className="text-primary-600 font-semibold">
                    ₱{typeof addon.price === 'number' ? addon.price : addon.price}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link href="/booking" className="btn-primary px-8 py-3 text-lg inline-flex">
              View All Services & Book
              <Calendar className="ml-2 h-5 w-5" />
            </Link>
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
            <div className="card p-8 gradient-pinkish/50">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600">9</div>
                  <div className="text-gray-600">Stamps</div>
                </div>
                <div className="w-1 h-16 bg-gradient-to-b from-primary-300 to-primary-500 hidden md:block" />
                <div className="text-center">
                  <Award className="h-16 w-16 text-primary-500 mx-auto mb-2" />
                  <div className="font-bold text-gray-900">Free Nail Set</div>
                </div>
              </div>
              <ul className="text-left space-y-3 max-w-md mx-auto text-gray-700">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-500" />
                  <span>1 stamp per nail set service</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-500" />
                  <span>Or 1 stamp per ₱500 spent</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-500" />
                  <span>2 stamps for ₱1,000+ services</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-500" />
                  <span>Stamps valid for 12 months</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-500" />
                  <span>Scan QR code after payment to claim</span>
                </li>
              </ul>
              <Link href="/loyalty" className="btn-primary mt-6 inline-flex">
                Check Your Stamps
                <Award className="ml-2 h-5 w-5" />
              </Link>
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
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <span>0977 284 6167</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <span>prettynailsbyatasha@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>Philippines</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Hours</h4>
              <div className="space-y-2 text-gray-400">
                <div>Saturday: 8:00 AM - 10:00 PM</div>
                <div>Sunday: 8:00 AM - 10:00 PM</div>
                <div className="text-primary-300 text-sm">Appointment Only</div>
                <div className="text-primary-300 text-sm">Max 4 clients per day</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; 2024 Pretty Nails by Atasha. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="card p-6 text-center hover:shadow-lg transition-shadow h-full">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function ServiceCard({ service }: { service: { name: string; variants?: { name: string; price: number }[]; price?: number; icon: React.ComponentType<{ className?: string }> } }) {
  const Icon = service.icon;
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow h-full">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-600 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-semibold text-xl text-gray-900 mb-4 text-center">{service.name}</h3>
      {service.variants ? (
        <div className="space-y-3">
          {service.variants.map((variant) => (
            <div key={variant.name} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">{variant.name}</span>
              <span className="font-semibold text-primary-600">₱{variant.price}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <span className="text-3xl font-bold text-primary-600">₱{service.price}</span>
        </div>
      )}
    </div>
  );
}