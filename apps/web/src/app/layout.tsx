import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { PWAProvider } from '@/components/pwa/pwa-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://thefox-sp7zz.web.app'),
  title: {
    default: 'theFOX - Your Market, Delivered',
    template: '%s | theFOX',
  },
  description: 'Your local marketplace, connected. Discover fresh ingredients from local markets, delivered directly to your doorstep.',
  applicationName: 'theFOX',
  authors: [{ name: 'theFOX Team' }],
  generator: 'Next.js',
  keywords: ['marketplace', 'local market', 'food delivery', 'fresh ingredients', 'Thailand'],
  referrer: 'origin-when-cross-origin',
  creator: 'theFOX Team',
  publisher: 'theFOX',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'theFOX',
  },
  openGraph: {
    title: 'theFOX - Your Market, Delivered',
    description: 'Your local marketplace, connected.',
    url: 'https://thefox-sp7zz.web.app',
    siteName: 'theFOX',
    locale: 'th_TH',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'theFOX - Your Market, Delivered',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'theFOX - Your Market, Delivered',
    description: 'Your local marketplace, connected.',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ff6b35' },
    { media: '(prefers-color-scheme: dark)', color: '#ff6b35' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="theFOX" />
        <meta name="msapplication-TileColor" content="#ff6b35" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={cn(
          'font-body antialiased',
          'bg-background'
        )}
      >
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
