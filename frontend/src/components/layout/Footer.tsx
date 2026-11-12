import Link from 'next/link';
import { ShoppingBag, Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: 'Gel Nails', href: '/services?category=GEL' },
      { name: 'Extensions', href: '/services?category=EXTENSION' },
      { name: 'Pedicure', href: '/services?category=PEDICURE' },
      { name: 'Add-ons', href: '/services?category=ADDON' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Gallery', href: '/gallery' },
      { name: 'Loyalty Program', href: '/loyalty' },
      { name: 'Contact', href: '#contact' },
    ],
    support: [
      { name: 'FAQ', href: '#' },
      { name: 'Booking Policy', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
    ],
  };

  const contactInfo = {
    address: '123 Beauty Street, Manila, Philippines',
    phone: '+63 9XX XXX XXXX',
    email: 'hello@prettynails.ph',
    hours: 'Mon-Sat: 9:00 AM - 9:00 PM | Sun: 10:00 AM - 6:00 PM',
  };

  return (
    <footer className="border-t bg-muted/30" id="contact">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2" aria-label="Pretty Nails Home">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                Pretty Nails
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-gray-500 dark:text-gray-400">
              Your premier nail salon for beautiful, healthy nails.
              Professional services in a relaxing atmosphere.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Services</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Company</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Support</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Contact Us</h3>
            <address className="mt-4 not-italic text-sm text-gray-500 dark:text-gray-400 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p>{contactInfo.address}</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                <a href={`tel:${contactInfo.phone}`} className="hover:text-primary transition-colors">
                  {contactInfo.phone}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-primary transition-colors">
                  {contactInfo.email}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p>{contactInfo.hours}</p>
              </div>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {currentYear} Pretty Nails by Atasha. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}