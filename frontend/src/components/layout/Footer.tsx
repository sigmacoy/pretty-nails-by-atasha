import Link from 'next/link';
import { Facebook, Instagram, MapPin, Phone, Clock } from 'lucide-react';
import { StudioMark } from './Header';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: 'Gel nails', href: '/services?category=GEL' },
      { name: 'Extensions', href: '/services?category=EXTENSION' },
      { name: 'Pedicure', href: '/services?category=PEDICURE' },
      { name: 'Add-ons', href: '/services?category=ADDON' },
    ],
    studio: [
      { name: 'Gallery', href: '/gallery' },
      { name: 'Loyalty program', href: '/loyalty' },
      { name: 'Availability', href: '/availability' },
      { name: 'Book appointment', href: '/booking' },
    ],
    support: [
      { name: 'Sanitization policy', href: '/#features' },
      { name: 'Booking policy', href: '/#booking-guide' },
      { name: 'Privacy policy', href: '#' },
      { name: 'Terms of service', href: '#' },
    ],
  };

  const contactInfo = {
    address: 'Sitio Sto. Niño B, Aranas Extension, Cebu City',
    phone: '+63 977 284 6167',
    hours: 'Mon – Sat: 9:00 AM – 7:00 PM',
  };

  return (
    <footer className="border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-950/40 text-stone-700 dark:text-stone-300" id="contact">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Pretty Nails by Atasha">
              <StudioMark size="md" />
              <div className="flex flex-col">
                <span className="font-medium text-base tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                  Pretty Nails
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                  by Atasha
                </span>
              </div>
            </Link>
            <p className="mt-3.5 max-w-xs text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Studio manicures, soft gel extensions, and custom nail art crafted on the manicure table in Cebu City.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://facebook.com/prettynailsbyatasha"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 stroke-[1.5]" />
              </a>
              <a
                href="https://instagram.com/prettynailsbyatasha"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 stroke-[1.5]" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-xs tracking-tight text-stone-900 dark:text-stone-100">
              Services
            </h3>
            <ul className="mt-3 space-y-2.5" role="list">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-xs tracking-tight text-stone-900 dark:text-stone-100">
              Studio
            </h3>
            <ul className="mt-3 space-y-2.5" role="list">
              {footerLinks.studio.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-xs tracking-tight text-stone-900 dark:text-stone-100">
              Visit & hours
            </h3>
            <address className="mt-3 not-italic text-sm text-stone-600 dark:text-stone-400 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 stroke-[1.5] text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{contactInfo.address}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 stroke-[1.5] text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                <a href={`tel:${contactInfo.phone}`} className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                  {contactInfo.phone}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 stroke-[1.5] text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{contactInfo.hours}</span>
              </div>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
          <p className="text-center text-xs text-stone-500 dark:text-stone-400">
            &copy; {currentYear} Pretty Nails by Atasha. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
