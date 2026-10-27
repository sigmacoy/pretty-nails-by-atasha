import Link from "next/link";
import { Facebook, Instagram, Phone, Mail, MapPin, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary-400" />
              <span className="font-display text-2xl font-bold text-white">Pretty Nails by Atasha</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              "Life is too short to have naked nails"
            </p>
            <p className="text-gray-500 text-sm mb-6 max-w-md">
              Professional nail services by Atasha. Specializing in gel nails, soft gel extensions, nail art, and pedicures.
              Appointment only on Saturdays and Sundays.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/prettynailsbyatasha"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://www.instagram.com/prettynailsbyatasha/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <div className="space-y-3 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary-400" />
                <a href="tel:+639772846167" className="hover:text-primary-400 transition-colors">0977 284 6167</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary-400" />
                <a href="mailto:prettynailsbyatasha@gmail.com" className="hover:text-primary-400 transition-colors">prettynailsbyatasha@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-400" />
                <span>Cebu City, Cebu, Philippines</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Hours & Booking</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <div>Saturday: 8:00 AM - 10:00 PM</div>
              <div>Sunday: 8:00 AM - 10:00 PM</div>
              <div className="text-primary-300">Appointment Only</div>
              <div className="text-primary-300">Max 4 clients per day</div>
              <div className="text-primary-300">Book 1 month in advance</div>
              <Link
                href="/booking"
                className="inline-block mt-4 text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                Book Now →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Pretty Nails by Atasha. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}