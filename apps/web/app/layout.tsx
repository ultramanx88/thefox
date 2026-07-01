import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'theFOX',
  description: 'Production marketplace for fresh local goods',
  icons: {
    icon: [
      { url: '/brand/thefox-logo-transparent.png', type: 'image/png' },
      { url: '/brand/thefox-app-icon.png', sizes: '1024x1024', type: 'image/png' }
    ],
    apple: [{ url: '/brand/thefox-app-icon.png', sizes: '1024x1024', type: 'image/png' }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
