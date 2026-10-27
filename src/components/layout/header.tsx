"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut, LayoutDashboard, Award, ImageIcon, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not render customer header inside admin portal (admin layout has its own dedicated sidebar)
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/booking", label: "Book Appointment", icon: Calendar },
    { href: "/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/loyalty", label: "Loyalty Card", icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary-100 bg-white/90 backdrop-blur-md">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between" aria-label="Main navigation">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
            Pretty Nails <span className="text-primary-600">by Atasha</span>
          </span>
        </Link>

        {/* Desktop Nav Links - Only visible when customer or owner is signed in */}
        {session && (
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg",
                    isActive
                      ? "text-primary-700 bg-primary-50 font-semibold"
                      : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 text-primary-500" />}
                  {link.label}
                </Link>
              );
            })}

            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                className="text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-semibold"
              >
                <LayoutDashboard className="h-4 w-4 text-primary-700" />
                Admin Portal
              </Link>
            )}
          </div>
        )}

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 py-1 px-2.5 rounded-lg hover:bg-primary-50 transition-colors"
                title="View Profile & Bookings"
              >
                <Avatar className="h-8 w-8 border border-primary-200">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                  <AvatarFallback className="bg-primary-100 text-primary-800 font-semibold text-xs">
                    {session.user.name?.[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <span className="text-xs font-semibold text-gray-900 block truncate max-w-[120px]">
                    {session.user.name || "My Account"}
                  </span>
                  <span className="text-[10px] text-primary-600 block">
                    {session.user.role === "ADMIN" ? "Owner" : "Customer"}
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-gray-500 hover:text-gray-900 h-8 px-2"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs border-primary-200 text-primary-900 bg-white hover:bg-primary-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/booking">
                <Button size="sm" className="h-9 px-4 text-xs bg-primary-600 hover:bg-primary-700 text-white shadow-xs">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Book Now
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Actions / Toggle */}
        <div className="md:hidden flex items-center gap-2">
          {!session ? (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs border-primary-200 text-primary-900 bg-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/booking">
                <Button size="sm" className="h-8 px-3 text-xs bg-primary-600 hover:bg-primary-700 text-white">
                  Book Now
                </Button>
              </Link>
            </div>
          ) : (
            <button
              className="p-2 rounded-lg text-gray-700 hover:bg-primary-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-primary-600" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Drawer - Only for signed-in users */}
      {session && mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 text-gray-800 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {Icon && <Icon className="h-4 w-4 text-primary-500" />}
                  {link.label}
                </Link>
              );
            })}

            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                className="px-3 py-2.5 text-primary-800 bg-primary-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 text-primary-700" />
                Admin Portal
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <Link
              href="/profile"
              className="px-3 py-2 text-gray-800 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="h-4 w-4 text-primary-500" />
              My Profile & Appointments ({session.user.name})
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-gray-600 justify-start"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
