import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.taladman.com'),
  title: {
    default: 'TaladMan - Your Market, Delivered',
    template: '%s | TaladMan',
  },
  description: 'Your local marketplace, connected. Discover fresh ingredients from local markets, delivered directly to your doorstep.',
  openGraph: {
    title: 'TaladMan - Your Market, Delivered',
    description: 'Your local marketplace, connected.',
    url: 'https://www.taladman.com',
    siteName: 'TaladMan',
    locale: 'th_TH',
    type: 'website',
  },
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
      </head>
      <body
        className={cn(
          'font-body antialiased',
          'bg-background'
        )}
      >
        {children}
      </body>
    </html>
  );
}
