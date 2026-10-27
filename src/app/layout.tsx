import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pretty Nails by Atasha",
  description: "Life is too short to have naked nails - Professional nail services by Atasha",
  keywords: ["nail salon", "nail art", "gel nails", "nail extensions", "pedicure", "Philippines"],
  authors: [{ name: "Pretty Nails by Atasha" }],
  creator: "Pretty Nails by Atasha",
  publisher: "Pretty Nails by Atasha",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://prettynailsbyatasha.vercel.app",
    siteName: "Pretty Nails by Atasha",
    title: "Pretty Nails by Atasha",
    description: "Life is too short to have naked nails - Professional nail services by Atasha",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Pretty Nails by Atasha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pretty Nails by Atasha",
    description: "Life is too short to have naked nails - Professional nail services by Atasha",
    images: ["/logo.jpg"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fce4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#f8bbd0" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" class={`${inter.variable} ${playfair.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gradient-hero font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}