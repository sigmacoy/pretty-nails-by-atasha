import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Pretty Nails by Atasha - Premier Nail Salon',
    template: '%s | Pretty Nails by Atasha',
  },
  description: 'Professional nail salon services including gel nails, extensions, pedicure, and nail art. Book your appointment online.',
  keywords: ['nail salon', 'gel nails', 'nail extensions', 'pedicure', 'nail art', 'manila', 'philippines'],
  authors: [{ name: 'Pretty Nails by Atasha' }],
  creator: 'Pretty Nails by Atasha',
  publisher: 'Pretty Nails by Atasha',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: 'https://prettynails.ph',
    siteName: 'Pretty Nails by Atasha',
    title: 'Pretty Nails by Atasha - Premier Nail Salon',
    description: 'Professional nail salon services including gel nails, extensions, pedicure, and nail art.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pretty Nails by Atasha',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pretty Nails by Atasha',
    description: 'Professional nail salon services in Manila.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'bg-background text-foreground border shadow-lg',
                description: 'text-muted-foreground',
                actionButton: 'bg-primary text-primary-foreground',
                cancelButton: 'bg-muted text-muted-foreground',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}