import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { locales } from '@/i18n';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'TaladMan',
  description: 'Your local marketplace, connected.',
};

export default function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  if (!locales.includes(locale)) {
    notFound();
  }
  const messages = useMessages();
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
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
