import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import './globals.scss';

export const metadata: Metadata = {
  title: 'theFOX',
  description: 'Production marketplace for fresh local goods',
  applicationName: 'theFOX',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'theFOX'
  },
  icons: {
    icon: [
      { url: '/brand/thefox-logo-transparent.png', type: 'image/png' },
      { url: '/brand/thefox-app-icon.png', sizes: '1024x1024', type: 'image/png' }
    ],
    apple: [{ url: '/brand/thefox-app-icon.png', sizes: '1024x1024', type: 'image/png' }]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
