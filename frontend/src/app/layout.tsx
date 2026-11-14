import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Newsreader } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: {
    default: 'Pretty Nails by Atasha · Cebu City',
    template: '%s | Pretty Nails by Atasha · Cebu City',
  },
  description: 'Private 1-on-1 atelier specializing in structured BIAB overlays, Russian dry manicure, and bespoke nail art in Cebu City.',
  keywords: ['nail salon', 'biab', 'russian manicure', 'structured gel', 'nail art', 'cebu city', 'philippines'],
  authors: [{ name: 'Pretty Nails by Atasha' }],
  creator: 'Pretty Nails by Atasha',
  publisher: 'Pretty Nails by Atasha',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: 'https://prettynails.ph',
    siteName: 'Pretty Nails by Atasha',
    title: 'Pretty Nails by Atasha · Cebu City',
    description: 'Private 1-on-1 atelier specializing in structured BIAB overlays, Russian dry manicure, and bespoke nail art in Cebu City.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pretty Nails by Atasha · Cebu City',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pretty Nails by Atasha · Cebu City',
    description: 'Private 1-on-1 atelier specializing in structured BIAB overlays and Russian manicure in Cebu City.',
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
    { media: '(prefers-color-scheme: light)', color: '#FFF0F3' },
    { media: '(prefers-color-scheme: dark)', color: '#160D12' },
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
    <html lang="en" className={`${instrumentSans.variable} ${newsreader.variable} antialiased`} suppressHydrationWarning>
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
                toast:
                  'bg-[#FFF0F3] dark:bg-[#160D12] text-stone-900 dark:text-stone-100 border border-rose-200/80 dark:border-rose-950/60 shadow-md font-sans rounded-xl text-xs sm:text-sm',
                description: 'text-stone-600 dark:text-stone-400 text-xs',
                actionButton:
                  'bg-rose-900 hover:bg-rose-950 text-white rounded-lg text-xs font-medium px-3 py-1.5 transition-colors',
                cancelButton:
                  'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium px-3 py-1.5 transition-colors',
                success: 'border-rose-200/80 dark:border-rose-950/60 text-stone-900 dark:text-stone-100',
                error: 'border-rose-300 dark:border-rose-900 text-stone-900 dark:text-stone-100',
                info: 'border-rose-200/80 dark:border-rose-950/60 text-stone-900 dark:text-stone-100',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}