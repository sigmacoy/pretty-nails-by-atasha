"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut, LayoutDashboard, Award, ImageIcon, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/booking", label: "Book Appointment", icon: Calendar },
    { href: "/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/loyalty", label: "Loyalty", icon: Award },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    { href: "/admin/schedule", label: "Schedule", icon: Calendar },
    { href: "/admin/services", label: "Services", icon: ImageIcon },
    { href: "/admin/customers", label: "Customers", icon: User },
    { href: "/admin/loyalty", label: "Loyalty", icon: Award },
    { href: "/admin/reports", label: "Reports", icon: LayoutDashboard },
    { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  ];

  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-bold text-gray-900">
            Pretty Nails by Atasha
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="font-display text-2xl font-bold text-gray-900">
          Pretty Nails by Atasha
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}

          {session && session.user.role === "ADMIN" && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-4">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1"
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                  <AvatarFallback>{session.user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{session.user.name}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs border-primary-200 text-primary-800 bg-primary-50 hover:bg-primary-100">
                  Sign in as Client
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="text-xs bg-primary-600 hover:bg-primary-700 text-white">
                  Sign in as Owner
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t bg-white py-4">
          <div className="container mx-auto px-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon && <link.icon className="h-5 w-5" />}
                {link.label}
              </Link>
            ))}

            {session && session.user.role === "ADMIN" && (
              <>
                <div className="border-t my-2" />
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.icon && <link.icon className="h-5 w-5" />}
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {session ? (
              <div className="border-t pt-4 space-y-2">
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="border-t pt-4 space-y-2">
                <Link
                  href="/login"
                  className="block px-3 py-2 text-primary-900 bg-primary-50 rounded-lg text-sm font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in as Client
                </Link>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-white bg-primary-600 rounded-lg text-sm font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in as Owner
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}