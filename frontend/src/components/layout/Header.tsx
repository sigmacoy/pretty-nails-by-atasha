'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Calendar, User, LogOut, LayoutDashboard, Award } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/lib/auth';

/**
 * Signature Lacquer Drop Studio Mark for Pretty Nails by Atasha
 */
export function StudioMark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const iconDims = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 text-primary shrink-0 transition-colors',
        dims,
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className={iconDims}
      >
        <path d="M10 2.5C10 2.5 5 9.2 5 13a5 5 0 0 0 10 0c0-3.8-5-10.5-5-10.5Z" />
      </svg>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Availability', href: '/availability' },
  ];

  const customerLinks = [
    { name: 'My bookings', href: '/my-bookings', icon: Calendar },
    { name: 'Loyalty card', href: '/loyalty', icon: Award },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16" aria-label="Main navigation">
        <div className="flex items-center gap-8 lg:gap-10">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Pretty Nails by Atasha">
            <StudioMark size="md" />
            <div className="flex flex-col">
              <span className="font-medium text-base tracking-tight text-stone-900 dark:text-stone-100 leading-tight group-hover:text-primary transition-colors">
                Pretty Nails
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                by Atasha
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex lg:items-center lg:gap-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors py-1',
                    isActive
                      ? 'text-stone-900 dark:text-stone-100 border-b-2 border-primary -mb-0.5'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 rounded-full p-0 border border-stone-200/60 dark:border-stone-700/60"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <Avatar
                  src={user?.image}
                  name={user?.name}
                  size="sm"
                  className="h-8 w-8"
                />
              </Button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-1.5 shadow-float z-50">
                    <div className="px-3 py-2 border-b border-stone-200/60 dark:border-stone-800/60 mb-1">
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{user?.name}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 mt-1 capitalize">
                        {user?.role}
                      </span>
                    </div>

                    {isAdmin ? (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 stroke-[1.5] text-stone-500" />
                        Admin dashboard
                      </Link>
                    ) : (
                      customerLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <link.icon className="h-4 w-4 stroke-[1.5] text-stone-500" />
                          {link.name}
                        </Link>
                      ))
                    )}

                    <div className="my-1 border-t border-stone-200/60 dark:border-stone-800/60" />
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="h-4 w-4 stroke-[1.5]" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          )}

          <button
            className="lg:hidden p-2 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-5 w-5 stroke-[1.5]" /> : <Menu className="h-5 w-5 stroke-[1.5]" />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div id="mobile-menu" className="lg:hidden border-t border-stone-200/80 dark:border-stone-800/80 bg-background/98 px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="my-3 border-t border-stone-200/60 dark:border-stone-800/60" />
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin dashboard
                </Link>
              ) : (
                customerLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))
              )}
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Log in</Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button size="sm" className="w-full">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
